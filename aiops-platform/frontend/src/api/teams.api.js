import { apiClient } from './client.js';

export const teamsApi = {
  getAll:        ()                  => apiClient.get('/api/teams'),
  getById:       (id)                => apiClient.get(`/api/teams/${id}`),
  getMyTeams:    ()                  => apiClient.get('/api/teams/me'),
  create:        (data)              => apiClient.post('/api/teams', data),
  update:        (id, data)          => apiClient.patch(`/api/teams/${id}`, data),
  remove:        (id)                => apiClient.delete(`/api/teams/${id}`),
  addMember:     (id, userId, role)  => apiClient.post(`/api/teams/${id}/members`, { userId, role }),
  removeMember:  (id, userId)        => apiClient.delete(`/api/teams/${id}/members/${userId}`),
};
