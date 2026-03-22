import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  // Admin-only endpoints
  createEnforcer: (userData) => api.post('/auth/create-enforcer', userData),
  getEnforcers: () => api.get('/auth/enforcers'),
  updateUserStatus: (id, data) => api.patch(`/auth/users/${id}/status`, data)
};

// Complaints API
export const complaintsAPI = {
  getAll: (params) => api.get('/complaints', { params }),
  getMyComplaints: () => api.get('/complaints/my-complaints'),
  getById: (id) => api.get(`/complaints/${id}`),
  create: (data) => api.post('/complaints', data),
  update: (id, data) => api.put(`/complaints/${id}`, data),
  delete: (id) => api.delete(`/complaints/${id}`),
  updateStatus: (id, status) => api.patch(`/complaints/${id}/status`, { status })
};

// Franchises API
export const franchisesAPI = {
  getAll: (params) => api.get('/franchises', { params }),
  getByNumber: (number) => api.get(`/franchises/${number}`),
  create: (data) => api.post('/franchises', data),
  update: (number, data) => api.put(`/franchises/${number}`, data),
  updateStatus: (number, status) => api.patch(`/franchises/${number}/status`, { status }),
  // Offense management
  getOffenses: (number) => api.get(`/franchises/${number}/offenses`),
  resetOffenses: (number) => api.delete(`/franchises/${number}/offenses`),
  removeOffense: (number, offenseId) => api.delete(`/franchises/${number}/offenses/${offenseId}`)
};

// Investigations API (NEW WORKFLOW)
export const investigationsAPI = {
  getAll: (params) => api.get('/investigations', { params }),
  getById: (id) => api.get(`/investigations/${id}`),
  create: (data) => api.post('/investigations', data), // Admin creates investigation quest
  accept: (id) => api.patch(`/investigations/${id}/accept`), // Enforcer accepts quest
  delete: (id) => api.delete(`/investigations/${id}`) // Admin deletes open investigation
};

// Tickets API
export const ticketsAPI = {
  getAll: (params) => api.get('/tickets', { params }),
  getById: (id) => api.get(`/tickets/${id}`),
  create: (data) => api.post('/tickets', data), // Enforcer submits ticket
  forward: (id, notes) => api.patch(`/tickets/${id}/forward`, { notes }),
  updateStatus: (id, status, notes) => api.patch(`/tickets/${id}/status`, { status, notes })
};

// App Reviews API
export const appReviewsAPI = {
  getMyReview: () => api.get('/app-reviews/my-review'),
  submitReview: (data) => api.post('/app-reviews', data),
  getAllReviews: (params) => api.get('/app-reviews', { params }),
  deleteReview: (id) => api.delete(`/app-reviews/${id}`)
};

export default api;
