import api from './api';

export const settingsService = {
  getSettings: () => api.get('/settings'),
  updateSettings: (settings) => api.put('/settings', settings),
  resetSettings: () => api.post('/settings/reset', {}),
  getSystemStatus: () => api.get('/system/status'),
};

export default settingsService;
