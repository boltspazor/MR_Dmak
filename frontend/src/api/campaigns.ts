import { api } from './config';
import { campaignsAPI } from './campaigns-new';

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
  // Get all campaigns (using new campaign API)
  getAll: async (): Promise<{ success: boolean; data: CampaignResponse[] }> => {
    const response = await campaignsAPI.getCampaigns();
    return { success: true, data: response.campaigns as any };
  },

  // Get all template campaigns (using new campaign API)
  getTemplateCampaigns: async (): Promise<{ success: boolean; data: CampaignResponse[] }> => {
    const response = await campaignsAPI.getCampaigns();
    return { success: true, data: response.campaigns as any };
  },

  // Get campaign by ID (using new campaign API)
  getById: async (id: string): Promise<{ success: boolean; data: CampaignResponse }> => {
    const response = await campaignsAPI.getCampaignById(id);
    return { success: true, data: response as any };
  },

  // Create new campaign (using new campaign API)
  create: async (campaignData: CampaignData): Promise<{ success: boolean; data: CampaignResponse; message: string }> => {
    const response = await campaignsAPI.createCampaign({
      name: campaignData.campaignName,
      templateId: campaignData.templateId!,
      recipientListId: campaignData.targetGroups[0] // Assuming first target group is recipient list ID
    });
    return { success: true, data: response as any, message: 'Campaign created successfully' };
  },

  // Update campaign (using new campaign API)
  update: async (id: string, campaignData: Partial<CampaignData>): Promise<{ success: boolean; data: CampaignResponse; message: string }> => {
    // For now, we'll use the old API for updates until we implement update in new API
    const response = await api.put(`/messages/campaigns/${id}`, campaignData);
    return response.data;
  },

  // Delete campaign (using new campaign API)
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    await campaignsAPI.deleteCampaign(id);
    return { success: true, message: 'Campaign deleted successfully' };
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
