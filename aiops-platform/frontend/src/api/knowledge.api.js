import { apiClient } from './client.js';

export const knowledgeApi = {
  getAll:   (params) => apiClient.get('/api/knowledge', { params }),
  getStats: ()       => apiClient.get('/api/knowledge/stats'),
  search:   (q)      => apiClient.get('/api/knowledge/search', { params: { q } }),
  getById:  (id)     => apiClient.get(`/api/knowledge/${id}`),
  delete:   (id)     => apiClient.delete(`/api/knowledge/${id}`),
};
