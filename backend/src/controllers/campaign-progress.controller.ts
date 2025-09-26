import { Request, Response } from 'express';
import Campaign from '../models/Campaign';
import MessageLog from '../models/MessageLog';
import { AuthenticatedRequest } from '../types';

export class CampaignProgressController {
  static async getCampaignProgress(req: Request, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;
      const userId = (req as AuthenticatedRequest).user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const campaign = await Campaign.findOne({
        _id: campaignId,
        createdBy: userId
      })
        .populate('templateId')
        .populate('recipientListId')
        .populate('createdBy', 'name email');

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      // Get message logs for this campaign
      const messageLogs = await MessageLog.find({ campaignId: campaignId });

      // Calculate progress statistics
      const totalMessages = messageLogs.length;
      const sentCount = messageLogs.filter((log: any) => 
        log.status === 'sent' || log.status === 'delivered' || log.status === 'read'
      ).length;
      const failedCount = messageLogs.filter((log: any) => log.status === 'failed').length;
      const pendingCount = totalMessages - sentCount - failedCount;

      res.json({
        success: true,
        data: {
          campaign: {
            id: campaign._id,
            name: campaign.name,
            status: campaign.status,
            createdAt: campaign.createdAt,
            template: campaign.templateId,
            recipientList: campaign.recipientListId,
            createdBy: campaign.createdBy
          },
          progress: {
            total: totalMessages,
            sent: sentCount,
            failed: failedCount,
            pending: pendingCount,
            successRate: totalMessages > 0 ? Math.round((sentCount / totalMessages) * 100) : 0
          },
          messageLogs
        }
      });
    } catch (error) {
      console.error('Error getting campaign progress:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  static async getMessageStatus(req: Request, res: Response): Promise<void> {
    try {
      const { messageId } = req.params;

      const messageLog = await MessageLog.findOne({ messageId });

      if (!messageLog) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          messageId: messageLog.messageId,
          status: messageLog.status,
          timestamp: messageLog.updatedAt,
          error: (messageLog as any).error
        }
      });
    } catch (error) {
      console.error('Error getting message status:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  static async updateMessageStatus(req: Request, res: Response): Promise<void> {
    try {
      const { messageId, status, error } = req.body;

      if (!messageId || !status) {
        res.status(400).json({ error: 'messageId and status are required' });
        return;
      }

      const updatedLog = await MessageLog.findOneAndUpdate(
        { messageId },
        { 
          status,
          error: error || null,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!updatedLog) {
        res.status(404).json({ error: 'Message log not found' });
        return;
      }

      res.json({
        success: true,
        data: {
          messageId: updatedLog.messageId,
          status: updatedLog.status,
          timestamp: updatedLog.updatedAt
        }
      });
    } catch (error) {
      console.error('Error updating message status:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }

  static async getAllCampaignsProgress(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as AuthenticatedRequest).user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const campaigns = await Campaign.find({ createdBy: userId })
        .populate('templateId', 'name type')
        .populate('recipientListId', 'name recipientCount')
        .sort({ createdAt: -1 });

      const campaignsWithProgress = await Promise.all(
        campaigns.map(async (campaign: any) => {
          const messageLogs = await MessageLog.find({ campaignId: campaign._id });
          
          const totalMessages = messageLogs.length;
          const sentCount = messageLogs.filter((log: any) => 
            log.status === 'sent' || log.status === 'delivered' || log.status === 'read'
          ).length;
          const failedCount = messageLogs.filter((log: any) => log.status === 'failed').length;
          const pendingCount = totalMessages - sentCount - failedCount;

          return {
            id: campaign._id,
            name: campaign.name,
            status: campaign.status,
            createdAt: campaign.createdAt,
            template: campaign.templateId,
            recipientList: campaign.recipientListId,
            progress: {
              totalMessages,
              sentCount,
              failedCount,
              pendingCount,
              completionPercentage: totalMessages > 0 ? Math.round((sentCount / totalMessages) * 100) : 0
            }
          };
        })
      );

      res.json({
        success: true,
        data: campaignsWithProgress
      });
    } catch (error) {
      console.error('Error getting all campaigns progress:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      });
    }
  }
}
