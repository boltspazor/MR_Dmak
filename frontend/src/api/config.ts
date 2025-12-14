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

const getApiBaseUrl = () => {
  const envUrl = "https://mrdmak-production.up.railway.app/api/";

  if (envUrl) {
    console.log('📝 Using environment variable URL:', envUrl);
    return envUrl;
  }

  console.log('🏠 Using localhost for development');
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

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

// Function to check if we're on pages that should suppress error popups
const shouldSuppressErrors = () => {
  const currentPath = window.location.pathname;
  return currentPath === '/dashboard' || 
         currentPath === '/konnect' || 
         currentPath === '/campaigns' || 
         currentPath === '/templates' ||
         currentPath === '/' || 
         currentPath === '';
};

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    console.error('Request URL:', error.config?.url);
    console.error('Base URL:', error.config?.baseURL);
    console.error('Full URL:', error.config?.baseURL + error.config?.url);
    
    // Handle authentication errors first (always clean up tokens)
    if (error.response?.status === 401) {
      // Only clear tokens and redirect if we're not already on login page
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        if (!shouldSuppressErrors()) {
          window.location.href = '/login';
        }
      }
    }
    
    // Allow 400 errors to propagate so components can handle them
    if (error.response?.status === 400) {
      console.log('🚨 400 error - allowing to propagate:', error.response?.data);
      return Promise.reject(error);
    }
    
    // Suppress other errors on certain pages (but still reject the promise)
    if (shouldSuppressErrors()) {
      console.log('🔇 Suppressing error popup on current page - Error:', error.message || error);
      console.log('🔇 Current path:', window.location.pathname);
      
      // Clean up error messages and reject with cleaned message
      let message = error.response?.data?.error || error.response?.data?.message || error.message || 'An error occurred';
      message = cleanErrorMessage(message);
      
      // Return a rejected promise with cleaned error
      return Promise.reject({ 
        ...error, 
        response: { 
          ...error.response, 
          data: { 
            ...error.response?.data, 
            error: message,
            message: message 
          } 
        } 
      });
    }
    
    // For other pages, handle errors normally
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
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
