import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthContextType } from '../types';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Check if we're in frontend-only development mode
    const isDevelopmentMode = (import.meta as any).env?.VITE_DEVELOPMENT_MODE === 'frontend-only';
    
    if (isDevelopmentMode) {
      // Mock login for frontend-only development
      console.log('🔧 Frontend-only mode: Mocking login');
      
      const mockUser = {
        id: 'dev-user-123',
        name: 'Development User',
        email: email,
        role: 'Super Admin'
      };
      
      const mockToken = 'mock-jwt-token-for-development';
      
      setUser(mockUser);
      setToken(mockToken);
      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      toast.success('Login successful! (Development Mode)');
      return;
    }

    try {
      console.log('Attempting login to:', `${api.defaults.baseURL}/auth/login`);
      console.log('Login data:', { email, password: '***' });
      
      const response = await api.post('/auth/login', { email, password });
      console.log('Login response:', response.data);
      
      const { user, token } = response.data;

      setUser(user);
      setToken(token);
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      toast.success('Login successful!');
    } catch (error: any) {
      console.error('Login error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        code: error.code
      });
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    // Check if we're in frontend-only development mode
    const isDevelopmentMode = (import.meta as any).env?.VITE_DEVELOPMENT_MODE === 'frontend-only';
    
    if (isDevelopmentMode) {
      // Mock registration for frontend-only development
      console.log('🔧 Frontend-only mode: Mocking registration');
      toast.success('Registration successful! (Development Mode)');
      
      // After registration, automatically log them in
      await login(email, password);
      return;
    }

    try {
      const response = await api.post('/auth/register', { email, password, name });
      const userData = response.data.user;

      // After registration, automatically log them in
      await login(email, password);
      
      toast.success('Registration successful!');
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};