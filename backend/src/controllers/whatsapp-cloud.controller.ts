import { Request, Response } from 'express';
import logger from '../utils/logger';
import whatsappCloudAPI from '../services/whatsapp-cloud-api.service';

class WhatsAppCloudController {
  /**
   * Send a single text message
   */
  async sendSingleMessage(req: Request, res: Response): Promise<void> {
    try {
      const { to, message } = req.body;

      if (!to || !message) {
        res.status(400).json({
          success: false,
          error: 'Phone number and message are required'
        });
        return;
      }

      logger.info('Sending single WhatsApp message', { to, messageLength: message.length });

      const result = await whatsappCloudAPI.sendTextMessage(to, message);

      res.json({
        success: true,
        message: 'Message sent successfully',
        data: {
          messageId: result.messages[0]?.id,
          status: result.messages[0]?.message_status,
          recipient: result.contacts[0]?.wa_id
        }
      });
    } catch (error: any) {
      logger.error('Error sending single WhatsApp message', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Send a template message with parameters
   */
  async sendTemplateMessage(req: Request, res: Response): Promise<void> {
    try {
      const { to, templateName, parameters, languageCode } = req.body;

      if (!to || !templateName) {
        res.status(400).json({
          success: false,
          error: 'Phone number and template name are required'
        });
        return;
      }

      logger.info('Sending WhatsApp template message', { 
        to, 
        templateName, 
        parametersCount: parameters?.length || 0 
      });

      const result = await whatsappCloudAPI.sendTemplateMessage(
        to, 
        templateName, 
        parameters || [], 
        languageCode || 'en_US'
      );

      res.json({
        success: true,
        message: 'Template message sent successfully',
        data: {
          messageId: result.messages[0]?.id,
          status: result.messages[0]?.message_status,
          recipient: result.contacts[0]?.wa_id
        }
      });
    } catch (error: any) {
      logger.error('Error sending WhatsApp template message', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Send an image message
   */
  async sendImageMessage(req: Request, res: Response): Promise<void> {
    try {
      const { to, imageUrl, caption } = req.body;

      if (!to || !imageUrl) {
        res.status(400).json({
          success: false,
          error: 'Phone number and image URL are required'
        });
        return;
      }

      logger.info('Sending WhatsApp image message', { to, imageUrl, hasCaption: !!caption });

      const result = await whatsappCloudAPI.sendImageMessage(to, imageUrl, caption);

      res.json({
        success: true,
        message: 'Image message sent successfully',
        data: {
          messageId: result.messages[0]?.id,
          status: result.messages[0]?.message_status,
          recipient: result.contacts[0]?.wa_id
        }
      });
    } catch (error: any) {
      logger.error('Error sending WhatsApp image message', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Build a personalized message from template
   */
  async buildMessage(req: Request, res: Response): Promise<void> {
    try {
      const { templateContent, parameters } = req.body;

      if (!templateContent) {
        res.status(400).json({
          success: false,
          error: 'Template content is required'
        });
        return;
      }

      const builtMessage = whatsappCloudAPI.buildMessage(templateContent, parameters || {});

      res.json({
        success: true,
        message: 'Message built successfully',
        data: {
          originalTemplate: templateContent,
          parameters: parameters || {},
          builtMessage: builtMessage
        }
      });
    } catch (error: any) {
      logger.error('Error building message', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Send bulk messages to multiple recipients
   */
  async sendBulkMessages(req: Request, res: Response): Promise<void> {
    try {
      const { recipients, message, templateName, parameters } = req.body;

      if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Recipients array is required'
        });
        return;
      }

      if (!message && !templateName) {
        res.status(400).json({
          success: false,
          error: 'Either message or templateName is required'
        });
        return;
      }

      logger.info('Sending bulk WhatsApp messages', { 
        recipientsCount: recipients.length,
        hasMessage: !!message,
        hasTemplate: !!templateName
      });

      const results = [];
      const errors = [];

      // Process messages in batches to avoid rate limiting
      const batchSize = 5;
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (recipient: any) => {
          try {
            let result;
            if (templateName) {
              result = await whatsappCloudAPI.sendTemplateMessage(
                recipient.phone,
                templateName,
                parameters || [],
                'en_US'
              );
            } else {
              result = await whatsappCloudAPI.sendTextMessage(recipient.phone, message);
            }

            return {
              recipient: recipient.phone,
              success: true,
              messageId: result.messages[0]?.id,
              status: result.messages[0]?.message_status
            };
          } catch (error: any) {
            return {
              recipient: recipient.phone,
              success: false,
              error: error.message
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to respect rate limits
        if (i + batchSize < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      logger.info('Bulk WhatsApp messages completed', { 
        total: recipients.length,
        success: successCount,
        failed: failureCount
      });

      res.json({
        success: true,
        message: `Bulk messages processed. ${successCount} sent, ${failureCount} failed.`,
        data: {
          total: recipients.length,
          success: successCount,
          failed: failureCount,
          results: results
        }
      });
    } catch (error: any) {
      logger.error('Error sending bulk WhatsApp messages', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get message status
   */
  async getMessageStatus(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;

      if (!messageId) {
        res.status(400).json({
          success: false,
          error: 'Message ID is required'
        });
        return;
      }

      const status = await whatsappCloudAPI.getMessageStatus(messageId);

      res.json({
        success: true,
        message: 'Message status retrieved successfully',
        data: status
      });
    } catch (error: any) {
      logger.error('Error getting message status', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Webhook endpoint for receiving WhatsApp messages and status updates
   */
  async webhook(req: Request, res: Response): Promise<void> {
    try {
      // Handle verification challenge
      if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
          logger.info('WhatsApp webhook verified successfully');
          res.status(200).send(challenge);
          return;
        } else {
          logger.warn('WhatsApp webhook verification failed', { mode, token });
          res.status(403).json({ error: 'Verification failed' });
          return;
        }
      }

      // Handle incoming messages
      if (req.method === 'POST') {
        const body = req.body;
        
        logger.info('Received WhatsApp webhook', { 
          object: body.object,
          entries: body.entry?.length || 0
        });

        // Process each entry
        if (body.entry) {
          for (const entry of body.entry) {
            if (entry.changes) {
              for (const change of entry.changes) {
                if (change.field === 'messages') {
                  // Process message status updates
                  if (change.value.statuses) {
                    for (const status of change.value.statuses) {
                      logger.info('Message status update', {
                        messageId: status.id,
                        status: status.status,
                        timestamp: status.timestamp,
                        recipient: status.recipient_id
                      });
                      // Here you can update your database with the message status
                    }
                  }

                  // Process incoming messages
                  if (change.value.messages) {
                    for (const message of change.value.messages) {
                      logger.info('Incoming WhatsApp message', {
                        messageId: message.id,
                        from: message.from,
                        type: message.type,
                        timestamp: message.timestamp
                      });
                      // Here you can process incoming messages
                    }
                  }
                }
              }
            }
          }
        }

        res.status(200).json({ status: 'ok' });
        return;
      }

      res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
      logger.error('Error processing WhatsApp webhook', { error: error.message });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get webhook information
   */
  async getWebhookInfo(req: Request, res: Response): Promise<void> {
    try {
      const info = await whatsappCloudAPI.getWebhookInfo();

      res.json({
        success: true,
        message: 'Webhook information retrieved successfully',
        data: info
      });
    } catch (error: any) {
      logger.error('Error getting webhook info', { error: error.message });
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default new WhatsAppCloudController();
