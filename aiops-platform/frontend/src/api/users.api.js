import { apiClient } from './client.js';

export const usersApi = {
  getAll:         ()              => apiClient.get('/api/users'),
  list:           ()              => apiClient.get('/api/users'),
  create:         (data)          => apiClient.post('/api/users', data),
  update:         (id, data)      => apiClient.patch(`/api/users/${id}`, data),
  resetPassword:  (id)            => apiClient.post(`/api/users/${id}/reset-password`),
  changeOwnPassword: (data)       => apiClient.post('/api/users/me/change-password', data),
  getProfile:     ()              => apiClient.get('/api/users/me'),
  updateProfile:  (data)          => apiClient.patch('/api/users/me', data),
};
