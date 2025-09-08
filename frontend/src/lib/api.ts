import axios from 'axios';
import toast from 'react-hot-toast';

// Determine the API base URL based on environment
const getApiBaseUrl = () => {
  // Check if we're in production (Railway)
  if (window.location.hostname.includes('railway.app')) {
    // For Railway production, try different possible service names
    const possibleUrls = [
      'https://mr_backend.railway.internal:5000/api',
      'https://mr-backend.railway.internal:5000/api',
      'https://mrbackend.railway.internal:5000/api',
      'https://backend.railway.internal:5000/api'
    ];
    
    // Return the first one for now, but log all options
    console.log('🚀 Railway detected, trying service URLs:', possibleUrls);
    return possibleUrls[0];
  }
  
  // Check for environment variable
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl) {
    console.log('📝 Using environment variable URL:', envUrl);
    return envUrl;
  }
  
  // Default to localhost for development
  console.log('🏠 Using localhost for development');
  return 'http://localhost:5001/api';
};

const API_BASE_URL = getApiBaseUrl();

// Debug logging
console.log('🌐 API Configuration:', {
  hostname: window.location.hostname,
  isRailway: window.location.hostname.includes('railway.app'),
  apiBaseUrl: API_BASE_URL,
  envVar: (import.meta as any).env?.VITE_API_BASE_URL
});

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
    console.error('Request URL:', error.config?.url);
    console.error('Base URL:', error.config?.baseURL);
    console.error('Full URL:', error.config?.baseURL + error.config?.url);
    
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
    } else if (error.response?.status === 405) {
      message = 'Method not allowed. Please check the API endpoint configuration.';
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
