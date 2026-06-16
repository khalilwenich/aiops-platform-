import { gitlabService } from './gitlab/gitlab.service.js';
import { sonarqubeService } from './sonarqube/sonarqube.service.js';
import { trivyService } from './trivy/trivy.service.js';
import { logger } from '../utils/logger.js';

class CorrelationService {
  buildCorrelationKey(webhookPayload) {
    const obj = webhookPayload.object_attributes || {};
    return {
      correlationId: `inc_${obj.id}`,
      commitSha:     obj.sha || '',
      shortSha:      (obj.sha || '').slice(0, 8),
      projectId:     String(webhookPayload.project?.id || webhookPayload.project_id || ''),
      projectName:   webhookPayload.project?.name || '',
      branch:        obj.ref || 'main',
      author:        webhookPayload.user?.username || 'unknown',
      pipelineId:    String(obj.id || ''),
      triggeredAt:   obj.created_at ? new Date(obj.created_at) : new Date(),
    };
  }

  async correlateAllSources(correlationKey) {
    const { projectId, pipelineId, branch } = correlationKey;

    const [gitlabData, sonarData, trivyData, commitHistory] = await Promise.allSettled([
      this.fetchGitLabData(projectId, pipelineId),
      this.fetchSonarData(projectId, branch),
      this.fetchTrivyData(projectId, pipelineId),
      this.fetchCommitHistory(projectId, correlationKey.commitSha),
    ]);

    return {
      correlationKey,
      sources: {
        gitlab:  gitlabData.status  === 'fulfilled' ? gitlabData.value  : null,
        sonar:   sonarData.status   === 'fulfilled' ? sonarData.value   : null,
        trivy:   trivyData.status   === 'fulfilled' ? trivyData.value   : null,
        commits: commitHistory.status === 'fulfilled' ? commitHistory.value : null,
      },
      sourcesAvailable: [
        gitlabData.status  === 'fulfilled' && 'gitlab',
        sonarData.status   === 'fulfilled' && 'sonarqube',
        trivyData.status   === 'fulfilled' && 'trivy',
        commitHistory.status === 'fulfilled' && 'git',
      ].filter(Boolean),
      correlatedAt: new Date(),
    };
  }

  calculateRiskScore(correlatedData) {
    let score = 0;
    const { sources } = correlatedData;

    if (sources.trivy && Array.isArray(sources.trivy)) {
      const critical = sources.trivy.filter(v => v.severity === 'CRITICAL').length;
      const high     = sources.trivy.filter(v => v.severity === 'HIGH').length;
      const medium   = sources.trivy.filter(v => v.severity === 'MEDIUM').length;
      score += critical * 20 + high * 10 + medium * 5;
    }
    if (sources.sonar) {
      score += (sources.sonar.bugs || 0) * 5;
      score += sources.sonar.qualityGate === 'ERROR' ? 15 : 0;
    }
    if (sources.gitlab) {
      score += (sources.gitlab.failedJobs?.length || 0) * 10;
    }

    return Math.min(score, 100);
  }

  async fetchGitLabData(projectId, pipelineId) {
    return gitlabService.fetchPipeline(projectId, pipelineId);
  }

  async fetchSonarData(projectId, branch) {
    return sonarqubeService.fetchIssues(String(projectId)).catch(err => {
      logger.warn('Sonar fetch failed in correlation', { error: err.message });
      return null;
    });
  }

  async fetchTrivyData(projectId, pipelineId) {
    return trivyService.fetchFromGitlabArtifact(projectId, pipelineId);
  }

  async fetchCommitHistory(projectId, sha) {
    return gitlabService.fetchCommits(projectId, 'main', sha).catch(() => []);
  }
}

export const correlationService = new CorrelationService();
