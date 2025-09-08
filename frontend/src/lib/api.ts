import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://mr_backend.railway.internal:5001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Handle different types of errors
    let message = 'An error occurred';
    
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      message = 'Cannot connect to server. Please check if the backend is running.';
    } else if (error.response?.status === 404) {
      message = 'API endpoint not found. Please check the server configuration.';
    } else if (error.response?.status === 500) {
      message = 'Server error. Please try again later.';
    } else if (error.response?.data?.error) {
      message = error.response.data.error;
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message) {
      message = error.message;
    }
    
    console.error('Error message:', message);
    toast.error(message);
    
    return Promise.reject(error);
  }
);