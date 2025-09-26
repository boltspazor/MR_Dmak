import { api } from './config';

export interface CampaignProgress {
  campaign: {
    id: string;
    campaignId: string;
    name: string;
    status: string;
    createdAt: string;
    totalRecipients: number;
  };
  template?: {
    id: string;
    name: string;
    type: string;
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

export interface CampaignSummary {
  id: string;
  campaignId: string;
  name: string;
  status: string;
  createdAt: string;
  progress: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
    successRate: number;
  };
}

export interface MessageStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
}

export const campaignProgressAPI = {
  /**
   * Get campaign progress with real-time status
   */
  getCampaignProgress: async (campaignId: string): Promise<CampaignProgress> => {
    const response = await api.get(`/campaign-progress/${campaignId}`);
    return response.data.data;
  },

  /**
   * Get all campaigns with progress summary
   */
  getAllCampaignsProgress: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{
    campaigns: CampaignSummary[];
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
   * Get real-time message status from WhatsApp Cloud API
   */
  getMessageStatus: async (messageId: string): Promise<MessageStatus> => {
    const response = await api.get(`/campaigns/message/${messageId}/status`);
    return response.data.data;
  },

  /**
   * Update message status (for webhook)
   */
  updateMessageStatus: async (data: {
    messageId: string;
    status: string;
    timestamp?: string;
    recipient_id?: string;
  }): Promise<any> => {
    const response = await api.post('/campaigns/webhook/status', data);
    return response.data.data;
  }
};
