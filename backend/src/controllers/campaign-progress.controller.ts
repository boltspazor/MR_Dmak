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

      // Support both Mongo _id and campaignId string
      const query: any = { createdBy: userId };
      if (campaignId && campaignId.match(/^[0-9a-fA-F]{24}$/)) {
        query.$or = [{ _id: campaignId }, { campaignId }];
      } else {
        query.campaignId = campaignId;
      }

      const campaign = await Campaign.findOne(query)
        .populate('templateId')
        .populate('createdBy', 'name email');

      if (!campaign) {
        res.status(404).json({ error: 'Campaign not found' });
        return;
      }

      // Prefer campaign.recipients for per-recipient statuses, fallback to MessageLog
      let recipients: any[] = (campaign as any).recipients || [];
      let totalMessages = recipients.length;
      let sentCount = 0; // delivered/read
      let failedCount = 0;
      let pendingCount = 0; // queued/pending/sent

      if (recipients.length > 0) {
        for (const r of recipients) {
          const s = (r.status || '').toLowerCase();
          if (s === 'delivered' || s === 'read') sentCount++;
          else if (s === 'failed') failedCount++;
          else pendingCount++;
        }
      } else {
        const messageLogs = await MessageLog.find({ campaignId: campaign._id });
        totalMessages = messageLogs.length;
        messageLogs.forEach((log: any) => {
          const s = (log.status || '').toLowerCase();
          if (s === 'delivered' || s === 'read') sentCount++;
          else if (s === 'failed') failedCount++;
          else pendingCount++;
        });
        // Build recipients array from logs for output consistency
        recipients = messageLogs.map((log: any) => ({
          mrId: (log.mrId as any) || undefined,
          firstName: (log as any).firstName,
          lastName: (log as any).lastName,
          phone: log.phoneNumber,
          status: log.status,
          sentAt: log.sentAt,
          deliveredAt: log.deliveredAt,
          readAt: log.readAt,
          failedAt: log.failedAt,
          errorMessage: log.errorMessage,
          messageId: log.messageId
        }));
      }

      // Derive API-facing status without mutating DB
      let updatedStatus = campaign.status;
      if (totalMessages > 0) {
        if (sentCount === totalMessages) updatedStatus = 'completed';
        else if (pendingCount > 0) updatedStatus = 'sending';
        else if (sentCount === 0 && failedCount > 0) updatedStatus = 'failed';
      }

      res.json({
        success: true,
        data: {
          campaign: {
            id: campaign._id,
            name: campaign.name,
            status: updatedStatus,
            createdAt: campaign.createdAt,
            template: campaign.templateId,
            createdBy: campaign.createdBy
          },
          progress: {
            total: totalMessages,
            sent: sentCount, // delivered + read
            failed: failedCount,
            pending: pendingCount,
            successRate: totalMessages > 0 ? Math.round((sentCount / totalMessages) * 100) : 0
          },
          recipients: recipients.map(r => ({
            mrId: r.mrId,
            firstName: r.firstName,
            lastName: r.lastName,
            phone: r.phone,
            status: r.status,
            sentAt: r.sentAt,
            deliveredAt: r.deliveredAt,
            readAt: r.readAt,
            failedAt: r.failedAt,
            errorMessage: r.errorMessage,
            messageId: r.messageId
          }))
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

  /**
   * Get detailed message list by status for a campaign
   */
  static async getCampaignMessageDetails(req: Request, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;
      const { status, limit = 100, page = 1 } = req.query;
      const userId = (req as AuthenticatedRequest).user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      // Get campaign to verify ownership
      const campaign = await Campaign.findOne({
        campaignId: campaignId,
        createdBy: userId
      });

      if (!campaign) {
        res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
        return;
      }

      // Build query for MessageLog
      const query: any = { campaignId: campaign._id };
      
      if (status && status !== 'all') {
        query.status = status;
      }

      // Calculate pagination
      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const limitNum = parseInt(limit as string);

      // Get message logs with pagination
      const messageLogs = await MessageLog.find(query)
        .populate('campaignId', 'campaignId name status')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum);

      // Get total count for pagination
      const totalCount = await MessageLog.countDocuments(query);

      // Format data for display
      const messageDetails = messageLogs.map(log => ({
        id: log._id,
        mrId: log.mrId,
        phoneNumber: log.phoneNumber,
        status: log.status,
        sentAt: log.sentAt,
        deliveredAt: log.deliveredAt,
        readAt: log.readAt,
        failedAt: log.failedAt,
        errorMessage: log.errorMessage,
        errorCode: log.errorCode,
        errorTitle: log.errorTitle,
        messageId: log.messageId,
        templateName: log.templateName,
        templateLanguage: log.templateLanguage,
        conversationId: log.conversationId,
        pricingCategory: log.pricingCategory,
        lastUpdated: log.updatedAt
      }));

      // Get status counts
      const statusCounts = await MessageLog.aggregate([
        { $match: { campaignId: campaign._id } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      const counts = statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as Record<string, number>);

      res.json({
        success: true,
        data: {
          campaign: {
            id: campaign._id,
            campaignId: campaign.campaignId,
            name: campaign.name,
            status: campaign.status
          },
          messages: messageDetails,
          pagination: {
            page: parseInt(page as string),
            limit: limitNum,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limitNum)
          },
          statusCounts: {
            total: totalCount,
            sent: counts.sent || 0,
            delivered: counts.delivered || 0,
            read: counts.read || 0,
            failed: counts.failed || 0,
            pending: counts.pending || 0,
            queued: counts.queued || 0
          }
        }
      });

    } catch (error: any) {
      console.error('Error getting campaign message details:', {
        error: error.message,
        campaignId: req.params.campaignId,
        userId: (req as AuthenticatedRequest).user?.userId
      });
      res.status(500).json({
        success: false,
        error: 'Failed to get campaign message details'
      });
    }
  }
}
