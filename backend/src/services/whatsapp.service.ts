import axios from 'axios';
import { whatsappConfig } from '../config/whatsapp';
import { WhatsAppMessage } from '../types';
import logger from '../utils/logger';

export class WhatsAppService {
  private apiUrl: string;
  private accessToken: string;
  private phoneNumberId: string;

  constructor() {
    this.apiUrl = whatsappConfig.apiUrl;
    this.accessToken = whatsappConfig.accessToken!;
    this.phoneNumberId = whatsappConfig.phoneNumberId!;
    
    // Log configuration status for debugging
    if (!this.accessToken || !this.phoneNumberId) {
      logger.warn('WhatsApp configuration incomplete', {
        hasAccessToken: !!this.accessToken,
        hasPhoneNumberId: !!this.phoneNumberId
      });
    }
  }

  async sendMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.accessToken || !this.phoneNumberId) {
        throw new Error('WhatsApp configuration missing');
      }

      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      
      const payload = {
        messaging_product: "whatsapp",
        to: this.formatPhoneNumber(message.to),
        type: message.type,
        ...((message.type === 'text' && message.text) ? { text: message.text } : {}),
        ...((message.type === 'image' && message.image) ? { image: message.image } : {}),
      };

      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      logger.info('WhatsApp message sent successfully', {
        to: message.to,
        messageId: response.data.messages[0].id
      });

      return {
        success: true,
        messageId: response.data.messages[0].id,
      };
    } catch (error: any) {
      logger.error('Failed to send WhatsApp message', {
        to: message.to,
        error: error.response?.data || error.message
      });

      return {
        success: false,
        error: error.response?.data?.error?.message || error.message || 'Failed to send message',
      };
    }
  }

  async sendBulkMessages(messages: WhatsAppMessage[]): Promise<Array<{ to: string; success: boolean; messageId?: string; error?: string }>> {
    const results = [];
    
    for (const message of messages) {
      const result = await this.sendMessage(message);
      results.push({
        to: message.to,
        ...result
      });
      
      // Rate limiting: Wait 1 second between messages to avoid API limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  formatPhoneNumber(phone: string): string {
    // Remove + and any non-digit characters for WhatsApp API
    return phone.replace(/^\+/, '').replace(/\D/g, '');
  }

  async verifyWebhook(mode: string, token: string, challenge: string): Promise<string | null> {
    const verifyToken = whatsappConfig.verifyToken || 'token1234'; // Fallback for testing
    
    // Log verification attempt for debugging
    logger.info('Webhook verification attempt', { 
      mode, 
      token: token ? `${token.substring(0, 4)}...` : 'undefined',
      hasVerifyToken: !!verifyToken,
      verifyTokenValue: verifyToken ? `${verifyToken.substring(0, 4)}...` : 'undefined',
      challenge: challenge ? `${challenge.substring(0, 4)}...` : 'undefined',
      tokensMatch: token === verifyToken
    });
    
    if (!verifyToken) {
      logger.error('WHATSAPP_VERIFY_TOKEN environment variable not set');
      return null;
    }
    
    if (mode === 'subscribe' && token === verifyToken) {
      logger.info('Webhook verified successfully');
      return challenge;
    }
    
<<<<<<< Updated upstream
<<<<<<< HEAD
    logger.warn('Webhook verification failed', { mode, token: token ? `${token.substring(0, 4)}...` : 'undefined' });
=======
=======
>>>>>>> Stashed changes
    logger.warn('Webhook verification failed', { 
      mode, 
      token: token ? `${token.substring(0, 4)}...` : 'undefined',
      expectedToken: verifyToken ? `${verifyToken.substring(0, 4)}...` : 'undefined',
      tokensMatch: token === verifyToken
    });
<<<<<<< Updated upstream
>>>>>>> origin/main
=======
>>>>>>> Stashed changes
    return null;
  }

  processWebhookEvent(body: any): void {
    try {
      // Process webhook events (delivery status, etc.)
      if (body.entry) {
        body.entry.forEach((entry: any) => {
          if (entry.changes) {
            entry.changes.forEach((change: any) => {
              if (change.field === 'messages') {
                this.handleMessageStatus(change.value);
              }
            });
          }
        });
      }
    } catch (error) {
      logger.error('Failed to process webhook event', { error, body });
    }
  }

  private handleMessageStatus(value: any): void {
    // Handle message status updates
    if (value.statuses) {
      value.statuses.forEach((status: any) => {
        logger.info('Message status update', {
          messageId: status.id,
          status: status.status,
          timestamp: status.timestamp
        });
        // Update message log status in database
      });
    }
    
  }
}
