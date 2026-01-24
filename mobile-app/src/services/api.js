import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

// Use centralized config for API URL
// To change the server IP, edit: src/config/index.js
const API_URL = config.api.baseUrl;

const api = axios.create({
  baseURL: API_URL,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors (especially invalid tokens)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If we get a 401 (Unauthorized), clear the stored token
    if (error.response?.status === 401) {
      console.log('Received 401 - clearing invalid token');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me')
};

// Complaints API
export const complaintsAPI = {
  getAll: (params) => api.get('/complaints', { params }),
  getMyComplaints: () => api.get('/complaints/my-complaints'),
  getById: (id) => api.get(`/complaints/${id}`),
  create: (data) => api.post('/complaints', data),
  update: (id, data) => api.put(`/complaints/${id}`, data), // Added update
  delete: (id) => api.delete(`/complaints/${id}`), // Added delete
  updateStatus: (id, status) => api.patch(`/complaints/${id}/status`, { status })
};

// Franchises API
export const franchisesAPI = {
  getAll: (params) => api.get('/franchises', { params }),
  getByNumber: (number) => api.get(`/franchises/${number}`)
};

// Investigations API
export const investigationsAPI = {
  getAll: (params) => api.get('/investigations', { params }),
  getById: (id) => api.get(`/investigations/${id}`),
  create: (data) => api.post('/investigations', data),
  accept: (id) => api.patch(`/investigations/${id}/accept`),
  delete: (id) => api.delete(`/investigations/${id}`),
  request: (complaintId) => api.post('/investigations/request', { complaintId }),
  getPendingApprovals: () => api.get('/investigations/pending-approvals'),
  approve: (id, status) => api.patch(`/investigations/${id}/approval`, { status }),
  update: (id, data) => api.patch(`/investigations/${id}`, data)
};

// Tickets API
export const ticketsAPI = {
  getAll: (params) => api.get('/tickets', { params }),
  getById: (id) => api.get(`/tickets/${id}`),
  create: (data) => api.post('/tickets', data),
  forward: (id, notes) => api.patch(`/tickets/${id}/forward`, { notes }),
  updateStatus: (id, status) => api.patch(`/tickets/${id}/status`, { status })
};

export default api;
