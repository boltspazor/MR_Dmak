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

  // Get MR message statuses
  getMessageStatuses: async (mrIds?: string[]): Promise<{ 
    success: boolean; 
    data: Array<{
      mrId: string;
      mrCode: string;
      firstName: string;
      lastName: string;
      phone: string;
      group: string;
      messageStatus: string;
      campaignName: string | null;
      templateName: string | null;
      lastMessageDate: string | null;
    }>
  }> => {
    const params = mrIds && mrIds.length > 0 ? `?mrIds=${mrIds.join(',')}` : '';
    const response = await api.get(`/mrs/message-statuses${params}`);
    return response.data;
  },

  // Get detailed message status for a specific MR
  getDetailedMessageStatus: async (mrId: string): Promise<{
    success: boolean;
    data: {
      mr: {
        id: string;
        mrId: string;
        firstName: string;
        lastName: string;
        phone: string;
        group: string;
      };
      statusDetails: {
        status: string;
        errorMessage?: string;
        errorCode?: number;
        errorTitle?: string;
        successMessage?: string;
        timestamp?: string;
        campaignName?: string;
        templateName?: string;
      };
    };
  }> => {
    const response = await api.get(`/mrs/${mrId}/message-status-details`);
    return response.data;
  },

  // Refresh message statuses from Meta API
  refreshMessageStatuses: async (hoursBack: number = 24): Promise<{
    success: boolean;
    data: {
      updated: number;
      total: number;
    };
    message: string;
  }> => {
    const response = await api.post(`/mrs/refresh-message-statuses?hoursBack=${hoursBack}`);
    return response.data;
  }
};
