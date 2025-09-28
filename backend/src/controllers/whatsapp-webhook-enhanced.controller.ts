import { Request, Response } from 'express';
import MessageLog from '../models/MessageLog';
import Campaign from '../models/Campaign';
import logger from '../utils/logger';
import { 
  WhatsAppWebhookEventEnhanced, 
  WhatsAppWebhookChangeEnhanced,
  WhatsAppStatusEnhanced,
  WhatsAppMessageEnhanced,
  WhatsAppTemplateStatusUpdate,
  WhatsAppUserPreferences,
  WhatsAppPhoneQualityUpdate
} from '../types/whatsapp-enhanced';

/**
 * Enhanced WhatsApp Webhook Controller
 * Handles all WhatsApp Business Cloud API webhook events with proper tracking and compliance
 */
export class WhatsAppWebhookEnhancedController {
  
  /**
   * Main webhook handler for all WhatsApp events
   * Enhanced version that handles all required webhook fields
   */
  static async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      // Log incoming webhook for debugging
      logger.info('Received WhatsApp webhook', {
        headers: req.headers,
        body: req.body,
        timestamp: new Date().toISOString()
      });

      const webhookData: WhatsAppWebhookEventEnhanced = req.body;

      // Validate webhook payload structure
      if (!webhookData.object || webhookData.object !== 'whatsapp_business_account') {
        logger.warn('Invalid webhook object type', { object: webhookData.object });
        res.status(400).json({
          success: false,
          message: 'Invalid webhook object type'
        });
        return;
      }

      if (!webhookData.entry || !Array.isArray(webhookData.entry)) {
        logger.warn('Invalid webhook entry structure', { entry: webhookData.entry });
        res.status(400).json({
          success: false,
          message: 'Invalid webhook payload structure'
        });
        return;
      }

      // Process each entry
      for (const webhookEntry of webhookData.entry) {
        const { changes } = webhookEntry;
        
        if (!changes || !Array.isArray(changes)) {
          logger.warn('No changes found in webhook entry', { entryId: webhookEntry.id });
          continue;
        }

        // Process each change
        for (const change of changes) {
          await this.processWebhookChange(change);
        }
      }

