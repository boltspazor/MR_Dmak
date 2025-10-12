import { Request, Response } from 'express';
import MessageLog from '../../models/MessageLog';
import Campaign from '../../models/Campaign';
import logger from '../../utils/logger';
import { 
  WhatsAppWebhookEvent, 
  WhatsAppWebhookChange, 
  WhatsAppStatus, 
  WhatsAppMessage,
  WhatsAppWebhookDisplayData,
  WebhookProcessingResult
} from '../../types/communication';

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
          await WebhookController.processWebhookChange(change);
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
        await WebhookController.processMessageStatuses(value.statuses);
      }

      // Handle incoming messages
      if (value.messages && Array.isArray(value.messages)) {
        await WebhookController.processIncomingMessages(value.messages);
      }

      // Handle contacts
      if (value.contacts && Array.isArray(value.contacts)) {
        await WebhookController.processContacts(value.contacts);
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

      await WebhookController.processMessageStatuses(statuses);
    } catch (error) {
      logger.error('Error processing message status:', error);
    }
  }

  /**
   * Process message statuses array
   * Enhanced with comprehensive status handling and error details
   */
  private static async processMessageStatuses(statuses: WhatsAppStatus[]): Promise<void> {
    try {
      for (const status of statuses) {
        const { 
          id: messageId, 
          status: messageStatus, 
          timestamp, 
          recipient_id, 
          conversation, 
          pricing,
          errors 
        } = status;

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
          hasErrors: !!(errors && errors.length > 0),
          errorDetails: errors?.map(err => ({
            code: err.code,
            title: err.title,
            message: err.message
          }))
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
              updateData.failedAt = statusTime;
              // Enhanced error handling with detailed error information
              if (errors && errors.length > 0) {
                const primaryError = errors[0];
                updateData.errorMessage = primaryError.message || 'Message failed to deliver';
                updateData.errorCode = primaryError.code;
                updateData.errorTitle = primaryError.title;
                updateData.errorHref = primaryError.href;
                if (primaryError.error_data) {
                  updateData.errorDetails = primaryError.error_data.details;
                }
              } else {
                updateData.errorMessage = 'Message failed to deliver';
              }
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
            pricingCategory: pricing?.category,
            hasErrors: !!(errors && errors.length > 0)
          });

          // Also update recipients array inside Campaign to reflect latest status counts
          if (updatedLog.campaignId) {
            const campaignIdObj = updatedLog.campaignId as any;
            const CampaignModel = (await import('../../models/Campaign')).default;

            const recipientUpdate: any = {
              'recipients.$.status': messageStatus.toLowerCase(),
              updatedAt: new Date()
            };

            if (updateData.sentAt) recipientUpdate['recipients.$.sentAt'] = updateData.sentAt;
            if (updateData.deliveredAt) recipientUpdate['recipients.$.deliveredAt'] = updateData.deliveredAt;
            if (updateData.readAt) recipientUpdate['recipients.$.readAt'] = updateData.readAt;
            if (updateData.failedAt) recipientUpdate['recipients.$.failedAt'] = updateData.failedAt;
            if (updateData.errorMessage) recipientUpdate['recipients.$.errorMessage'] = updateData.errorMessage;
            if (messageId) recipientUpdate['recipients.$.messageId'] = messageId;

            await CampaignModel.updateOne(
              { _id: campaignIdObj, 'recipients.phone': updatedLog.phoneNumber },
              { $set: recipientUpdate }
            );

            // Recalculate counts efficiently
            const campaignDoc = await CampaignModel.findById(campaignIdObj).select('recipients');
            if (campaignDoc && campaignDoc.recipients) {
              const sent = campaignDoc.recipients.filter((r: any) => r.status === 'sent' || r.status === 'delivered' || r.status === 'read').length;
              const failed = campaignDoc.recipients.filter((r: any) => r.status === 'failed').length;
              const pending = campaignDoc.recipients.filter((r: any) => r.status === 'pending' || r.status === 'queued').length;
              await CampaignModel.updateOne({ _id: campaignIdObj }, {
                $set: { sentCount: sent, failedCount: failed, pendingCount: pending }
              });
            }

            // Update MR meta status if message failed
            if (messageStatus.toLowerCase() === 'failed' && updatedLog.mrId) {
              try {
                const MRService = (await import('../../services/mr.service')).MRService;
                const mrService = new MRService();
                
                const errorMessage = updateData.errorMessage || 'Message failed to deliver';
                const campaignId = campaignIdObj.toString();
                
                await mrService.updateMRMetaStatus(
                  updatedLog.mrId, 
                  'ERROR', 
                  errorMessage, 
                  campaignId
                );
                
                logger.info('Updated MR meta status due to message failure', {
                  mrId: updatedLog.mrId,
                  phoneNumber: updatedLog.phoneNumber,
                  errorMessage,
                  campaignId
                });
              } catch (error) {
                logger.error('Failed to update MR meta status', {
                  mrId: updatedLog.mrId,
                  error: (error as Error).message
                });
              }
            }
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
   * Format webhook data for user display
   * Converts raw webhook data into user-readable format
   */
  private static formatWebhookDataForDisplay(
    statuses: WhatsAppStatus[], 
    metadata: any
  ): WhatsAppWebhookDisplayData[] {
    return statuses.map(status => {
      const { 
        id: messageId, 
        status: messageStatus, 
        timestamp, 
        recipient_id, 
        conversation, 
        pricing,
        errors 
      } = status;

      const displayData: WhatsAppWebhookDisplayData = {
        messageId,
        phoneNumber: recipient_id,
        status: messageStatus,
        timestamp: timestamp ? new Date(parseInt(timestamp) * 1000) : new Date(),
      };

      // Add error information if present
      if (errors && errors.length > 0) {
        const primaryError = errors[0];
        displayData.error = {
          code: primaryError.code,
          title: primaryError.title,
          message: primaryError.message,
          href: primaryError.href
        };
      }

      // Add conversation information if present
      if (conversation) {
        displayData.conversation = {
          id: conversation.id,
          origin: conversation.origin?.type || 'unknown',
          expiration: conversation.expiration_timestamp ? 
            new Date(parseInt(conversation.expiration_timestamp) * 1000) : undefined
        };
      }

      // Add pricing information if present
      if (pricing) {
        displayData.pricing = {
          billable: pricing.billable,
          model: pricing.pricing_model,
          category: pricing.category
        };
      }

      // Add metadata if present
      if (metadata) {
        displayData.metadata = {
          phoneNumberId: metadata.phone_number_id,
          displayPhoneNumber: metadata.display_phone_number
        };
      }

      return displayData;
    });
  }

  /**
   * Test webhook logging for message sending
   * This endpoint helps test the webhook functionality
   */
  static async testWebhookLogging(req: Request, res: Response): Promise<void> {
    try {
      const { campaignId, messageId, phoneNumber, status } = req.body;

      if (!campaignId || !messageId || !phoneNumber || !status) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: campaignId, messageId, phoneNumber, status'
        });
        return;
      }

      // Log the test message
      logger.info('TEST WEBHOOK LOGGING - Message Status Update', {
        campaignId,
        messageId,
        phoneNumber,
        status,
        timestamp: new Date().toISOString(),
        testMode: true
      });

      // Create a test webhook payload
      const testWebhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'test-entry',
          changes: [{
            field: 'messages',
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+1234567890',
                phone_number_id: 'test-phone-id'
              },
              statuses: [{
                id: messageId,
                status: status,
                timestamp: Math.floor(Date.now() / 1000).toString(),
                recipient_id: phoneNumber,
                conversation: {
                  id: 'test-conversation',
                  origin: { type: 'marketing' }
                },
                pricing: {
                  billable: true,
                  pricing_model: 'CBP',
                  category: 'marketing'
                }
              }]
            }
          }]
        }]
      };

      // Process the test webhook
      await this.processMessageStatuses(testWebhookPayload.entry[0].changes[0].value.statuses);

      res.json({
        success: true,
        message: 'Test webhook logging completed',
        data: {
          campaignId,
          messageId,
          phoneNumber,
          status,
          timestamp: new Date().toISOString()
        }
      });

    } catch (error: any) {
      logger.error('Error in test webhook logging:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process test webhook logging'
      });
    }
  }

  /**
   * Get webhook data for display
   * Retrieves and formats recent webhook data for user display
   */
  static async getWebhookData(req: Request, res: Response): Promise<void> {
    try {
      const { 
        limit = 50, 
        status, 
        startDate, 
        endDate,
        messageId 
      } = req.query;

      // Build query for MessageLog
      const query: any = {};
      
      if (status) {
        query.status = status;
      }
      
      if (messageId) {
        query.messageId = messageId;
      }
      
      if (startDate || endDate) {
        query.updatedAt = {};
        if (startDate) {
          query.updatedAt.$gte = new Date(startDate as string);
        }
        if (endDate) {
          query.updatedAt.$lte = new Date(endDate as string);
        }
      }

      // Get message logs with webhook updates
      const messageLogs = await MessageLog.find(query)
        .populate('campaignId', 'campaignId name status')
        .sort({ updatedAt: -1 })
        .limit(parseInt(limit as string) || 50);

      // Format data for display
      const displayData: WhatsAppWebhookDisplayData[] = messageLogs.map(log => ({
        messageId: log.messageId || '',
        phoneNumber: log.phoneNumber || '',
        status: log.status || 'unknown',
        timestamp: log.updatedAt || new Date(),
        error: log.errorMessage ? {
          code: log.errorCode || 0,
          title: log.errorTitle || 'Error',
          message: log.errorMessage,
          href: log.errorHref
        } : undefined,
        conversation: log.conversationId ? {
          id: log.conversationId,
          origin: log.conversationOrigin || 'unknown',
          expiration: log.conversationExpiration
        } : undefined,
        pricing: log.pricingCategory ? {
          billable: log.billable || false,
          model: log.pricingModel || 'unknown',
          category: log.pricingCategory
        } : undefined,
        metadata: {
          phoneNumberId: 'unknown',
          displayPhoneNumber: 'unknown'
        }
      }));

      const result: WebhookProcessingResult = {
        success: true,
        processedCount: displayData.length,
        failedCount: displayData.filter(d => d.status === 'failed').length,
        data: displayData,
        timestamp: new Date()
      };

      res.json({
        success: true,
        message: 'Webhook data retrieved successfully',
        data: result
      });

    } catch (error) {
      logger.error('Error retrieving webhook data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve webhook data'
      });
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
