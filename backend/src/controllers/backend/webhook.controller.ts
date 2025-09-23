import { Request, Response } from 'express';
import MessageLog from '../../models/MessageLog';
import Campaign from '../../models/Campaign';
import logger from '../../utils/logger';

export class WebhookController {
  /**
   * Handle WhatsApp Cloud API webhook events
   */
  static async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { entry } = req.body;

      if (!entry || !Array.isArray(entry)) {
        res.status(400).json({
          success: false,
          message: 'Invalid webhook payload'
        });
        return;
      }

      for (const webhookEntry of entry) {
        const { changes } = webhookEntry;
        
        if (!changes || !Array.isArray(changes)) {
          continue;
        }

        for (const change of changes) {
          if (change.field === 'messages') {
            await this.processMessageStatus(change.value);
          }
        }
      }

      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Webhook processing error:', error);
      res.status(500).json({
        success: false,
        message: 'Webhook processing failed'
      });
    }
  }

  /**
   * Process message status updates from webhook
   */
  private static async processMessageStatus(value: any) {
    try {
      const { statuses } = value;

      if (!statuses || !Array.isArray(statuses)) {
        return;
      }

      for (const status of statuses) {
        const { id: messageId, status: messageStatus, timestamp, recipient_id } = status;

        if (!messageId || !messageStatus) {
          continue;
        }

        // Update message log with new status
        const updateData: any = {
          status: messageStatus.toLowerCase(),
          lastUpdated: new Date(),
          updatedAt: new Date()
        };

        if (timestamp) {
          const statusTime = new Date(parseInt(timestamp) * 1000);
          
          // Set appropriate timestamp based on status
          if (messageStatus.toLowerCase() === 'sent') {
            updateData.sentAt = statusTime;
          } else if (messageStatus.toLowerCase() === 'delivered') {
            updateData.deliveredAt = statusTime;
            // Keep sentAt if not already set
            if (!updateData.sentAt) {
              updateData.sentAt = statusTime;
            }
          } else if (messageStatus.toLowerCase() === 'read') {
            updateData.deliveredAt = statusTime;
            updateData.sentAt = statusTime;
          } else if (messageStatus.toLowerCase() === 'failed') {
            updateData.errorMessage = 'Message failed to deliver';
          }
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
            timestamp: timestamp ? new Date(parseInt(timestamp) * 1000) : null
          });

      // Update campaign status if all messages are processed
      if (updatedLog.campaignId) {
        const { CampaignController } = await import('./campaign.controller');
        await CampaignController.checkAndUpdateCampaignCompletion(updatedLog.campaignId.toString());
      }
        } else {
          logger.warn('Message log not found for webhook update', { messageId });
        }
      }
    } catch (error) {
      logger.error('Error processing message status:', error);
    }
  }

  /**
   * Verify webhook (for WhatsApp Cloud API verification)
   */
  static async verifyWebhook(req: Request, res: Response) {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

      if (mode === 'subscribe' && token === verifyToken) {
        logger.info('Webhook verified successfully');
        res.status(200).send(challenge);
      } else {
        logger.warn('Webhook verification failed', { mode, token, verifyToken });
        res.status(403).json({ error: 'Forbidden' });
      }
    } catch (error) {
      logger.error('Webhook verification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
