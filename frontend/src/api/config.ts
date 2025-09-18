import axios from 'axios';
import toast from 'react-hot-toast';

// Function to clean up error messages by replacing technical details with app name
const cleanErrorMessage = (message: string): string => {
  if (!message) return message;
  
  // Replace various forms of railway.app references with D-MAK
  let cleanedMessage = message
    .replace(/app\.railway\.app/gi, 'D-MAK')
    .replace(/railway\.app/gi, 'D-MAK')
    .replace(/\.railway\./gi, ' D-MAK ')
    .replace(/mrbackend-production-[a-zA-Z0-9-]+\.up\.railway\.app/gi, 'D-MAK server')
    .replace(/https?:\/\/[a-zA-Z0-9-]+\.up\.railway\.app/gi, 'D-MAK server')
    .replace(/production-[a-zA-Z0-9-]+\.up/gi, 'D-MAK')
    .replace(/\b[a-zA-Z0-9-]+\.up\.railway\.app\b/gi, 'D-MAK server');
  
  // Clean up any double spaces or awkward formatting
  cleanedMessage = cleanedMessage
    .replace(/\s+/g, ' ')
    .replace(/D-MAK\s+server/gi, 'D-MAK server')
    .trim();
  
  return cleanedMessage;
};

// Determine the API base URL based on environment
const getApiBaseUrl = () => {
  // Check if we're in production (Railway)
  if (window.location.hostname.includes('railway.app')) {
    // For Railway production, try different possible service names
    const possibleUrls = [
      'https://mrbackend-production-2ce3.up.railway.app/api'
    ];
    
    // Return the first one for now, but log all options
    console.log('🚀 Production environment detected, trying service URLs:', possibleUrls);
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

export const API_BASE_URL = getApiBaseUrl();

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

// Function to check if we're on Konnect/Dashboard page
const isOnKonnectPage = () => {
  const currentPath = window.location.pathname;
  return currentPath === '/dashboard' || currentPath === '/konnect' || currentPath === '/' || currentPath === '';
};

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    console.error('Request URL:', error.config?.url);
    console.error('Base URL:', error.config?.baseURL);
    console.error('Full URL:', error.config?.baseURL + error.config?.url);
    
    // COMPLETELY suppress ALL errors on Konnect/Dashboard page
    if (isOnKonnectPage()) {
      console.log('🔇 Suppressing ALL errors on Konnect page - Error:', error.message || error);
      console.log('🔇 Current path:', window.location.pathname);
      
      // Clean up tokens but don't show any popups or redirects
      if (error.response?.status === 401) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
      
      return Promise.reject(error);
    }
    
    // For other pages, handle errors normally
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    // Handle different types of errors
    let message = 'An error occurred';
    
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      message = 'Cannot connect to D-MAK server. Please check your connection.';
    } else if (error.response?.status === 404) {
      message = 'D-MAK service not found. Please try again later.';
    } else if (error.response?.status === 405) {
      message = 'Invalid request to D-MAK server. Please try again.';
    } else if (error.response?.status === 500) {
      message = 'D-MAK server error. Please try again later.';
    } else if (error.response?.data?.error) {
      message = error.response.data.error;
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message) {
      message = error.message;
    }
    
    // Clean up error messages to replace technical details with app name
    message = cleanErrorMessage(message);
    
    console.error('Error message:', message);
    toast.error(message);
    
    return Promise.reject(error);
  }
);
