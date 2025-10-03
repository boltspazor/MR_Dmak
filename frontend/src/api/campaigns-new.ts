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
  } | null;
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

export interface CreateCampaignWithMRsData {
  name: string;
  description?: string;
  templateId: string;
  mrIds: string[];
  scheduledAt?: string;
}

export interface CampaignProgress {
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
    content?: string;
    metaTemplateName?: string;
    metaStatus?: string;
    isMetaTemplate: boolean;
    type: string;
  };
  recipientList: {
    id: string;
    name: string;
    description?: string;
    recipientCount: number;
  } | null;
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

// Campaign API
export const campaignsAPI = {
  /**
   * Create a new campaign
   */
  createCampaign: async (data: CreateCampaignData): Promise<Campaign> => {
    const response = await api.post('/campaigns', data);
    return response.data.data;
  },

  /**
   * Create a campaign with MRs
   */
  createCampaignWithMRs: async (data: CreateCampaignWithMRsData): Promise<Campaign> => {
    const response = await api.post('/campaigns/with-mrs', data);
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
    sortField?: string;
    sortDirection?: 'asc' | 'desc';
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
    console.log('API Response:', response.data);
    return response.data.data;
  },

  /**
   * Get available campaign statuses
   */
  getAvailableStatuses: async (): Promise<Array<{value: string, label: string}>> => {
    const response = await api.get('/campaigns/statuses');
    return response.data.data.statuses;
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
    const response = await api.get(`/campaigns/${campaignId}`);
    return response.data.data;
  }
};