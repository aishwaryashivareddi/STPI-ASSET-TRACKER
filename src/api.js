import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password })
};

export const assets = {
  getAll: (params) => api.get('/assets', { params }),
  getById: (id) => api.get(`/assets/${id}`),
  create: (formData) => api.post('/assets', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => api.put(`/assets/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  confirmTesting: (id, formData) => api.post(`/assets/${id}/testing`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/assets/${id}`),
  getStats: () => api.get('/assets/stats')
};

export const procurements = {
  getAll: (params) => api.get('/procurements', { params }),
  create: (data) => api.post('/procurements', data),
  approve: (id, status) => api.post(`/procurements/${id}/approve`, { approval_status: status }),
  delete: (id) => api.delete(`/procurements/${id}`)
};

export const maintenances = {
  getAll: (params) => api.get('/maintenances', { params }),
  create: (formData) => api.post('/maintenances', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  complete: (id, formData) => api.post(`/maintenances/${id}/complete`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getStats: () => api.get('/maintenances/stats'),
  delete: (id) => api.delete(`/maintenances/${id}`)
};

export const disposals = {
  getAll: (params) => api.get('/disposals', { params }),
  create: (formData) => api.post('/disposals', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  approve: (id, status) => api.post(`/disposals/${id}/approve`, { status }),
  delete: (id) => api.delete(`/disposals/${id}`)
};

export const master = {
  getBranches: () => api.get('/master/branches'),
  getSuppliers: () => api.get('/master/suppliers'),
  createBranch: (data) => api.post('/master/branches', data),
  createSupplier: (data) => api.post('/master/suppliers', data)
};

export default api;