      // Always respond with 200 OK quickly to acknowledge receipt
      res.status(200).json({ 
        success: true,
        message: 'Webhook processed successfully',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Webhook processing error:', error);
      // Still respond with 200 OK to prevent WhatsApp from retrying
      res.status(200).json({
        success: false,
        message: 'Webhook processing failed but acknowledged',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Process different types of webhook changes
   * Handles all required webhook fields: messages, message_template_status_update, user_preferences, phone_number_quality_update
   */
  private static async processWebhookChange(change: WhatsAppWebhookChangeEnhanced): Promise<void> {
    try {
      const { field, value } = change;

      logger.info('Processing webhook change', {
        field,
        messagingProduct: value.messaging_product,
        metadata: value.metadata,
        timestamp: new Date().toISOString()
      });

      switch (field) {
        case 'messages':
          await this.processMessageEvents(value);
          break;
        case 'message_template_status_update':
          await this.processTemplateStatusUpdates(value.message_template_status_update || []);
          break;
        case 'user_preferences':
          await this.processUserPreferences(value.user_preferences || []);
          break;
        case 'phone_number_quality_update':
          await this.processPhoneQualityUpdates(value.phone_number_quality_update || []);
          break;
        default:
          logger.info('Unhandled webhook field type', { field });
          break;
      }
    } catch (error) {
      logger.error('Error processing webhook change:', error);
    }
  }

  /**
   * Process message events (incoming messages and status updates)
   */
  private static async processMessageEvents(value: any): Promise<void> {
    try {
      // Handle message status updates
      if (value.statuses && Array.isArray(value.statuses)) {
        await this.processMessageStatuses(value.statuses);
      }

      // Handle incoming messages
      if (value.messages && Array.isArray(value.messages)) {
        await this.processIncomingMessages(value.messages);
      }

      // Handle contacts
      if (value.contacts && Array.isArray(value.contacts)) {
        await this.processContacts(value.contacts);
      }
    } catch (error) {
      logger.error('Error processing message events:', error);
    }
  }

  /**
   * Process message status updates with enhanced tracking
   */
  private static async processMessageStatuses(statuses: WhatsAppStatusEnhanced[]): Promise<void> {
    try {
      for (const status of statuses) {
        const { id: messageId, status: messageStatus, timestamp, recipient_id, conversation, pricing, errors } = status;

        if (!messageId || !messageStatus) {
          logger.warn('Invalid status data received', { messageId, messageStatus });
          continue;
        }

        logger.info('Processing message status update', {
          messageId,
          status: messageStatus,
          recipient: recipient_id,
          timestamp: timestamp ? new Date(parseInt(timestamp) * 1000) : null,
          conversation: conversation?.id,
          pricing: pricing?.category,
          errors: errors?.length || 0
        });

        // Update message log with new status
        const updateData: any = {
          status: messageStatus.toLowerCase(),
          lastUpdated: new Date(),
          updatedAt: new Date()
        };

        if (timestamp) {
          const statusTime = new Date(parseInt(timestamp) * 1000);
          
          // Set appropriate timestamp based on status
          switch (messageStatus.toLowerCase()) {
            case 'sent':
              updateData.sentAt = statusTime;
              break;
            case 'delivered':
              updateData.deliveredAt = statusTime;
              // Keep sentAt if not already set
              if (!updateData.sentAt) {
                updateData.sentAt = statusTime;
              }
              break;
            case 'read':
              updateData.readAt = statusTime;
              updateData.deliveredAt = statusTime;
              updateData.sentAt = statusTime;
              break;
            case 'failed':
              updateData.errorMessage = errors?.[0]?.message || 'Message failed to deliver';
              updateData.failedAt = statusTime;
              break;
            default:
              logger.warn('Unknown message status', { messageStatus });
              break;
          }
        }

        // Add conversation and pricing info if available
        if (conversation) {
          updateData.conversationId = conversation.id;
          updateData.conversationOrigin = conversation.origin?.type;
          if (conversation.expiration_timestamp) {
            updateData.conversationExpiration = new Date(parseInt(conversation.expiration_timestamp) * 1000);
          }
        }

        if (pricing) {
          updateData.pricingModel = pricing.pricing_model;
          updateData.pricingCategory = pricing.category;
          updateData.billable = pricing.billable;
        }

        // Update message log
        const updatedLog = await MessageLog.findOneAndUpdate(
          { messageId },
          updateData,
          { new: true }
        ).populate('campaignId');

        if (updatedLog) {
          logger.info('Message status updated via webhook', {
            messageId,
            status: messageStatus,
            recipient: recipient_id,
            campaignId: updatedLog.campaignId,
            mrId: updatedLog.mrId,
            phoneNumber: updatedLog.phoneNumber,
            timestamp: timestamp ? new Date(parseInt(timestamp) * 1000) : null,
            conversationId: conversation?.id,
            pricingCategory: pricing?.category
          });

          // Update campaign status if all messages are processed
          if (updatedLog.campaignId) {
            const { CampaignController } = await import('./backend/campaign.controller');
            await CampaignController.checkAndUpdateCampaignCompletion(updatedLog.campaignId.toString());
          }
        } else {
          logger.warn('Message log not found for webhook update', { 
            messageId, 
            status: messageStatus,
            recipient: recipient_id 
          });
        }
      }
    } catch (error) {
      logger.error('Error processing message statuses:', error);
    }
  }

  /**
   * Process incoming messages
   */
  private static async processIncomingMessages(messages: WhatsAppMessageEnhanced[]): Promise<void> {
    try {
      for (const message of messages) {
        logger.info('Received incoming message', {
          messageId: message.id,
          from: message.from,
          timestamp: message.timestamp,
          type: message.type
        });

        // Handle different message types
        switch (message.type) {
          case 'text':
            await this.handleTextMessage(message);
            break;
          case 'interactive':
            await this.handleInteractiveMessage(message);
            break;
          case 'button':
            await this.handleButtonMessage(message);
            break;
          default:
            logger.info('Unhandled message type', { type: message.type, messageId: message.id });
            break;
        }
      }
    } catch (error) {
      logger.error('Error processing incoming messages:', error);
    }
  }

  /**
   * Handle incoming text messages
   */
  private static async handleTextMessage(message: WhatsAppMessageEnhanced): Promise<void> {
    try {
      const text = message.text?.body || '';
      
      // Check for opt-out keywords
      const optOutKeywords = ['stop', 'unsubscribe', 'opt out', 'quit', 'cancel'];
      const isOptOut = optOutKeywords.some(keyword => 
        text.toLowerCase().includes(keyword.toLowerCase())
      );

      if (isOptOut) {
        await this.handleUserOptOut(message.from);
      }

      logger.info('Processed incoming text message', {
        messageId: message.id,
        from: message.from,
        textLength: text.length,
        isOptOut
      });
    } catch (error) {
      logger.error('Error handling text message:', error);
    }
  }

  /**
   * Handle interactive messages (quick replies, list selections)
   */
  private static async handleInteractiveMessage(message: WhatsAppMessageEnhanced): Promise<void> {
    try {
      logger.info('Processed interactive message', {
        messageId: message.id,
        from: message.from,
        type: message.type
      });
    } catch (error) {
      logger.error('Error handling interactive message:', error);
    }
  }

  /**
   * Handle button messages
   */
  private static async handleButtonMessage(message: WhatsAppMessageEnhanced): Promise<void> {
    try {
      logger.info('Processed button message', {
        messageId: message.id,
        from: message.from,
        type: message.type
      });
    } catch (error) {
      logger.error('Error handling button message:', error);
    }
  }

  /**
   * Handle user opt-out
   */
  private static async handleUserOptOut(phoneNumber: string): Promise<void> {
    try {
      // Update user preferences to opt-out
      // This would typically update a user preferences table
      logger.warn('User opted out', {
        phoneNumber,
        timestamp: new Date().toISOString()
      });

      // You can add logic here to:
      // 1. Update user preferences in database
      // 2. Remove user from marketing lists
      // 3. Send confirmation message
      // 4. Update campaign recipient lists
    } catch (error) {
      logger.error('Error handling user opt-out:', error);
    }
  }

  /**
   * Process contacts
   */
  private static async processContacts(contacts: any[]): Promise<void> {
    try {
      for (const contact of contacts) {
        logger.info('Received contact info', {
          waId: contact.wa_id,
          profileName: contact.profile?.name
        });

        // Store or update contact information
        // This would typically update a contacts table
      }
    } catch (error) {
      logger.error('Error processing contacts:', error);
    }
  }

  /**
   * Process template status updates
   */
  private static async processTemplateStatusUpdates(updates: WhatsAppTemplateStatusUpdate[]): Promise<void> {
    try {
      for (const update of updates) {
        logger.info('Template status update received', {
          templateId: update.message_template_id,
          templateName: update.message_template_name,
          templateLanguage: update.message_template_language,
          status: update.status,
          event: update.event,
          rejectionReason: update.rejection_reason
        });

        // Update template status in database
        // This would typically update a templates table
        if (update.status === 'REJECTED' && update.rejection_reason) {
          logger.warn('Template rejected', {
            templateName: update.message_template_name,
            reason: update.rejection_reason,
            reasonCode: update.rejection_reason_code,
            reasonDescription: update.rejection_reason_description
          });
        }
      }
    } catch (error) {
      logger.error('Error processing template status updates:', error);
    }
  }

  /**
   * Process user preferences updates
   */
  private static async processUserPreferences(preferences: WhatsAppUserPreferences[]): Promise<void> {
    try {
      for (const preference of preferences) {
        logger.info('User preferences update received', {
          phoneNumber: preference.phone_number,
          optInStatus: preference.preferences.opt_in_status,
          optInTimestamp: preference.preferences.opt_in_timestamp,
          optOutTimestamp: preference.preferences.opt_out_timestamp
        });

        // Update user preferences in database
        // This would typically update a user preferences table
        if (preference.preferences.opt_in_status === 'OPTED_OUT') {
          await this.handleUserOptOut(preference.phone_number);
        }
      }
    } catch (error) {
      logger.error('Error processing user preferences:', error);
    }
  }

  /**
   * Process phone number quality updates
   */
  private static async processPhoneQualityUpdates(updates: WhatsAppPhoneQualityUpdate[]): Promise<void> {
    try {
      for (const update of updates) {
        logger.info('Phone quality update received', {
          phoneNumber: update.phone_number,
          qualityRating: update.quality_rating,
          qualityScore: update.quality_score,
          qualityEvent: update.quality_event,
          timestamp: update.timestamp
        });

        // Update phone quality in database
        // This would typically update a phone quality table
        if (update.quality_rating === 'RED') {
          logger.warn('Phone number quality degraded', {
            phoneNumber: update.phone_number,
            qualityScore: update.quality_score
          });
        }
      }
    } catch (error) {
      logger.error('Error processing phone quality updates:', error);
    }
  }

  /**
   * Verify webhook (for WhatsApp Cloud API verification)
   * Enhanced with better logging and error handling
   */
  static async verifyWebhook(req: Request, res: Response) {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      logger.info('Webhook verification attempt', {
        mode,
        token: token ? '***' + String(token).slice(-4) : 'undefined',
        challenge: challenge ? 'present' : 'missing',
        timestamp: new Date().toISOString()
      });

      const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

      if (!verifyToken) {
        logger.error('WhatsApp webhook verify token not configured');
        res.status(500).json({ 
          error: 'Webhook verification token not configured',
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (mode === 'subscribe' && token === verifyToken) {
        logger.info('Webhook verified successfully', {
          mode,
          challenge: challenge ? 'present' : 'missing',
          timestamp: new Date().toISOString()
        });
        
        // Return the challenge string as required by WhatsApp
        res.status(200).send(challenge);
      } else {
        logger.warn('Webhook verification failed', { 
          mode, 
          tokenProvided: !!token,
          tokenMatch: token === verifyToken,
          timestamp: new Date().toISOString()
        });
        res.status(403).json({ 
          error: 'Forbidden - Invalid verification token',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      logger.error('Webhook verification error:', error);
      res.status(500).json({ 
        error: 'Internal server error during verification',
        timestamp: new Date().toISOString()
      });
    }
  }
}
