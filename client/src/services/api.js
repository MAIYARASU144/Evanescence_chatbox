import axios from 'axios';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_BACKEND_URL || ''}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach participant credentials from sessionStorage if available
api.interceptors.request.use((config) => {
  const participantId = sessionStorage.getItem('participantId');
  const participantToken = sessionStorage.getItem('participantToken');

  if (participantId) config.headers['x-participant-id'] = participantId;
  if (participantToken) config.headers['x-participant-token'] = participantToken;

  return config;
});

// Normalize errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.error ||
      err.message ||
      'An unexpected error occurred.';
    const code = err.response?.data?.code || null;
    const status = err.response?.status || 0;
    return Promise.reject({ message, code, status });
  }
);

// Session API
export const createSession = (data) => api.post('/sessions', data);
export const getSession = (token) => api.get(`/sessions/${token}`);
export const joinSession = (token, data) => api.post(`/sessions/${token}/join`, data);
export const leaveSession = (token) => api.post(`/sessions/${token}/leave`);
export const endSession = (token) => api.post(`/sessions/${token}/end`);

// Media API
export const getUploadUrl = (data) =>
  api.post('/media/upload-url', data);
export const confirmUpload = (mediaId, sessionToken) =>
  api.post(`/media/${mediaId}/confirm`, { sessionToken });
export const getDownloadUrl = (mediaId, sessionToken) =>
  api.get(`/media/${mediaId}/download-url`, { params: { sessionToken } });

export default api;
