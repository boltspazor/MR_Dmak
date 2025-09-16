import { api } from './config';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isMarketingManager: boolean;
  marketingManagerId?: string;
}

export interface AuthResponse {
  success: boolean;
  user: AuthUser;
  token: string;
  message?: string;
}

// Authentication API functions
export const authApi = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Register new user
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Get current user profile
  getProfile: async (): Promise<{ success: boolean; user: AuthUser }> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Logout user (if needed for server-side logout)
  logout: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Refresh token (if implemented)
  refreshToken: async (): Promise<{ success: boolean; token: string }> => {
    const response = await api.post('/auth/refresh');
    return response.data;
  }
};
