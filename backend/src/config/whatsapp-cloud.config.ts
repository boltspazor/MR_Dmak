import logger from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from .env file

export interface WhatsAppCloudConfig {
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  apiVersion: string;
  baseURL: string;
  graphAPIBaseURL: string;
}

export interface WhatsAppServiceConfig {
  isEnabled: boolean;
  cloud: WhatsAppCloudConfig;
}

class WhatsAppConfigManager {
  private config: WhatsAppServiceConfig;

  constructor() {
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  private loadConfiguration(): WhatsAppServiceConfig {
    const isEnabled = process.env.WHATSAPP_ENABLED !== 'false';
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '715904891617490';
    const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '1176186791172596';
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    const apiVersion = process.env.WHATSAPP_API_VERSION || 'v19.0';

    const config: WhatsAppServiceConfig = {
      isEnabled,
      cloud: {
        phoneNumberId,
        businessAccountId,
        accessToken,
        apiVersion,
        baseURL: `https://graph.facebook.com/${apiVersion}/${phoneNumberId}`,
        graphAPIBaseURL: `https://graph.facebook.com/${apiVersion}`,
      },
    };

    return config;
  }

  private validateConfiguration(): void {
    const { isEnabled } = this.config;

    if (!isEnabled) {
      logger.warn('WhatsApp service is disabled via configuration');
      return;
    }

    this.validateCloudConfig();

    logger.info('WhatsApp configuration validated successfully', {
      isEnabled,
      cloudConfigured: !!this.config.cloud?.accessToken,
    });
  }

  private validateCloudConfig(): void {
    const cloud = this.config.cloud;

    const requiredFields = ['accessToken', 'phoneNumberId', 'businessAccountId'];
    const missingFields = requiredFields.filter(field => !cloud[field as keyof typeof cloud]);

    if (missingFields.length > 0) {
      logger.warn('WhatsApp Cloud API configuration incomplete', {
        missingFields,
        hasAccessToken: !!cloud.accessToken,
        hasPhoneNumberId: !!cloud.phoneNumberId,
        hasBusinessAccountId: !!cloud.businessAccountId,
      });
    }
  }

  // Getters for configuration
  get isEnabled(): boolean {
    return this.config.isEnabled;
  }

  get cloudConfig(): WhatsAppCloudConfig {
    return this.config.cloud;
  }

  // Helper methods
  isCloudEnabled(): boolean {
    return this.isEnabled;
  }

  // Get Meta template creation URLs
  getMetaTemplateCreationUrl(): string {
    const businessAccountId = this.cloudConfig.businessAccountId;
    if (!businessAccountId) {
      throw new Error('WhatsApp Business Account ID not configured');
    }
    return `https://business.facebook.com/wa/manage/message-templates/business/${businessAccountId}`;
  }

  getMetaBusinessManagerUrl(): string {
    const businessAccountId = this.cloudConfig.businessAccountId;
    if (!businessAccountId) {
      throw new Error('WhatsApp Business Account ID not configured');
    }
    return `https://business.facebook.com/wa/manage/accounts/${businessAccountId}`;
  }

  // Get API endpoints
  getMessageEndpoint(): string {
    return `${this.cloudConfig.baseURL}/messages`;
  }

  getTemplateEndpoint(): string {
    return `${this.cloudConfig.graphAPIBaseURL}/${this.cloudConfig.businessAccountId}/message_templates`;
  }

  // Get headers for API requests
  getCloudAPIHeaders(): { Authorization: string; 'Content-Type': string } {
    if (!this.cloudConfig.accessToken) {
      throw new Error('WhatsApp Cloud API access token not configured');
    }
    return {
      'Authorization': `Bearer ${this.cloudConfig.accessToken}`,
      'Content-Type': 'application/json',
    };
  }
}

// Export singleton instance
export const whatsappConfig = new WhatsAppConfigManager();

// Export individual configurations for backward compatibility
export const whatsappCloudConfig = whatsappConfig.cloudConfig;

// Export helper functions
export const isWhatsAppEnabled = () => whatsappConfig.isEnabled;
export const isCloudEnabled = () => whatsappConfig.isCloudEnabled();
