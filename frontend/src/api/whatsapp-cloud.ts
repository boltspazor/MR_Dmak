import { api } from './config';

export interface WhatsAppMessageRequest {
  to: string;
  message: string;
}

export interface WhatsAppTemplateRequest {
  to: string;
  templateName: string;
  parameters?: string[];
  languageCode?: string;
}

export interface WhatsAppImageRequest {
  to: string;
  imageUrl: string;
  caption?: string;
}

export interface WhatsAppBulkRequest {
  recipients: Array<{
    phone: string;
    firstName?: string;
    lastName?: string;
  }>;
  message?: string;
  templateName?: string;
  parameters?: string[];
}

export interface MessageBuildRequest {
  templateContent: string;
  parameters: Record<string, string>;
}

export interface WhatsAppResponse {
  success: boolean;
  message: string;
  data: {
    messageId: string;
    status: string;
    recipient: string;
  };
}

export interface BulkResponse {
  success: boolean;
  message: string;
  data: {
    total: number;
    success: number;
    failed: number;
    results: Array<{
      recipient: string;
      success: boolean;
      messageId?: string;
      status?: string;
      error?: string;
    }>;
  };
}

export interface MessageBuildResponse {
  success: boolean;
  message: string;
  data: {
    originalTemplate: string;
    parameters: Record<string, string>;
    builtMessage: string;
  };
}

export interface MessageStatusResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: string;
    recipient_id: string;
  };
}

export interface WebhookInfoResponse {
  success: boolean;
  message: string;
  data: any;
}

class WhatsAppCloudAPI {
  /**
   * Send a single text message
   */
  async sendMessage(request: WhatsAppMessageRequest): Promise<WhatsAppResponse> {
    try {
      const response = await api.post('/whatsapp-cloud/send-message', request);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to send message');
    }
  }

  /**
   * Send a template message with parameters
   */
  async sendTemplate(request: WhatsAppTemplateRequest): Promise<WhatsAppResponse> {
    try {
      const response = await api.post('/whatsapp-cloud/send-template', request);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to send template message');
    }
  }

  /**
   * Send an image message
   */
  async sendImage(request: WhatsAppImageRequest): Promise<WhatsAppResponse> {
    try {
      const response = await api.post('/whatsapp-cloud/send-image', request);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to send image message');
    }
  }

  /**
   * Send bulk messages to multiple recipients
   */
  async sendBulk(request: WhatsAppBulkRequest): Promise<BulkResponse> {
    try {
      const response = await api.post('/whatsapp-cloud/send-bulk', request);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to send bulk messages');
    }
  }

  /**
   * Build a personalized message from template
   */
  async buildMessage(request: MessageBuildRequest): Promise<MessageBuildResponse> {
    try {
      const response = await api.post('/whatsapp-cloud/build-message', request);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to build message');
    }
  }

  /**
   * Get message delivery status
   */
  async getMessageStatus(messageId: string): Promise<MessageStatusResponse> {
    try {
      const response = await api.get(`/whatsapp-cloud/message-status/${messageId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get message status');
    }
  }

  /**
   * Get webhook configuration information
   */
  async getWebhookInfo(): Promise<WebhookInfoResponse> {
    try {
      const response = await api.get('/whatsapp-cloud/webhook-info');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to get webhook info');
    }
  }

  /**
   * Send campaign to multiple recipients using template
   */
  async sendCampaign(
    recipients: Array<{ phone: string; firstName?: string; lastName?: string }>,
    templateName: string,
    templateParameters: string[],
    campaignName: string
  ): Promise<BulkResponse> {
    try {
      const response = await api.post('/whatsapp-cloud/send-bulk', {
        recipients,
        templateName,
        parameters: templateParameters
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to send campaign');
    }
  }

  /**
   * Send campaign with custom message (not template)
   */
  async sendCustomCampaign(
    recipients: Array<{ phone: string; firstName?: string; lastName?: string }>,
    message: string,
    campaignName: string
  ): Promise<BulkResponse> {
    try {
      const response = await api.post('/whatsapp-cloud/send-bulk', {
        recipients,
        message
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to send custom campaign');
    }
  }

  /**
   * Test message sending with a single recipient
   */
  async testMessage(phoneNumber: string, message: string): Promise<WhatsAppResponse> {
    return this.sendMessage({
      to: phoneNumber,
      message: message
    });
  }

  /**
   * Test template message sending
   */
  async testTemplate(
    phoneNumber: string, 
    templateName: string, 
    parameters: string[] = []
  ): Promise<WhatsAppResponse> {
    return this.sendTemplate({
      to: phoneNumber,
      templateName,
      parameters,
      languageCode: 'en_US'
    });
  }
}

export default new WhatsAppCloudAPI();
