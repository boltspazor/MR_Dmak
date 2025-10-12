import { api } from './config';

export interface MRData {
  mrId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  comments?: string;
  groupId?: string;
  metaStatus?: 'ACTIVE' | 'ERROR';
  appStatus?: 'pending' | 'approved' | 'rejected' | 'not_requested';
}

export interface MRResponse {
  id: string;
  mrId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  comments?: string;
  groupId: string;
  group: {
    id: string;
    groupName: string;
  };
  marketingManagerId: string;
  marketingManager: {
    id: string;
    name: string;
    email: string;
  };
  metaStatus?: 'ACTIVE' | 'ERROR';
  appStatus?: 'pending' | 'approved' | 'rejected' | 'not_requested';
  lastErrorMessage?: string;
  lastErrorAt?: Date;
  lastErrorCampaignId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BulkUploadResult {
  success: boolean;
  data?: {
    created: number;
    errors: string[];
  };
  message?: string;
}

// MR Management API functions
export const mrApi = {
  // Get all MRs for current user
  getAll: async (): Promise<{ success: boolean; data: MRResponse[] }> => {
    const response = await api.get('/mrs');
    return response.data;
  },

  // Get MR by ID
  getById: async (id: string): Promise<{ success: boolean; data: MRResponse }> => {
    const response = await api.get(`/mrs/${id}`);
    return response.data;
  },

  // Create new MR
  create: async (mrData: MRData): Promise<{ success: boolean; data: MRResponse; message: string }> => {
    const response = await api.post('/mrs', mrData);
    return response.data;
  },

  // Update MR
  update: async (id: string, mrData: Partial<MRData>): Promise<{ success: boolean; data: MRResponse; message: string }> => {
    const response = await api.put(`/mrs/${id}`, mrData);
    return response.data;
  },

  // Delete MR
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/mrs/${id}`);
    return response.data;
  },

  // Bulk upload MRs from CSV
  bulkUpload: async (file: File): Promise<BulkUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/mrs/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Download CSV template
  downloadTemplate: async (): Promise<Blob> => {
    const response = await api.get('/mrs/template', {
      responseType: 'blob',
    });
    return response.data;
  },

  // Get MR statistics
  getStats: async (): Promise<{ 
    success: boolean; 
    data: { 
      total: number; 
      byGroup: Record<string, number>;
      consentSummary: {
        consented: number;
        notConsented: number;
        deleted: number;
      };
    } 
  }> => {
    const response = await api.get('/mrs/stats');
    return response.data;
  },

  // Search MRs
  search: async (query: string): Promise<{ success: boolean; data: MRResponse[] }> => {
    const response = await api.get(`/mrs/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Get MRs with status information
  getWithStatus: async (params?: {
    groupId?: string;
    search?: string;
    page?: number;
    limit?: number;
    statusFilter?: string;
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
    getAll?: boolean;
  }): Promise<{ success: boolean; data: MRResponse[]; pagination?: any; total?: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.groupId) queryParams.append('groupId', params.groupId);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.statusFilter) queryParams.append('statusFilter', params.statusFilter);
    if (params?.sortField) queryParams.append('sortField', params.sortField);
    if (params?.sortDirection) queryParams.append('sortDirection', params.sortDirection);
    if (params?.getAll) queryParams.append('getAll', 'true');

    const response = await api.get(`/mrs/with-status?${queryParams.toString()}`);
    return response.data;
  },

  // Update MR status
  updateStatus: async (id: string, statusData: {
    metaStatus?: 'ACTIVE' | 'ERROR';
    appStatus?: 'pending' | 'approved' | 'rejected' | 'not_requested';
  }): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/mrs/${id}/status`, statusData);
    return response.data;
  },

  // Reset MR status
  resetStatus: async (id: string, statusType: 'metaStatus' | 'appStatus' | 'both' = 'both'): Promise<{ success: boolean; message: string }> => {
    const response = await api.put(`/mrs/${id}/reset-status`, { statusType });
    return response.data;
  }
};
