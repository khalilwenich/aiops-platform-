import { apiClient } from './client.js';

export const reportApi = {
  getCurrent: ()       => apiClient.get('/api/reports/current'),
  getByWeek:  (offset) => apiClient.get(`/api/reports/${offset}`),
  listAll:    ()       => apiClient.get('/api/reports'),
};
