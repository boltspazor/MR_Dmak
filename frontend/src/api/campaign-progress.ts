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
    status: 'sent' | 'failed' | 'pending' | 'queued' | 'delivered' | 'read';
    sentAt?: string;
    errorMessage?: string;
    errorCode?: number;
    errorTitle?: string;
    errorDetails?: string;
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
    console.log(response.data.data);
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
  },

  /**
   * Get detailed message list by status for a campaign
   */
  getCampaignMessageDetails: async (campaignId: string, params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    campaign: {
      id: string;
      campaignId: string;
      name: string;
      status: string;
    };
    messages: Array<{
      id: string;
      mrId: string;
      phoneNumber: string;
      status: string;
      sentAt?: string;
      deliveredAt?: string;
      readAt?: string;
      failedAt?: string;
      errorMessage?: string;
      errorCode?: number;
      errorTitle?: string;
      messageId?: string;
      templateName?: string;
      templateLanguage?: string;
      conversationId?: string;
      pricingCategory?: string;
      lastUpdated: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    statusCounts: {
      total: number;
      sent: number;
      delivered: number;
      read: number;
      failed: number;
      pending: number;
      queued: number;
    };
  }> => {
    const response = await api.get(`/campaign-progress/${campaignId}/messages`, { params });
    return response.data.data;
  }
};
