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
  }
};
