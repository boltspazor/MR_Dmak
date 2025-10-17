import { api } from './config';

export interface TemplateData {
  name: string;
  content: string;
  imageUrl?: string;
  category?: string;
  description?: string;
}

export interface TemplateResponse {
  id: string;
  name: string;
  content: string;
  imageUrl?: string;
  category?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface TemplateStats {
  total: number;
  byCategory: Record<string, number>;
  recentlyUsed: TemplateResponse[];
}

// Template API functions
export const templateApi = {
  // Get all templates for current user
  getAll: async (): Promise<{ success: boolean; data: TemplateResponse[] }> => {
    const response = await api.get('/templates');
    return response.data;
  },

  // Get template by ID
  getById: async (id: string): Promise<{ success: boolean; data: TemplateResponse }> => {
    const response = await api.get(`/templates/${id}`);
    return response.data;
  },

  // Create new template
  create: async (templateData: TemplateData): Promise<{ success: boolean; data: TemplateResponse; message: string }> => {
    const response = await api.post('/templates', templateData);
    return response.data;
  },

  // Update template
  update: async (id: string, templateData: Partial<TemplateData>): Promise<{ success: boolean; data: TemplateResponse; message: string }> => {
    const response = await api.put(`/templates/${id}`, templateData);
    return response.data;
  },

  // Delete template (regular template)
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/templates/${id}`);
    return response.data;
  },

  // Delete template with Meta API integration
  deleteWithMeta: async (id: string): Promise<{ 
    success: boolean; 
    message: string; 
    metaDeletion: { success: boolean; message: string } 
  }> => {
    const response = await api.delete(`/meta-templates/${id}`);
    return response.data;
  },

  // Upload template image
  uploadImage: async (file: File): Promise<{ success: boolean; data: { imageUrl: string }; message: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await api.post('/templates/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get template statistics
  getStats: async (): Promise<{ success: boolean; data: TemplateStats }> => {
    const response = await api.get('/templates/stats');
    return response.data;
  },

  // Export templates
  export: async (): Promise<Blob> => {
    const response = await api.get('/templates/export', {
      responseType: 'blob',
    });
    return response.data;
  },

  // Search templates
  search: async (query: string): Promise<{ success: boolean; data: TemplateResponse[] }> => {
    const response = await api.get(`/templates/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  // Get templates by category
  getByCategory: async (category: string): Promise<{ success: boolean; data: TemplateResponse[] }> => {
    const response = await api.get(`/templates/category/${encodeURIComponent(category)}`);
    return response.data;
  },

  // Sync Meta templates
  syncMetaTemplates: async (): Promise<{ success: boolean; message: string; data?: any }> => {
    const response = await api.post('/meta-templates/sync');
    return response.data;
  }
};
