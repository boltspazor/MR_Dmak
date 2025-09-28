import axios, { AxiosResponse } from 'axios';
import logger from '../utils/logger';
import { whatsappConfig } from '../config/whatsapp-cloud.config';
import { 
  WhatsAppTemplateMessage, 
  WhatsAppMessageResponse, 
  WhatsAppCampaignMessage 
} from '../types/whatsapp-enhanced';
import MessageLog from '../models/MessageLog';
import Campaign from '../models/Campaign';

/**
 * Enhanced WhatsApp Marketing Service
 * Handles marketing template messages with proper tracking and webhook integration
 */
export class WhatsAppMarketingService {
  private phoneNumberId: string;
  private businessAccountId: string;
  private accessToken: string;
  private apiVersion: string;
  private baseURL: string;

  constructor() {
    this.phoneNumberId = whatsappConfig.cloudConfig.phoneNumberId;
    this.businessAccountId = whatsappConfig.cloudConfig.businessAccountId;
    this.accessToken = whatsappConfig.cloudConfig.accessToken;
    this.apiVersion = whatsappConfig.cloudConfig.apiVersion;
    this.baseURL = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}`;
  }

  /**
   * Send a marketing template message with proper tracking
   * Enhanced version of the existing sendTemplateMessage with better error handling and tracking
   */
  async sendMarketingTemplateMessage(
    to: string,
    templateName: string,
    templateLanguage: string = 'en_US',
    parameters: Array<{name: string, value: string}> = [],
    campaignId?: string,
    mrId?: string
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
    data?: WhatsAppMessageResponse;
  }> {
    try {
      // Format phone number
      const formattedPhone = this.formatPhoneNumber(to);
      
      // Build template message with proper components
      const messageData: WhatsAppTemplateMessage = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: templateLanguage
          },
          components: this.buildTemplateComponents(parameters)
        }
      };

      logger.info('Sending WhatsApp marketing template message', {
        to: formattedPhone,
        templateName,
        templateLanguage,
        parametersCount: parameters.length,
        campaignId,
        mrId
      });

      // Send message via WhatsApp Cloud API
      const response: AxiosResponse<WhatsAppMessageResponse> = await axios.post(
        `${this.baseURL}/messages`,
        messageData,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const messageId = response.data.messages[0]?.id;
      const messageStatus = response.data.messages[0]?.message_status;

      logger.info('WhatsApp marketing template message sent successfully', {
        messageId,
        messageStatus,
        templateName,
        to: formattedPhone
      });

      // Store message tracking data if campaign info provided
      if (campaignId && mrId && messageId) {
        await this.storeMessageTracking({
          campaignId,
          messageId,
          recipientId: mrId,
          phoneNumber: formattedPhone,
          templateName,
          templateLanguage,
          status: 'sent',
          sentAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      return {
        success: true,
        messageId,
        data: response.data
      };

    } catch (error: any) {
      logger.error('Error sending WhatsApp marketing template message', {
        error: error.response?.data || error.message,
        to: this.formatPhoneNumber(to),
        templateName,
        campaignId,
        mrId
      });

      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Build template components from parameters
   * Handles different parameter types for marketing templates
   */
  private buildTemplateComponents(parameters: Array<{name: string, value: string}>): any[] {
    const components: any[] = [];
    
    // Group parameters by component type
    const bodyParams = parameters.filter(p => 
      !p.name.includes('header') && 
      !p.name.includes('footer') && 
      !p.name.includes('button')
    );
    
    const headerParams = parameters.filter(p => p.name.includes('header'));
    const footerParams = parameters.filter(p => p.name.includes('footer'));
    const buttonParams = parameters.filter(p => p.name.includes('button'));

    // Add header component if parameters exist
    if (headerParams.length > 0) {
      components.push({
        type: 'header',
        parameters: headerParams.map(param => ({
          type: this.detectParameterType(param.value),
          ...this.buildParameterValue(param.value)
        }))
      });
    }

    // Add body component if parameters exist
    if (bodyParams.length > 0) {
      components.push({
        type: 'body',
        parameters: bodyParams.map(param => ({
          type: 'text',
          text: param.value
        }))
      });
    }

    // Add footer component if parameters exist
    if (footerParams.length > 0) {
      components.push({
        type: 'footer',
        parameters: footerParams.map(param => ({
          type: 'text',
          text: param.value
        }))
      });
    }

    // Add button component if parameters exist
    if (buttonParams.length > 0) {
      components.push({
        type: 'button',
        parameters: buttonParams.map(param => ({
          type: 'text',
          text: param.value
        }))
      });
    }

    return components;
  }

  /**
   * Detect parameter type based on value content
   */
  private detectParameterType(value: string): 'text' | 'image' | 'document' | 'video' | 'location' | 'currency' | 'date_time' {
    if (value.startsWith('http') && (value.includes('.jpg') || value.includes('.jpeg') || value.includes('.png'))) {
      return 'image';
    }
    if (value.startsWith('http') && (value.includes('.pdf') || value.includes('.doc'))) {
      return 'document';
    }
    if (value.startsWith('http') && (value.includes('.mp4') || value.includes('.mov'))) {
      return 'video';
    }
    if (value.includes('$') || value.includes('€') || value.includes('£')) {
      return 'currency';
    }
    if (value.includes('/') && (value.includes('2024') || value.includes('2025'))) {
      return 'date_time';
    }
    return 'text';
  }

  /**
   * Build parameter value based on type
   */
  private buildParameterValue(value: string): any {
    const type = this.detectParameterType(value);
    
    switch (type) {
      case 'image':
        return {
          image: {
            link: value
          }
        };
      case 'document':
        return {
          document: {
            link: value,
            filename: value.split('/').pop() || 'document'
          }
        };
      case 'video':
        return {
          video: {
            link: value
          }
        };
      case 'currency':
        return {
          currency: {
            fallback_value: value,
            code: this.extractCurrencyCode(value),
            amount_1000: this.extractAmount(value) * 1000
          }
        };
      case 'date_time':
        return {
          date_time: {
            fallback_value: value
          }
        };
      default:
        return {
          text: value
        };
    }
  }

  /**
   * Extract currency code from value
   */
  private extractCurrencyCode(value: string): string {
    if (value.includes('$')) return 'USD';
    if (value.includes('€')) return 'EUR';
    if (value.includes('£')) return 'GBP';
    return 'USD';
  }

  /**
   * Extract amount from currency value
   */
  private extractAmount(value: string): number {
    const match = value.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
  }

  /**
   * Store message tracking information
   */
  private async storeMessageTracking(messageData: Partial<WhatsAppCampaignMessage>): Promise<void> {
    try {
      // Update MessageLog with WhatsApp message ID
      await MessageLog.findOneAndUpdate(
        { 
          campaignId: messageData.campaignId,
          mrId: messageData.recipientId 
        },
        {
          messageId: messageData.messageId,
          status: messageData.status,
          sentAt: messageData.sentAt,
          updatedAt: new Date()
        },
        { upsert: false }
      );

      logger.info('Message tracking stored successfully', {
        messageId: messageData.messageId,
        campaignId: messageData.campaignId,
        mrId: messageData.recipientId
      });
    } catch (error) {
      logger.error('Error storing message tracking', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageData
      });
    }
  }

  /**
   * Format phone number for WhatsApp API
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present
    if (!cleaned.startsWith('1') && cleaned.length === 10) {
      cleaned = '1' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Get webhook subscription configuration
   */
  getWebhookSubscriptionConfig(): any {
    return {
      object: 'whatsapp_business_account',
      callback_url: `${process.env.API_BASE_URL || 'https://mrbackend-production-2ce3.up.railway.app'}/api/webhook`,
      fields: ['messages', 'message_template_status_update', 'user_preferences', 'phone_number_quality_update'],
      verify_token: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'token1234'
    };
  }

  /**
   * Subscribe to webhook events
   */
  async subscribeToWebhooks(): Promise<boolean> {
    try {
      const subscriptionConfig = this.getWebhookSubscriptionConfig();
      
      const response = await axios.post(
        `https://graph.facebook.com/${this.apiVersion}/${this.businessAccountId}/subscribed_apps`,
        subscriptionConfig,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      logger.info('Webhook subscription successful', {
        businessAccountId: this.businessAccountId,
        callbackUrl: subscriptionConfig.callback_url,
        fields: subscriptionConfig.fields
      });

      return true;
    } catch (error: any) {
      logger.error('Error subscribing to webhooks', {
        error: error.response?.data || error.message,
        businessAccountId: this.businessAccountId
      });
      return false;
    }
  }
}

export default new WhatsAppMarketingService();
