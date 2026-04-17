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
import { logger } from '../../utils/logger.js';
import { getIO } from '../../socket.js';

async function processPipelineAnalysis(job) {
  const { projectId, pipelineId, ref } = job.data;
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
    sonarqubeService.fetchIssues(String(projectId)).catch(err => {
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

  // Step 8: Save vulnerabilities
  if (vulnerabilities.length > 0) {
    const vulnDocs = vulnerabilities.map(v => ({
      ...v,
      projectId: String(projectId),
      pipelineId: String(pipelineId),
    }));
    await Vulnerability.insertMany(vulnDocs, { ordered: false }).catch(err => {
      logger.warn('Some vulnerabilities failed to insert', { error: err.message });
    });
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
