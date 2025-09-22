import { Request, Response } from 'express';
import Campaign from '../models/Campaign';
import MessageLog from '../models/MessageLog';
import MedicalRep from '../models/MedicalRep';
import Template from '../models/Template';
import TemplateRecipients from '../models/TemplateRecipients';
import { whatsappCloudAPIService } from '../services/whatsapp-cloud-api.service';
import logger from '../utils/logger';

export class CampaignProgressController {
  /**
   * Get campaign progress with real-time status
   */
  static async getCampaignProgress(req: Request, res: Response) {
    try {
      const { campaignId } = req.params;
      const userId = req.user.userId;

      // Find the campaign
      const campaign = await Campaign.findOne({
        campaignId,
        createdBy: userId,
        isActive: true
      }).populate('templateId').populate('recipientListId');

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      // Get all message logs for this campaign
      const messageLogs = await MessageLog.find({ campaignId: campaign._id })
        .populate('mrId', 'mrId firstName lastName phone groupId')
        .sort({ createdAt: -1 });

      // Template information is already populated
      const template = campaign.templateId;

      // Calculate progress statistics
      // Get total recipients from the actual recipient list, not from message logs
      const recipientList = await TemplateRecipients.findById(campaign.recipientListId);
      const totalRecipients = recipientList ? recipientList.recipients.length : 0;
      
      // Get unique recipients from message logs to avoid duplicates
      const uniqueRecipients = new Map();
      messageLogs.forEach(log => {
        const key = log.phoneNumber; // Use phone number as unique key
        if (!uniqueRecipients.has(key) || log.createdAt > uniqueRecipients.get(key).createdAt) {
          uniqueRecipients.set(key, log);
        }
      });
      
      const uniqueMessageLogs = Array.from(uniqueRecipients.values());
      const sentCount = uniqueMessageLogs.filter(log => log.status === 'sent').length;
      const failedCount = uniqueMessageLogs.filter(log => log.status === 'failed').length;
      const pendingCount = uniqueMessageLogs.filter(log => log.status === 'pending' || log.status === 'queued').length;

      // Get detailed recipient status from unique message logs
      const recipients = uniqueMessageLogs.map(log => ({
        id: log._id,
        mrId: (log.mrId as any)?.mrId || 'Unknown',
        firstName: (log.mrId as any)?.firstName || 'Unknown',
        lastName: (log.mrId as any)?.lastName || 'Unknown',
        phone: log.phoneNumber,
        group: (log.mrId as any)?.groupId || 'Unknown',
        status: log.status,
        sentAt: log.sentAt,
        errorMessage: log.errorMessage,
        messageId: log.messageId
      }));

      // Calculate success rate
      const successRate = totalRecipients > 0 ? (sentCount / totalRecipients) * 100 : 0;

      res.json({
        success: true,
        data: {
          campaign: {
            id: campaign._id,
            campaignId: campaign.campaignId,
            name: campaign.name,
            description: campaign.description,
            status: campaign.status,
            createdAt: campaign.createdAt,
            scheduledAt: campaign.scheduledAt,
            startedAt: campaign.startedAt,
            completedAt: campaign.completedAt,
            totalRecipients
          },
          template: template ? {
            id: template._id,
            name: template.name,
            metaTemplateName: template.metaTemplateName,
            metaStatus: template.metaStatus,
            isMetaTemplate: template.isMetaTemplate,
            type: template.type,
            metaLanguage: template.metaLanguage
          } : null,
          recipientList: campaign.recipientListId ? {
            id: campaign.recipientListId._id,
            name: campaign.recipientListId.name,
            description: campaign.recipientListId.description,
            recipientCount: campaign.recipientListId.recipients.length
          } : null,
          progress: {
            total: totalRecipients,
            sent: sentCount,
            failed: failedCount,
            pending: pendingCount,
            successRate: Math.round(successRate * 100) / 100
          },
          recipients,
          lastUpdated: new Date()
        }
      });

    } catch (error) {
      logger.error('Error getting campaign progress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get campaign progress',
        error: error.message
      });
    }
  }

  /**
   * Get real-time message status from WhatsApp Cloud API
   */
  static async getMessageStatus(req: Request, res: Response) {
    try {
      const { messageId } = req.params;

      if (!messageId) {
        return res.status(400).json({
          success: false,
          message: 'Message ID is required'
        });
      }

      // Get message status from WhatsApp Cloud API
      const status = await whatsappCloudAPIService.getMessageStatus(messageId);

      res.json({
        success: true,
        data: status
      });

    } catch (error) {
      logger.error('Error getting message status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get message status',
        error: error.message
      });
    }
  }

  /**
   * Update message status from webhook
   */
  static async updateMessageStatus(req: Request, res: Response) {
    try {
      const { messageId, status, timestamp, recipient_id } = req.body;

      if (!messageId || !status) {
        return res.status(400).json({
          success: false,
          message: 'Message ID and status are required'
        });
      }

      // Update message log with new status
      const updateData: any = {
        status: status.toLowerCase(),
        lastUpdated: new Date()
      };

      if (timestamp) {
        updateData.sentAt = new Date(timestamp);
      }

      const updatedLog = await MessageLog.findOneAndUpdate(
        { messageId },
        updateData,
        { new: true }
      ).populate('mrId', 'mrId firstName lastName phone groupId');

      if (!updatedLog) {
        return res.status(404).json({
          success: false,
          message: 'Message log not found'
        });
      }

      // Update campaign status if all messages are processed
      const campaign = await MessageCampaign.findById(updatedLog.campaignId);
      if (campaign) {
        const allLogs = await MessageLog.find({ campaignId: campaign._id });
        const allProcessed = allLogs.every(log => 
          log.status === 'sent' || log.status === 'failed'
        );

        if (allProcessed) {
          campaign.status = 'completed';
          await campaign.save();
        }
      }

      res.json({
        success: true,
        data: {
          messageId: updatedLog.messageId,
          status: updatedLog.status,
          sentAt: updatedLog.sentAt,
          recipient: {
            mrId: (updatedLog.mrId as any)?.mrId,
            firstName: (updatedLog.mrId as any)?.firstName,
            lastName: (updatedLog.mrId as any)?.lastName,
            phone: updatedLog.phoneNumber
          }
        }
      });

    } catch (error) {
      logger.error('Error updating message status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update message status',
        error: error.message
      });
    }
  }

  /**
   * Get all campaigns with progress summary
   */
  static async getAllCampaignsProgress(req: Request, res: Response) {
    try {
      const userId = req.user.userId;
      const { page = 1, limit = 10, status } = req.query;

      const query: any = { createdBy: userId };
      if (status) {
        query.status = status;
      }

      const campaigns = await Campaign.find(query)
        .populate('templateId', 'name metaTemplateName metaStatus isMetaTemplate type')
        .populate('recipientListId', 'name description recipients')
        .sort({ createdAt: -1 })
        .limit(Number(limit) * 1)
        .skip((Number(page) - 1) * Number(limit));

      const total = await Campaign.countDocuments(query);

      // Get progress for each campaign
      const campaignsWithProgress = await Promise.all(
        campaigns.map(async (campaign) => {
          // Get total recipients from the actual recipient list
          const recipientList = await TemplateRecipients.findById(campaign.recipientListId);
          const totalRecipients = recipientList ? recipientList.recipients.length : 0;
          
          // Get unique message logs to avoid duplicates
          const messageLogs = await MessageLog.find({ campaignId: campaign._id });
          const uniqueRecipients = new Map();
          messageLogs.forEach(log => {
            const key = log.phoneNumber;
            if (!uniqueRecipients.has(key) || log.createdAt > uniqueRecipients.get(key).createdAt) {
              uniqueRecipients.set(key, log);
            }
          });
          
          const uniqueMessageLogs = Array.from(uniqueRecipients.values());
          const sentCount = uniqueMessageLogs.filter(log => log.status === 'sent').length;
          const failedCount = uniqueMessageLogs.filter(log => log.status === 'failed').length;
          const pendingCount = uniqueMessageLogs.filter(log => log.status === 'pending' || log.status === 'queued').length;
          const successRate = totalRecipients > 0 ? (sentCount / totalRecipients) * 100 : 0;

          return {
            id: campaign._id,
            campaignId: campaign.campaignId,
            name: campaign.name,
            description: campaign.description,
            status: campaign.status,
            createdAt: campaign.createdAt,
            scheduledAt: campaign.scheduledAt,
            startedAt: campaign.startedAt,
            completedAt: campaign.completedAt,
            template: {
              id: campaign.templateId._id,
              name: campaign.templateId.name,
              metaTemplateName: campaign.templateId.metaTemplateName,
              metaStatus: campaign.templateId.metaStatus,
              isMetaTemplate: campaign.templateId.isMetaTemplate,
              type: campaign.templateId.type
            },
            recipientList: {
              id: campaign.recipientListId._id,
              name: campaign.recipientListId.name,
              description: campaign.recipientListId.description,
              recipientCount: campaign.recipientListId.recipients.length
            },
            progress: {
              total: totalRecipients,
              sent: sentCount,
              failed: failedCount,
              pending: pendingCount,
              successRate: Math.round(successRate * 100) / 100
            }
          };
        })
      );

      res.json({
        success: true,
        data: {
          campaigns: campaignsWithProgress,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            totalPages: Math.ceil(total / Number(limit))
          }
        }
      });

    } catch (error) {
      logger.error('Error getting all campaigns progress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get campaigns progress',
        error: error.message
      });
    }
  }
}
