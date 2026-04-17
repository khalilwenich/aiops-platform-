import { createHttpClient } from '../../utils/httpClient.js';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';

class GitLabService {
  constructor() {
    this.client = createHttpClient(config.gitlab.baseUrl, config.gitlab.token);
    this.apiBase = '/api/v4';
  }

  async fetchPipeline(projectId, pipelineId) {
    try {
      const response = await this.client.get(
        `${this.apiBase}/projects/${encodeURIComponent(projectId)}/pipelines/${pipelineId}`
      );
      return response.data;
    } catch (error) {
      return this._handleError(error, 'fetchPipeline', { projectId, pipelineId });
    }
  }

  async fetchPipelineJobs(projectId, pipelineId) {
    try {
      const response = await this.client.get(
        `${this.apiBase}/projects/${encodeURIComponent(projectId)}/pipelines/${pipelineId}/jobs`,
        { params: { per_page: 100 } }
      );
      return response.data;
    } catch (error) {
      return this._handleError(error, 'fetchPipelineJobs', { projectId, pipelineId });
    }
  }

  async fetchJobLogs(projectId, jobId) {
    try {
      const response = await this.client.get(
        `${this.apiBase}/projects/${encodeURIComponent(projectId)}/jobs/${jobId}/trace`,
        { responseType: 'text' }
      );
      return response.data;
    } catch (error) {
      return this._handleError(error, 'fetchJobLogs', { projectId, jobId });
    }
  }

  async fetchCommits(projectId, ref, since) {
    try {
      const params = { ref_name: ref, per_page: 20 };
      if (since) params.since = since;
      const response = await this.client.get(
        `${this.apiBase}/projects/${encodeURIComponent(projectId)}/repository/commits`,
        { params }
      );
      return response.data;
    } catch (error) {
      return this._handleError(error, 'fetchCommits', { projectId, ref });
    }
  }

  async fetchFailedJobs(projectId, pipelineId) {
    const jobs = await this.fetchPipelineJobs(projectId, pipelineId);
    return (jobs || []).filter(job => job.status === 'failed');
  }

  _handleError(error, method, context) {
    if (error.response?.status === 404) {
      logger.warn(`GitLab ${method}: resource not found`, context);
      return null;
    }
    if (error.response?.status === 401) {
      logger.error(`GitLab ${method}: unauthorized - check GITLAB_TOKEN`, context);
      throw new Error('GitLab API unauthorized');
    }
    if (error.response?.status === 403) {
      logger.error(`GitLab ${method}: forbidden`, context);
      throw new Error('GitLab API forbidden');
    }
    logger.error(`GitLab ${method} failed`, { ...context, error: error.message });
    throw error;
  }
}

export const gitlabService = new GitLabService();
