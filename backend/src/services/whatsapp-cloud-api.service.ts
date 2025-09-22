import axios, { AxiosResponse } from 'axios';
import logger from '../utils/logger';
import { whatsappConfig, isCloudEnabled } from '../config/whatsapp-cloud.config';

interface WhatsAppCloudAPIConfig {
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  apiVersion: string;
}

interface TextMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: {
    body: string;
  };
}

interface TemplateMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: 'body' | 'header' | 'footer';
      parameters?: Array<{
        type: 'text';
        text: string;
      }>;
    }>;
  };
}

interface ImageMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'image';
  image: {
    link: string;
    caption?: string;
  };
}

interface WhatsAppResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
    message_status: 'accepted' | 'delivered' | 'read' | 'failed';
  }>;
}

interface MessageStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  conversation?: {
    id: string;
    expiration_timestamp: string;
  };
  pricing?: {
    billable: boolean;
    pricing_model: string;
    category: string;
  };
}

class WhatsAppCloudAPIService {
  private config: WhatsAppCloudAPIConfig;
  private baseURL: string;

  constructor() {
    if (!isCloudEnabled()) {
      throw new Error('WhatsApp Cloud API is not enabled or not configured');
    }

    const cloudConfig = whatsappConfig.cloudConfig;
    if (!cloudConfig) {
      throw new Error('WhatsApp Cloud API configuration not available');
    }

    this.config = {
      phoneNumberId: cloudConfig.phoneNumberId,
      businessAccountId: cloudConfig.businessAccountId,
      accessToken: cloudConfig.accessToken,
      apiVersion: cloudConfig.apiVersion
    };

    this.baseURL = cloudConfig.baseURL;
    
    logger.info('WhatsAppCloudAPIService initialized', {
      phoneNumberId: this.config.phoneNumberId ? 'configured' : 'not configured',
      businessAccountId: this.config.businessAccountId ? 'configured' : 'not configured',
      apiVersion: this.config.apiVersion
    });
  }

  /**
   * Send a text message
   */
  async sendTextMessage(to: string, message: string): Promise<WhatsAppResponse> {
    try {
      const messageData: TextMessage = {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(to),
        type: 'text',
        text: {
          body: message
        }
      };

      logger.info('Sending WhatsApp text message', {
        to: this.formatPhoneNumber(to),
        messageLength: message.length
      });

      const response: AxiosResponse<WhatsAppResponse> = await axios.post(
        `${this.baseURL}/messages`,
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('WhatsApp text message sent successfully', {
        messageId: response.data.messages[0]?.id,
        status: response.data.messages[0]?.message_status
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error sending WhatsApp text message', {
        error: error.response?.data || error.message,
        to: this.formatPhoneNumber(to)
      });
      throw new Error(`Failed to send WhatsApp message: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Send a template message with parameters
   */
  async sendTemplateMessage(
    to: string, 
    templateName: string, 
    parameters: string[] = [],
    languageCode: string = 'en_US'
  ): Promise<WhatsAppResponse> {
    try {
      const messageData: TemplateMessage = {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(to),
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          }
        }
      };

      // Add parameters if provided
      if (parameters.length > 0) {
        messageData.template.components = [
          {
            type: 'body',
            parameters: parameters.map(param => ({
              type: 'text',
              text: param
            }))
          }
        ];
      }

      logger.info('Sending WhatsApp template message', {
        to: this.formatPhoneNumber(to),
        templateName,
        parametersCount: parameters.length
      });

      const response: AxiosResponse<WhatsAppResponse> = await axios.post(
        `${this.baseURL}/messages`,
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('WhatsApp template message sent successfully', {
        messageId: response.data.messages[0]?.id,
        status: response.data.messages[0]?.message_status
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error sending WhatsApp template message', {
        error: error.response?.data || error.message,
        to: this.formatPhoneNumber(to),
        templateName
      });
      throw new Error(`Failed to send WhatsApp template message: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Send an image message
   */
  async sendImageMessage(to: string, imageUrl: string, caption?: string): Promise<WhatsAppResponse> {
    try {
      const messageData: ImageMessage = {
        messaging_product: 'whatsapp',
        to: this.formatPhoneNumber(to),
        type: 'image',
        image: {
          link: imageUrl,
          caption: caption
        }
      };

      logger.info('Sending WhatsApp image message', {
        to: this.formatPhoneNumber(to),
        imageUrl,
        hasCaption: !!caption
      });

      const response: AxiosResponse<WhatsAppResponse> = await axios.post(
        `${this.baseURL}/messages`,
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('WhatsApp image message sent successfully', {
        messageId: response.data.messages[0]?.id,
        status: response.data.messages[0]?.message_status
      });

      return response.data;
    } catch (error: any) {
      logger.error('Error sending WhatsApp image message', {
        error: error.response?.data || error.message,
        to: this.formatPhoneNumber(to),
        imageUrl
      });
      throw new Error(`Failed to send WhatsApp image message: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Get message status
   */
  async getMessageStatus(messageId: string): Promise<MessageStatus> {
    try {
      const response: AxiosResponse<MessageStatus> = await axios.get(
        `https://graph.facebook.com/${this.config.apiVersion}/${messageId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`
          }
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Error getting WhatsApp message status', {
        error: error.response?.data || error.message,
        messageId
      });
      throw new Error(`Failed to get message status: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Build a personalized message by replacing parameters in template content
   */
  buildMessage(templateContent: string, parameters: Record<string, string>): string {
    let message = templateContent;

    // Replace parameters in the format {{parameterName}}
    Object.entries(parameters).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'gi');
      message = message.replace(regex, value);
    });

    return message;
  }

  /**
   * Validate phone number format
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Add country code if not present (assuming India +91)
    if (cleaned.length === 10 && cleaned.startsWith('9')) {
      cleaned = '91' + cleaned;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      // Already has country code
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      // US number
    } else if (cleaned.length < 10) {
      throw new Error('Invalid phone number format');
    }

    return cleaned;
  }

  /**
   * Get webhook configuration
   */
  async getWebhookInfo(): Promise<any> {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`
          }
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error('Error getting WhatsApp webhook info', {
        error: error.response?.data || error.message
      });
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.WHATSAPP_WEBHOOK_SECRET || 'your-webhook-secret')
      .update(payload)
      .digest('hex');

    return signature === `sha256=${expectedSignature}`;
  }
}

export default new WhatsAppCloudAPIService();
