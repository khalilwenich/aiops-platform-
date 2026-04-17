class NormalizerService {
  normalize({ pipeline, jobLogs, sonarIssues, vulnerabilities, commits }) {
    const failedStages = [
      ...new Set((jobLogs || []).map(j => j.stage).filter(Boolean)),
    ];

    const logSnippets = (jobLogs || []).map(job => ({
      jobId: job.jobId,
      jobName: job.jobName,
      stage: job.stage,
      errorLines: (job.errorLines || job.logs || []).slice(-20),
    }));

    const criticalIssues = [
      ...(sonarIssues?.critical || []).slice(0, 10).map(i => ({
        severity: 'CRITICAL',
        message: i.message,
        component: i.component,
        rule: i.rule,
      })),
    ];

    const criticalVulns = (vulnerabilities || [])
      .filter(v => v.severity === 'CRITICAL' || v.severity === 'HIGH')
      .slice(0, 10)
      .map(v => ({
        cveId: v.cveId,
        packageName: v.packageName,
        severity: v.severity,
        title: v.title,
        fixedVersion: v.fixedVersion,
      }));

    const recentCommits = (commits || []).slice(0, 10).map(c => ({
      hash: c.id || c.short_id,
      author: c.author_name,
      message: c.title || c.message,
      timestamp: c.created_at,
    }));

    const sourcesAvailable = ['gitlab'];
    if ((sonarIssues?.total || 0) > 0) sourcesAvailable.push('sonarqube');
    if ((vulnerabilities || []).length > 0) sourcesAvailable.push('trivy');

    return {
      pipelineContext: {
        id: pipeline?.id || pipeline?.pipelineId,
        projectId: pipeline?.project_id || pipeline?.projectId,
        ref: pipeline?.ref,
        failedStages,
        triggeredBy: pipeline?.user?.name || pipeline?.triggeredBy || 'unknown',
      },
      errorSignals: {
        logSnippets,
        criticalIssues,
        criticalVulns,
        recentCommits,
      },
      metadata: {
        collectedAt: new Date(),
        sourcesAvailable,
      },
    };
  }
}

export const normalizerService = new NormalizerService();
