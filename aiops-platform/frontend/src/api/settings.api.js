import { apiClient } from './client.js';

export const settingsApi = {
  getAll:           ()                  => apiClient.get('/api/settings'),
  updateSection:    (section, data)     => apiClient.patch(`/api/settings/${section}`, data),
  testIntegration:  (service, data)     => apiClient.post(`/api/settings/integrations/test/${service}`, data),
  testSlack:        (webhookUrl)        => apiClient.post('/api/settings/notifications/test-slack', { webhookUrl }),
  getPlatformStatus: ()                 => apiClient.get('/api/settings/platform/status'),
  clearCache:       ()                  => apiClient.post('/api/settings/platform/clear-cache'),
  purgeOldAnalyses: ()                  => apiClient.post('/api/settings/platform/purge-analyses'),
  exportData:       ()                  => apiClient.get('/api/settings/platform/export'),
};
