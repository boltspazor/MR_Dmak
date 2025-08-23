import api from './api';
import { MessageCampaign, SendMessageRequest, SearchFilters, PaginatedResponse, CampaignReport } from '../types';

export class MessagesService {
  async sendMessage(messageData: SendMessageRequest): Promise<{
    campaignId: string;
    messageId: string;
    totalRecipients: number;
    status: string;
  }> {
    const response = await api.post('/messages/send', messageData);
    return response.data;
  }

  async uploadImage(file: File): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await api.post('/messages/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getAllCampaigns(filters?: SearchFilters): Promise<PaginatedResponse<MessageCampaign>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await api.get(`/messages/campaigns?${params.toString()}`);
    return response.data;
  }

  async getCampaignStats(filters?: SearchFilters): Promise<{
    campaigns: number;
    total: number;
    sent: number;
    failed: number;
    pending: number;
    successRate: string;
  }> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const response = await api.get(`/messages/campaigns/stats?${params.toString()}`);
    return response.data;
  }

  async getCampaignReport(campaignId: string): Promise<CampaignReport> {
    const response = await api.get(`/messages/campaign/${campaignId}/report`);
    return response.data;
  }
}

export default new MessagesService();
