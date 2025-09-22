import { api } from './config';

export interface Campaign {
  id: string;
  campaignId: string;
  name: string;
  description?: string;
  status: 'draft' | 'pending' | 'sending' | 'completed' | 'failed' | 'cancelled';
  createdAt: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  template: {
    id: string;
    name: string;
    metaTemplateName?: string;
    metaStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED' | 'PAUSED' | 'PENDING_DELETION';
    isMetaTemplate: boolean;
    type: 'html' | 'text' | 'image' | 'template';
  };
  recipientList: {
    id: string;
    name: string;
    description?: string;
    recipientCount: number;
  };
  progress: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    successRate: number;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateCampaignData {
  name: string;
  description?: string;
  templateId: string;
  recipientListId: string;
  scheduledAt?: string;
}

export interface CampaignProgress {
  campaign: {
    id: string;
    campaignId: string;
    name: string;
    description?: string;
    status: string;
    createdAt: string;
    scheduledAt?: string;
    startedAt?: string;
    completedAt?: string;
    totalRecipients: number;
  };
  template: {
    id: string;
    name: string;
    metaTemplateName?: string;
    metaStatus?: string;
    isMetaTemplate: boolean;
    type: string;
    metaLanguage?: string;
  };
  recipientList: {
    id: string;
    name: string;
    description?: string;
    recipients: Array<{
      mrId: string;
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
      groupId?: string;
      parameters: Record<string, string>;
    }>;
  };
  progress: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    successRate: number;
  };
  recipients: Array<{
    id: string;
    mrId: string;
    firstName: string;
    lastName: string;
    phone: string;
    group: string;
    status: 'sent' | 'failed' | 'pending' | 'queued';
    sentAt?: string;
    errorMessage?: string;
    messageId?: string;
  }>;
  lastUpdated: string;
}

export const campaignsAPI = {
  /**
   * Create a new campaign
   */
  createCampaign: async (data: CreateCampaignData): Promise<Campaign> => {
    const response = await api.post('/campaigns', data);
    return response.data.data;
  },

  /**
   * Get all campaigns with progress
   */
  getCampaigns: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{
    campaigns: Campaign[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const response = await api.get('/campaigns', { params });
    return response.data.data;
  },

  /**
   * Get campaign by ID with full details
   */
  getCampaignById: async (campaignId: string): Promise<CampaignProgress> => {
    const response = await api.get(`/campaigns/${campaignId}`);
    return response.data.data;
  },

  /**
   * Update campaign status
   */
  updateCampaignStatus: async (campaignId: string, status: string): Promise<Campaign> => {
    const response = await api.patch(`/campaigns/${campaignId}/status`, { status });
    return response.data.data;
  },

  /**
   * Delete campaign
   */
  deleteCampaign: async (campaignId: string): Promise<void> => {
    await api.delete(`/campaigns/${campaignId}`);
  },

  /**
   * Get campaign progress (for progress tracking)
   */
  getCampaignProgress: async (campaignId: string): Promise<CampaignProgress> => {
    const response = await api.get(`/campaign-progress/${campaignId}`);
    return response.data.data;
  }
};
