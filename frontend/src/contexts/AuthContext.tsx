import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthContextType } from '../types';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

// Define user roles
export type UserRole = 'super_admin' | 'marketing_manager' | 'admin' | 'user';

// Define permissions for each role
export const ROLE_PERMISSIONS = {
  super_admin: [
    'dashboard',
    'campaign-wizard',
    'campaigns',
    'templates',
    'dmak',
    'mrs',
    'super-admin',
    'consent-form',
    'simple-tool'
  ],
  marketing_manager: [
    'dashboard',
    'campaign-wizard',
    'campaigns',
    'templates',
    'dmak',
    'mrs',
    'consent-form',
    'simple-tool'
  ],
  admin: [
    'dashboard',
    'campaign-wizard',
    'campaigns',
    'templates',
    'consent-form',
    'simple-tool'
  ],
  user: [
    'dashboard',
    'consent-form',
    'simple-tool'
  ]
};

// Define page access requirements
export const PAGE_ROLES: Record<string, UserRole[]> = {
  '/dashboard': ['super_admin', 'marketing_manager', 'admin', 'user'],
  '/campaign-wizard': ['super_admin', 'marketing_manager', 'admin'],
  '/campaigns': ['super_admin', 'marketing_manager', 'admin'],
  '/templates': ['super_admin', 'marketing_manager', 'admin'],
  '/dmak': ['super_admin', 'marketing_manager'],
  '/mrs': ['super_admin', 'marketing_manager'],
  '/super-admin': ['super_admin'],
  '/consent-form': ['super_admin', 'marketing_manager', 'admin', 'user'],
  '/simple-tool': ['super_admin', 'marketing_manager', 'admin', 'user']
};

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

  // Map user role from auth context to our role system
  const getUserRole = (): UserRole => {
    if (!user?.role) return 'user';
    
    const role = user.role.toLowerCase();
    switch (role) {
      case 'super admin':
      case 'super_admin':
        return 'super_admin';
      case 'marketing manager':
      case 'marketing_manager':
        return 'marketing_manager';
      case 'admin':
        return 'admin';
      default:
        return 'user';
    }
  };

  const userRole = getUserRole();

  const hasPermission = (page: string): boolean => {
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    return permissions.includes(page);
  };

  const canAccess = (page: string): boolean => {
    const allowedRoles = PAGE_ROLES[page] || [];
    return allowedRoles.includes(userRole);
  };

  const isSuperAdmin = (): boolean => userRole === 'super_admin';
  const isMarketingManager = (): boolean => userRole === 'marketing_manager';
  const isAdmin = (): boolean => userRole === 'admin';
  const isUser = (): boolean => userRole === 'user';

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
    isAuthenticated: !!user && !!token,
    // Role management functions
    userRole,
    hasPermission,
    canAccess,
    isSuperAdmin,
    isMarketingManager,
    isAdmin,
    isUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};