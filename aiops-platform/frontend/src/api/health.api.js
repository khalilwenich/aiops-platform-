import { apiClient } from './client.js';

export const healthApi = {
  getAllScores: ()          => apiClient.get('/api/health-score'),
  getScore:    (projectId) => apiClient.get(`/api/health-score/${projectId}`),
  getHistory:  (projectId) => apiClient.get(`/api/health-score/${projectId}/history`),
  computeAll:  ()          => apiClient.post('/api/health-score/compute-all'),
};
