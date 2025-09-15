import { api } from './config';

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  groupId?: string;
  campaignId?: string;
  status?: string;
}

export interface CampaignReport {
  campaign: {
    id: string;
    campaignName: string;
    campaignId: string;
    template?: string;
    createdAt: Date;
    scheduledAt?: Date;
  };
  stats: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
  recipients?: Array<{
    id: string;
    name: string;
    phone: string;
    email?: string;
    group: string;
    status: 'sent' | 'failed' | 'pending';
    sentAt?: Date;
    errorMessage?: string;
  }>;
}

export interface DashboardStats {
  totalCampaigns: number;
  totalMessages: number;
  successRate: number;
  totalMRs: number;
  totalGroups: number;
  recentCampaigns: Array<{
    id: string;
    campaignName: string;
    status: string;
    sentCount: number;
    totalRecipients: number;
    createdAt: Date;
  }>;
}

export interface PerformanceMetrics {
  campaigns: {
    total: number;
    completed: number;
    inProgress: number;
    failed: number;
  };
  messages: {
    total: number;
    sent: number;
    failed: number;
    successRate: number;
  };
  groups: {
    total: number;
    averageMembers: number;
  };
  mrs: {
    total: number;
    active: number;
    inactive: number;
  };
}

// Reports API functions
export const reportsApi = {
  // Get campaign report
  getCampaignReport: async (campaignId: string): Promise<{ success: boolean; data: CampaignReport }> => {
    const response = await api.get(`/reports/campaigns/${campaignId}`);
    return response.data;
  },

  // Get dashboard statistics
  getDashboardStats: async (): Promise<{ success: boolean; data: DashboardStats }> => {
    const response = await api.get('/reports/dashboard');
    return response.data;
  },

  // Get performance metrics
  getPerformanceMetrics: async (filters?: ReportFilters): Promise<{ success: boolean; data: PerformanceMetrics }> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.groupId) params.append('groupId', filters.groupId);
    if (filters?.status) params.append('status', filters.status);

    const response = await api.get(`/reports/performance?${params.toString()}`);
    return response.data;
  },

  // Get campaign reports with filters
  getCampaignReports: async (filters?: ReportFilters): Promise<{ success: boolean; data: CampaignReport[] }> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.groupId) params.append('groupId', filters.groupId);
    if (filters?.status) params.append('status', filters.status);

    const response = await api.get(`/reports/campaigns?${params.toString()}`);
    return response.data;
  },

  // Export campaign report to CSV
  exportCampaignReport: async (campaignId: string): Promise<Blob> => {
    const response = await api.get(`/reports/campaigns/${campaignId}/export`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Export performance metrics to CSV
  exportPerformanceMetrics: async (filters?: ReportFilters): Promise<Blob> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.groupId) params.append('groupId', filters.groupId);
    if (filters?.status) params.append('status', filters.status);

    const response = await api.get(`/reports/performance/export?${params.toString()}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get message delivery statistics
  getDeliveryStats: async (filters?: ReportFilters): Promise<{ success: boolean; data: { delivered: number; failed: number; pending: number; successRate: number } }> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.groupId) params.append('groupId', filters.groupId);

    const response = await api.get(`/reports/delivery?${params.toString()}`);
    return response.data;
  },

  // Get group performance report
  getGroupPerformance: async (): Promise<{ success: boolean; data: Array<{ groupName: string; totalMembers: number; campaignsSent: number; successRate: number }> }> => {
    const response = await api.get('/reports/groups');
    return response.data;
  },

  // Get monthly statistics
  getMonthlyStats: async (year: number, month: number): Promise<{ success: boolean; data: { campaigns: number; messages: number; successRate: number } }> => {
    const response = await api.get(`/reports/monthly/${year}/${month}`);
    return response.data;
  }
};
