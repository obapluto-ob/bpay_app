import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://bpay-app.onrender.com/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API calls
export const authAPI = {
  register: (data: any) => api.post('/auth/register', data),
  verifyEmail: (data: any) => api.post('/auth/verify-email', data),
  login: (data: any) => api.post('/auth/login', data),
  verifyLogin: (data: any) => api.post('/auth/verify-login', data),
  resendCode: (data: any) => api.post('/auth/resend-code', data),
};

export default api;