import { apiClient } from './client.js';

export const pipelinesApi = {
  getAll: (params = {}) => apiClient.get('/api/pipelines', { params }),
  getById: (id) => apiClient.get(`/api/pipelines/${id}`),
  getStats: () => apiClient.get('/api/pipelines/stats'),
  getProjects: () => apiClient.get('/api/pipelines/projects'),
  getMetrics: () => apiClient.get('/api/pipelines/metrics'),
  retrigger: (id) => apiClient.post(`/api/pipelines/${id}/retry`),
};
