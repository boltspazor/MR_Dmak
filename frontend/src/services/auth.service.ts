import api from './api';
import { AuthUser, LoginCredentials, RegisterCredentials } from '../types';

export class AuthService {
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string }> {
    const response = await api.post('/auth/login', credentials);
    const { user, token } = response.data;
    
    // Store in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { user, token };
  }

  async register(credentials: RegisterCredentials): Promise<AuthUser> {
    const response = await api.post('/auth/register', credentials);
    return response.data.user;
  }

  async getCurrentUser(): Promise<AuthUser> {
    const response = await api.get('/auth/me');
    return response.data.user;
  }

  async refreshToken(): Promise<{ token: string }> {
    const response = await api.post('/auth/refresh');
    const { token } = response.data;
    
    // Update stored token
    localStorage.setItem('token', token);
    
    return { token };
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getStoredUser(): AuthUser | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getStoredToken(): string | null {
    return localStorage.getItem('token');
  }
}

export default new AuthService();
