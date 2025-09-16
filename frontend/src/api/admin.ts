import { api } from './config';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isMarketingManager: boolean;
  marketingManagerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminStats {
  totalUsers: number;
  totalMRs: number;
  totalGroups: number;
  totalCampaigns: number;
  marketingManagers: number;
}

export interface CreateManagerData {
  name: string;
  email: string;
  password: string;
}

export interface UpdateManagerData {
  name?: string;
  email?: string;
  password?: string;
}

export interface SystemPerformance {
  totalUsers: number;
  totalCampaigns: number;
  totalMessages: number;
  successRate: number;
  averageResponseTime: number;
  systemUptime: number;
}

// Admin/Super Admin API functions
export const adminApi = {
  // Get system statistics
  getStats: async (): Promise<{ success: boolean; data: AdminStats }> => {
    const response = await api.get('/super-admin/stats');
    return response.data;
  },

  // Get system performance metrics
  getPerformanceMetrics: async (): Promise<{ success: boolean; data: SystemPerformance }> => {
    const response = await api.get('/super-admin/performance');
    return response.data;
  },

  // Get all marketing managers
  getMarketingManagers: async (): Promise<{ success: boolean; data: AdminUser[] }> => {
    const response = await api.get('/super-admin/managers');
    return response.data;
  },

  // Create marketing manager
  createMarketingManager: async (managerData: CreateManagerData): Promise<{ success: boolean; data: AdminUser; message: string }> => {
    const response = await api.post('/super-admin/managers', managerData);
    return response.data;
  },

  // Update marketing manager
  updateMarketingManager: async (id: string, managerData: UpdateManagerData): Promise<{ success: boolean; data: AdminUser; message: string }> => {
    const response = await api.put(`/super-admin/managers/${id}`, managerData);
    return response.data;
  },

  // Delete marketing manager
  deleteMarketingManager: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/super-admin/managers/${id}`);
    return response.data;
  },

  // Get all users
  getAllUsers: async (): Promise<{ success: boolean; data: AdminUser[] }> => {
    const response = await api.get('/super-admin/users');
    return response.data;
  },

  // Get user by ID
  getUserById: async (id: string): Promise<{ success: boolean; data: AdminUser }> => {
    const response = await api.get(`/super-admin/users/${id}`);
    return response.data;
  },

  // Update user
  updateUser: async (id: string, userData: Partial<AdminUser>): Promise<{ success: boolean; data: AdminUser; message: string }> => {
    const response = await api.put(`/super-admin/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/super-admin/users/${id}`);
    return response.data;
  },

  // Get system logs
  getSystemLogs: async (limit: number = 100): Promise<{ success: boolean; data: Array<{ timestamp: string; level: string; message: string; service: string }> }> => {
    const response = await api.get(`/super-admin/logs?limit=${limit}`);
    return response.data;
  },

  // Get database statistics
  getDatabaseStats: async (): Promise<{ success: boolean; data: { totalRecords: number; collections: Record<string, number> } }> => {
    const response = await api.get('/super-admin/database-stats');
    return response.data;
  }
};
