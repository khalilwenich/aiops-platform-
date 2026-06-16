import { apiClient } from './client.js';

export const incidentApi = {
  getAll:            (params) => apiClient.get('/api/incidents', { params }),
  getById:           (id)     => apiClient.get(`/api/incidents/${id}`),
  updateStatus:      (id, data) => apiClient.patch(`/api/incidents/${id}/status`, data),
  addComment:        (id, message) => apiClient.post(`/api/incidents/${id}/comment`, { message }),
  generatePostMortem: (id)    => apiClient.post(`/api/incidents/${id}/postmortem`),
};
