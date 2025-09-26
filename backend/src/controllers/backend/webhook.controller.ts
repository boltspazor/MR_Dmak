import { Request, Response } from 'express';
import MessageLog from '../../models/MessageLog';
import Campaign from '../../models/Campaign';
import logger from '../../utils/logger';
import { WhatsAppWebhookEvent, WhatsAppWebhookChange, WhatsAppStatus, WhatsAppMessage } from '../../types/communication';

export class WebhookController {
  /**
   * Handle WhatsApp Cloud API webhook events
   * Enhanced to handle all event types and provide better parsing
   */
  static async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      // Log incoming webhook for debugging
      logger.info('Received WhatsApp webhook', {
        headers: req.headers,
        body: req.body,
        timestamp: new Date().toISOString()
      });

      const webhookData: WhatsAppWebhookEvent = req.body;

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
   */
  private static async processWebhookChange(change: WhatsAppWebhookChange): Promise<void> {
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
        case 'message_deliveries':
          await this.processMessageDeliveries(value);
          break;
        case 'message_reads':
          await this.processMessageReads(value);
          break;
        case 'message_reactions':
          await this.processMessageReactions(value);
          break;
        case 'message_echoes':
          await this.processMessageEchoes(value);
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
   * Process message events (status updates, incoming messages)
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
   * Process incoming messages
   */
  private static async processIncomingMessages(messages: any[]): Promise<void> {
    try {
      for (const message of messages) {
        logger.info('Received incoming message', {
          messageId: message.id,
          from: message.from,
          timestamp: message.timestamp,
          type: message.type
        });

        // Here you can add logic to handle incoming messages
        // For example, auto-replies, message logging, etc.
        // This is where you'd implement your business logic for incoming messages
      }
    } catch (error) {
      logger.error('Error processing incoming messages:', error);
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

        // Here you can add logic to store or update contact information
      }
    } catch (error) {
      logger.error('Error processing contacts:', error);
    }
  }

  /**
   * Process message deliveries
   */
  private static async processMessageDeliveries(value: any): Promise<void> {
    logger.info('Processing message deliveries', { value });
    // Handle message delivery events
  }

  /**
   * Process message reads
   */
  private static async processMessageReads(value: any): Promise<void> {
    logger.info('Processing message reads', { value });
    // Handle message read events
  }

  /**
   * Process message reactions
   */
  private static async processMessageReactions(value: any): Promise<void> {
    logger.info('Processing message reactions', { value });
    // Handle message reaction events
  }

  /**
   * Process message echoes
   */
  private static async processMessageEchoes(value: any): Promise<void> {
    logger.info('Processing message echoes', { value });
    // Handle message echo events
  }

  /**
   * Process message status updates from webhook
   * Enhanced with better error handling and logging
   */
  private static async processMessageStatus(value: any) {
    try {
      const { statuses } = value;

      if (!statuses || !Array.isArray(statuses)) {
        return;
      }

      await this.processMessageStatuses(statuses);
    } catch (error) {
      logger.error('Error processing message status:', error);
    }
  }

  /**
   * Process message statuses array
   * Enhanced with comprehensive status handling
   */
  private static async processMessageStatuses(statuses: WhatsAppStatus[]): Promise<void> {
    try {
      for (const status of statuses) {
        const { id: messageId, status: messageStatus, timestamp, recipient_id, conversation, pricing } = status;

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
          pricing: pricing?.category
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
              updateData.errorMessage = 'Message failed to deliver';
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
            const { CampaignController } = await import('./campaign.controller');
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
