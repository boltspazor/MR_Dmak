import { api } from './config';

export interface CampaignData {
  campaignName: string;
  templateId?: string;
  content?: string;
  imageUrl?: string;
  targetGroups: string[];
  targetMrs?: Array<{ mrId: string }>;
  scheduledAt?: string;
}

export interface CampaignResponse {
  id: string;
  campaignName: string;
  campaignId: string;
  template?: string;
  content?: string;
  imageUrl?: string;
  targetGroups: string[];
  targetMrs?: Array<{ mrId: string }>;
  status: 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'failed';
  scheduledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  stats?: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
}

export interface CampaignReport {
  campaign: CampaignResponse;
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
  }>;
}

// Campaign/Message API functions
export const campaignApi = {
  // Get all campaigns
  getAll: async (): Promise<{ success: boolean; data: CampaignResponse[] }> => {
    const response = await api.get('/messages/campaigns');
    return response.data;
  },

  // Get campaign by ID
  getById: async (id: string): Promise<{ success: boolean; data: CampaignResponse }> => {
    const response = await api.get(`/messages/campaigns/${id}`);
    return response.data;
  },

  // Create new campaign
  create: async (campaignData: CampaignData): Promise<{ success: boolean; data: CampaignResponse; message: string }> => {
    const response = await api.post('/messages/campaigns', campaignData);
    return response.data;
  },

  // Update campaign
  update: async (id: string, campaignData: Partial<CampaignData>): Promise<{ success: boolean; data: CampaignResponse; message: string }> => {
    const response = await api.put(`/messages/campaigns/${id}`, campaignData);
    return response.data;
  },

  // Delete campaign
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/messages/campaigns/${id}`);
    return response.data;
  },

  // Send campaign immediately
  sendNow: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/messages/campaigns/${id}/send`);
    return response.data;
  },

  // Schedule campaign
  schedule: async (id: string, scheduledAt: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/messages/campaigns/${id}/schedule`, { scheduledAt });
    return response.data;
  },

  // Get campaign report
  getReport: async (id: string): Promise<{ success: boolean; data: CampaignReport }> => {
    const response = await api.get(`/messages/campaigns/${id}/report`);
    return response.data;
  },

  // Get campaign statistics
  getStats: async (): Promise<{ success: boolean; data: { total: number; completed: number; inProgress: number; failed: number } }> => {
    const response = await api.get('/messages/campaigns/stats');
    return response.data;
  },

  // Get campaign recipients
  getRecipients: async (id: string): Promise<{ success: boolean; data: CampaignReport['recipients'] }> => {
    const response = await api.get(`/messages/campaigns/${id}/recipients`);
    return response.data;
  }
};
