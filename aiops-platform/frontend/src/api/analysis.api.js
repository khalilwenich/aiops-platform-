import { apiClient } from './client.js';

export const analysisApi = {
  getRecent: () => apiClient.get('/api/analyses'),
  getByPipeline: (pipelineId) => apiClient.get(`/api/analyses/${pipelineId}`),
  getRecurring: () => apiClient.get('/api/analyses/recurring'),
  markResolved: (id) => apiClient.patch(`/api/analyses/${id}/resolve`),
};
