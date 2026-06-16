import { Worker } from 'bullmq';
import { bullmqConnection } from '../../config/redis.js';
import { gitlabService } from '../../services/gitlab/gitlab.service.js';
import { logCollectionService } from '../../services/gitlab/logCollection.service.js';
import { sonarqubeService } from '../../services/sonarqube/sonarqube.service.js';
import { trivyService } from '../../services/trivy/trivy.service.js';
import { normalizerService } from '../../services/normalizer/normalizer.service.js';
import { rootCauseAnalyzer } from '../../ai/rootCause.analyzer.js';
import { Pipeline } from '../../models/Pipeline.model.js';
import { Analysis } from '../../models/Analysis.model.js';
import { Vulnerability } from '../../models/Vulnerability.model.js';
import { Incident } from '../../models/Incident.model.js';
import { mrCommentService } from '../../services/mrComment.service.js';
import { knowledgeBaseService } from '../../services/knowledgeBase.service.js';
import { logger } from '../../utils/logger.js';
import { getIO } from '../../socket.js';

async function processPipelineAnalysis(job) {
  const { projectId, projectName, pipelineId, ref, status } = job.data;
  const sonarKey = projectName || String(projectId);
  logger.info('Processing pipeline analysis job', { jobId: job.id, projectId, pipelineId });

  // Step 1: Fetch pipeline data (graceful — proceed even if GitLab API is unavailable)
  await job.updateProgress(10);
  const pipelineData = await gitlabService.fetchPipeline(projectId, pipelineId).catch(err => {
    logger.warn('Could not fetch pipeline from GitLab API', { error: err.message, projectId, pipelineId });
    return null;
  });

  // Step 2: Save pipeline to DB
  const failedJobs = (pipelineData?.jobs || [])
    .filter(j => j.status === 'failed')
    .map(j => ({ jobId: String(j.id), jobName: j.name, stage: j.stage }));

  await Pipeline.findOneAndUpdate(
    { pipelineId: String(pipelineId) },
    {
      pipelineId: String(pipelineId),
      projectId: String(projectId),
      projectName: pipelineData?.project?.name || String(projectId),
      ref: ref || pipelineData?.ref,
      status: pipelineData?.status || 'failed',
      failedJobs,
      triggeredBy: pipelineData?.user?.name || 'unknown',
      webUrl: pipelineData?.web_url,
      createdAt: pipelineData?.created_at ? new Date(pipelineData.created_at) : new Date(),
      finishedAt: pipelineData?.finished_at ? new Date(pipelineData.finished_at) : null,
      duration: pipelineData?.duration,
    },
    { upsert: true, new: true }
  );
  logger.info('Pipeline saved', { pipelineId });

  // Step 3 & 4: Collect logs + sonar/trivy in parallel
  await job.updateProgress(30);
  const [jobLogs, sonarIssues, vulnerabilities, commits] = await Promise.all([
    logCollectionService.collectLogs(projectId, pipelineId).catch(err => {
      logger.error('Log collection failed', { error: err.message });
      return [];
    }),
    sonarqubeService.fetchIssues(sonarKey).catch(err => {
      logger.error('SonarQube fetch failed', { error: err.message });
      return { critical: [], major: [], total: 0 };
    }),
    trivyService.fetchFromGitlabArtifact(projectId, pipelineId).catch(err => {
      logger.warn('Trivy fetch failed', { error: err.message });
      return [];
    }),
    gitlabService.fetchCommits(projectId, ref || 'main', null).catch(() => []),
  ]);

  await job.updateProgress(60);

  // Step 5: Normalize
  const normalizedData = normalizerService.normalize({
    pipeline: pipelineData || { pipelineId, projectId, ref },
    jobLogs,
    sonarIssues,
    vulnerabilities,
    commits,
  });

  // Step 6: AI Analysis
  await job.updateProgress(75);
  const analysisResult = await rootCauseAnalyzer.analyze(normalizedData);

  // Step 6b: Reuse a previously validated fix from the knowledge base, if this error recurred
  const cachedSolution = await knowledgeBaseService
    .findCachedSolution(analysisResult.errorType, analysisResult.rootCause || '')
    .catch(() => null);
  if (cachedSolution) {
    analysisResult.suggestedFixes = [
      {
        priority: 'high',
        description: `[Known fix, used ${cachedSolution.usedCount}x] ${cachedSolution.solution}`,
        command: cachedSolution.command,
        codeHint: cachedSolution.codeHint,
      },
      ...(analysisResult.suggestedFixes || []),
    ];
    logger.info('Knowledge base cache hit applied to analysis', {
      signature: cachedSolution.errorSignature,
      pipelineId,
    });
  }

  // Step 7: Save Analysis
  await job.updateProgress(85);
  const logsSample = jobLogs.flatMap(j => (j.errorLines || []).slice(0, 5));

  const analysis = await Analysis.findOneAndUpdate(
    { pipelineId: String(pipelineId) },
    {
      pipelineId: String(pipelineId),
      projectId: String(projectId),
      errorType: analysisResult.errorType || 'unknown',
      rootCause: analysisResult.rootCause,
      summary: analysisResult.summary,
      confidence: analysisResult.confidence,
      riskLevel: analysisResult.riskLevel || 'medium',
      suggestedFixes: analysisResult.suggestedFixes || [],
      affectedFiles: analysisResult.affectedFiles || [],
      processingTime: analysisResult.processingTime,
      rawData: {
        logsSample: logsSample.slice(0, 20),
        sonarIssuesCount: sonarIssues?.total || 0,
        vulnCount: vulnerabilities.length,
      },
    },
    { upsert: true, new: true }
  );

  // Step 7b: Auto-create an incident for failed pipelines
  const resolvedStatus = status || pipelineData?.status;
  if (resolvedStatus === 'failed') {
    await Incident.findOneAndUpdate(
      { pipelineId: String(pipelineId) },
      {
        $setOnInsert: {
          incidentId: `INC-${pipelineId}`,
          title: `${(analysisResult.errorType || 'unknown').replace(/_/g, ' ')} — pipeline #${pipelineId} failed`,
          projectId: String(projectId),
          projectName: pipelineData?.project?.name || projectName || String(projectId),
          pipelineId: String(pipelineId),
          severity: analysisResult.riskLevel || 'medium',
          status: 'open',
          detectedAt: new Date(),
          analysis: analysis._id,
          timeline: [{
            timestamp: new Date(),
            actor: 'AIOps Bot',
            action: 'detected',
            message: analysisResult.rootCause || analysisResult.summary || 'Pipeline failure detected',
          }],
        },
      },
      { upsert: true }
    ).catch(err => {
      logger.warn('Failed to create incident', { error: err.message, pipelineId });
    });
    logger.info('Incident ensured for failed pipeline', { pipelineId });
  }

  // Step 7c: Post AI analysis as a comment on the related merge request, if any
  if (resolvedStatus === 'failed') {
    mrCommentService.findMRForBranch(projectId, ref).then(async (mr) => {
      if (mr) {
        await mrCommentService.postComment(projectId, mr.iid, analysisResult, { pipelineId });
      }
    }).catch(err => {
      logger.warn('MR comment posting skipped', { error: err.message, pipelineId });
    });
  }

  // Step 8: Save vulnerabilities (upsert to avoid duplicates)
  if (vulnerabilities.length > 0) {
    const ops = vulnerabilities.map(v => ({
      updateOne: {
        filter: { cveId: v.cveId, projectId: String(projectId), packageName: v.packageName },
        update: { $set: { ...v, projectId: String(projectId), pipelineId: String(pipelineId) } },
        upsert: true,
      },
    }));
    await Vulnerability.bulkWrite(ops, { ordered: false }).catch(err => {
      logger.warn('Some vulnerabilities failed to upsert', { error: err.message });
    });
    logger.info('Vulnerabilities saved', { count: vulnerabilities.length, pipelineId });
  }

  // Step 9: Emit socket event
  await job.updateProgress(100);
  try {
    const io = getIO();
    if (io) {
      io.emit('analysis:complete', {
        pipelineId: String(pipelineId),
        projectId: String(projectId),
        analysis: analysis.toObject(),
      });
    }
  } catch (socketErr) {
    logger.warn('Failed to emit socket event', { error: socketErr.message });
  }

  logger.info('Pipeline analysis job completed', { jobId: job.id, pipelineId });
  return { pipelineId, analysisId: analysis._id };
}

export const pipelineAnalysisWorker = new Worker(
  'pipeline-analysis',
  processPipelineAnalysis,
  {
    connection: bullmqConnection,
    concurrency: 5,
  }
);

pipelineAnalysisWorker.on('completed', (job, result) => {
  logger.info('Pipeline analysis worker job completed', { jobId: job.id, result });
});

pipelineAnalysisWorker.on('failed', (job, err) => {
  logger.error('Pipeline analysis worker job failed', {
    jobId: job?.id,
    error: err.message,
    attempts: job?.attemptsMade,
  });
});
