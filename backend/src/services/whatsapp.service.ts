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
    this.accessToken = whatsappConfig.accessToken;
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
        ...((message.type === 'template' && message.template) ? { template: message.template } : {}),
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

      // Check if it's a verification issue
      const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to send message';
      let userFriendlyError = errorMessage;
      
      if (errorMessage.includes('verification') || errorMessage.includes('not verified')) {
        userFriendlyError = 'Phone number not verified. Please verify your WhatsApp Business phone number in Meta Business Manager.';
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
        userFriendlyError = 'Rate limit exceeded. Please try again later.';
      }

      return {
        success: false,
        error: userFriendlyError,
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

  // Helper method to create template messages
  createTemplateMessage(to: string, templateName: string, languageCode: string = 'en_US', parameters?: Array<{ type: string; text: string }>): WhatsAppMessage {
    const template: WhatsAppMessage = {
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode }
      }
    };

    // Add parameters if provided
    if (parameters && parameters.length > 0) {
      template.template!.components = [{
        type: 'body',
        parameters: parameters
      }];
    }

    return template;
  }

  // Helper method to create hello_world template message
  createHelloWorldMessage(to: string): WhatsAppMessage {
    return this.createTemplateMessage(to, 'hello_world', 'en_US');
  }

  // Helper method to create a custom template message with user content
  createCustomTemplateMessage(to: string, content: string, templateName: string = 'hello_world'): WhatsAppMessage {
    // For now, we'll use hello_world template but we can create a custom one
    // If you have a custom template approved, replace 'hello_world' with your template name
    return this.createTemplateMessage(to, templateName, 'en_US', [
      { type: 'text', text: content }
    ]);
  }

  // Helper method to create a text message (fallback for when templates don't work)
  createTextMessage(to: string, content: string): WhatsAppMessage {
    return {
      to,
      type: 'text',
      text: { body: content }
    };
  }

  async verifyWebhook(mode: string, token: string, challenge: string): Promise<string | null> {
    const verifyToken = whatsappConfig.verifyToken;
    
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
    
    logger.warn('Webhook verification failed', { 
      mode, 
      token: token ? `${token.substring(0, 4)}...` : 'undefined',
      expectedToken: verifyToken ? `${verifyToken.substring(0, 4)}...` : 'undefined',
      tokensMatch: token === verifyToken
    });
    return null;
  }

  processWebhookEvent(body: any): void {
    try {
      logger.info('Processing webhook event', { 
        object: body.object,
        entryCount: body.entry?.length || 0
      });

      // Process webhook events (delivery status, incoming messages, etc.)
      if (body.entry) {
        body.entry.forEach((entry: any) => {
          if (entry.changes) {
            entry.changes.forEach((change: any) => {
              if (change.field === 'messages') {
                this.handleMessageEvents(change.value);
              }
            });
          }
        });
      }
    } catch (error) {
      logger.error('Failed to process webhook event', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        body: JSON.stringify(body, null, 2)
      });
    }
  }

  private handleMessageEvents(value: any): void {
    // Handle incoming messages
    if (value.messages) {
      value.messages.forEach((message: any) => {
        this.handleIncomingMessage(message);
      });
    }

    // Handle message status updates
    if (value.statuses) {
      value.statuses.forEach((status: any) => {
        this.handleMessageStatus(status);
      });
    }
  }

  private handleIncomingMessage(message: any): void {
    try {
      logger.info('Incoming WhatsApp message', {
        messageId: message.id,
        from: message.from,
        type: message.type,
        timestamp: message.timestamp
      });

      // Process different message types
      switch (message.type) {
        case 'text':
          this.handleTextMessage(message);
          break;
        case 'image':
          this.handleImageMessage(message);
          break;
        case 'document':
          this.handleDocumentMessage(message);
          break;
        case 'audio':
          this.handleAudioMessage(message);
          break;
        case 'video':
          this.handleVideoMessage(message);
          break;
        case 'location':
          this.handleLocationMessage(message);
          break;
        case 'contacts':
          this.handleContactMessage(message);
          break;
        default:
          logger.warn('Unsupported message type', { 
            type: message.type,
            messageId: message.id 
          });
      }
    } catch (error) {
      logger.error('Failed to handle incoming message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId: message.id,
        from: message.from
      });
    }
  }

  private handleTextMessage(message: any): void {
    const text = message.text?.body || '';
    logger.info('Text message received', {
      messageId: message.id,
      from: message.from,
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      length: text.length
    });

    // Here you can add logic to:
    // - Store the message in database
    // - Process commands
    // - Send auto-replies
    // - Forward to appropriate handlers
  }

  private handleImageMessage(message: any): void {
    logger.info('Image message received', {
      messageId: message.id,
      from: message.from,
      imageId: message.image?.id,
      mimeType: message.image?.mime_type,
      sha256: message.image?.sha256
    });
  }

  private handleDocumentMessage(message: any): void {
    logger.info('Document message received', {
      messageId: message.id,
      from: message.from,
      documentId: message.document?.id,
      filename: message.document?.filename,
      mimeType: message.document?.mime_type
    });
  }

  private handleAudioMessage(message: any): void {
    logger.info('Audio message received', {
      messageId: message.id,
      from: message.from,
      audioId: message.audio?.id,
      mimeType: message.audio?.mime_type
    });
  }

  private handleVideoMessage(message: any): void {
    logger.info('Video message received', {
      messageId: message.id,
      from: message.from,
      videoId: message.video?.id,
      mimeType: message.video?.mime_type
    });
  }

  private handleLocationMessage(message: any): void {
    logger.info('Location message received', {
      messageId: message.id,
      from: message.from,
      latitude: message.location?.latitude,
      longitude: message.location?.longitude,
      name: message.location?.name,
      address: message.location?.address
    });
  }

  private handleContactMessage(message: any): void {
    logger.info('Contact message received', {
      messageId: message.id,
      from: message.from,
      contactCount: message.contacts?.length || 0
    });
  }

  private handleMessageStatus(status: any): void {
    logger.info('Message status update', {
      messageId: status.id,
      status: status.status,
      timestamp: status.timestamp,
      recipientId: status.recipient_id
    });

    // Here you can add logic to:
    // - Update message status in database
    // - Track delivery metrics
    // - Handle failed messages
    // - Update user interface
  }

  // WhatsApp Business API - Allowed Recipients Management
  // Using local database since WhatsApp Business API doesn't provide allowed_recipients field
  async getAllowedRecipients(): Promise<{ success: boolean; recipients?: string[]; error?: string }> {
    try {
      const AllowedRecipient = (await import('../models/AllowedRecipient')).default;
      
      const recipients = await AllowedRecipient.find({ isActive: true })
        .select('phoneNumber formattedPhoneNumber addedAt')
        .sort({ addedAt: -1 });

      const phoneNumbers = recipients.map(recipient => recipient.phoneNumber);

      logger.info('Retrieved allowed recipients from database', {
        count: phoneNumbers.length
      });

      return {
        success: true,
        recipients: phoneNumbers
      };
    } catch (error: any) {
      logger.error('Failed to get allowed recipients', {
        error: error.message
      });

      return {
        success: false,
        error: error.message || 'Failed to get allowed recipients',
      };
    }
  }

  async addAllowedRecipients(phoneNumbers: string[], userId?: string): Promise<{ success: boolean; added?: string[]; error?: string }> {
    try {
      const AllowedRecipient = (await import('../models/AllowedRecipient')).default;
      
      // Format phone numbers (remove + and non-digits)
      const formattedNumbers = phoneNumbers.map(num => this.formatPhoneNumber(num));
      
      const addedRecipients = [];
      
      for (const phoneNumber of formattedNumbers) {
        try {
          // Check if recipient already exists
          const existingRecipient = await AllowedRecipient.findOne({ phoneNumber });
          
          if (existingRecipient) {
            // Reactivate if inactive
            if (!existingRecipient.isActive) {
              await AllowedRecipient.findByIdAndUpdate(existingRecipient._id, { 
                isActive: true,
                addedAt: new Date()
              });
              addedRecipients.push(phoneNumber);
            }
          } else {
            // Create new recipient
            await AllowedRecipient.create({
              phoneNumber,
              formattedPhoneNumber: phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`,
              addedBy: userId || null,
              isActive: true
            });
            addedRecipients.push(phoneNumber);
          }
        } catch (error: any) {
          logger.warn('Failed to add individual recipient', { phoneNumber, error: error.message });
        }
      }

      logger.info('Added recipients to allowed list', {
        count: addedRecipients.length,
        numbers: addedRecipients
      });

      return {
        success: true,
        added: addedRecipients
      };
    } catch (error: any) {
      logger.error('Failed to add allowed recipients', {
        phoneNumbers,
        error: error.message
      });

      return {
        success: false,
        error: error.message || 'Failed to add allowed recipients',
      };
    }
  }

  async removeAllowedRecipients(phoneNumbers: string[]): Promise<{ success: boolean; removed?: string[]; error?: string }> {
    try {
      const AllowedRecipient = (await import('../models/AllowedRecipient')).default;
      
      // Format phone numbers to remove
      const formattedNumbers = phoneNumbers.map(num => this.formatPhoneNumber(num));
      
      // Soft delete by setting isActive to false
      const result = await AllowedRecipient.updateMany(
        { phoneNumber: { $in: formattedNumbers } },
        { isActive: false }
      );

      logger.info('Removed recipients from allowed list', {
        count: result.modifiedCount,
        numbers: formattedNumbers
      });

      return {
        success: true,
        removed: formattedNumbers
      };
    } catch (error: any) {
      logger.error('Failed to remove allowed recipients', {
        phoneNumbers,
        error: error.message
      });

      return {
        success: false,
        error: error.message || 'Failed to remove allowed recipients',
      };
    }
  }

  async addSingleAllowedRecipient(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    const result = await this.addAllowedRecipients([phoneNumber]);
    return {
      success: result.success,
      error: result.error
    };
  }

  async removeSingleAllowedRecipient(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    const result = await this.removeAllowedRecipients([phoneNumber]);
    return {
      success: result.success,
      error: result.error
    };
  }
}