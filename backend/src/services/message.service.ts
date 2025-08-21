
import prisma from '../config/database';
import { MessagePayload, CampaignReport } from '../types';
// Queue service will be imported dynamically to avoid circular dependency
import logger from '../utils/logger';

export class MessageService {
  async sendBulkMessage(payload: MessagePayload, userId: string) {
    try {
      // Create message record
      const message = await prisma.message.create({
        data: {
          content: payload.content,
          imageUrl: payload.imageUrl,
          type: payload.imageUrl ? 'image' : 'text',
          createdBy: userId,
        },
      });

      // Create campaign record
      const campaign = await prisma.messageCampaign.create({
        data: {
          messageId: message.id,
          scheduledAt: payload.scheduledAt || new Date(),
          createdBy: userId,
          status: 'processing',
        },
      });

      // Get all MRs in target groups
      const medicalReps = await prisma.medicalRepresentative.findMany({
        where: {
          groupId: {
            in: payload.targetGroups,
          },
        },
      });

      // Create message logs for each MR
      const messageLogs = await Promise.all(
        medicalReps.map((mr: any) =>
          prisma.messageLog.create({
            data: {
              campaignId: campaign.id,
              mrId: mr.id,
              phoneNumber: mr.phone,
              status: 'queued',
            },
          })
        )
      );

      // Queue messages for processing
      const delay = payload.scheduledAt ? 
        new Date(payload.scheduledAt).getTime() - Date.now() : 0;

      // Import queue service dynamically to avoid circular dependency
      const { addMessageToQueue } = await import('./queue.service');
      
      for (const mr of medicalReps) {
        await addMessageToQueue({
          campaignId: campaign.id,
          mrId: mr.id,
          phoneNumber: mr.phone,
          content: payload.content,
          imageUrl: payload.imageUrl,
        }, delay > 0 ? delay : undefined);
      }

      logger.info('Bulk message campaign created', {
        campaignId: campaign.id,
        totalRecipients: medicalReps.length,
        targetGroups: payload.targetGroups
      });

      return {
        campaignId: campaign.id,
        messageId: message.id,
        totalRecipients: medicalReps.length,
        status: 'queued',
      };
    } catch (error) {
      logger.error('Failed to send bulk message', { error, payload });
      throw error;
    }
  }

  async updateMessageLog(campaignId: string, mrId: string, updates: any) {
    try {
      return await prisma.messageLog.updateMany({
        where: {
          campaignId,
          mrId,
        },
        data: updates,
      });
    } catch (error) {
      logger.error('Failed to update message log', { campaignId, mrId, error });
      throw error;
    }
  }

  async getCampaignReport(campaignId: string): Promise<CampaignReport> {
    try {
      const campaign = await prisma.messageCampaign.findUnique({
        where: { id: campaignId },
        include: {
          message: true,
          messageLogs: {
            include: {
              medicalRepresentative: {
                include: {
                  group: true,
                },
              },
            },
          },
        },
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const stats = {
        total: campaign.messageLogs.length,
        sent: campaign.messageLogs.filter((log: any) => log.status === 'sent').length,
        failed: campaign.messageLogs.filter((log: any) => log.status === 'failed').length,
        pending: campaign.messageLogs.filter((log: any) => 
          log.status === 'pending' || log.status === 'queued'
        ).length,
      };

      return {
        campaign,
        stats,
      };
    } catch (error) {
      logger.error('Failed to get campaign report', { campaignId, error });
      throw error;
    }
  }

  async getAllCampaigns(userId: string, limit = 50, offset = 0) {
    try {
      const campaigns = await prisma.messageCampaign.findMany({
        where: { createdBy: userId },
        include: {
          message: true,
          _count: {
            select: { messageLogs: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return campaigns;
    } catch (error) {
      logger.error('Failed to get campaigns', { userId, error });
      throw error;
    }
  }

  async getCampaignStats(userId: string, dateFrom?: Date, dateTo?: Date) {
    try {
      const whereClause: any = { createdBy: userId };
      
      if (dateFrom || dateTo) {
        whereClause.createdAt = {};
        if (dateFrom) whereClause.createdAt.gte = dateFrom;
        if (dateTo) whereClause.createdAt.lte = dateTo;
      }

      const campaigns = await prisma.messageCampaign.findMany({
        where: whereClause,
        include: {
          messageLogs: true,
        },
      });

      const totalStats = campaigns.reduce((acc: any, campaign: any) => {
        const campaignStats = {
          total: campaign.messageLogs.length,
          sent: campaign.messageLogs.filter((log: any) => log.status === 'sent').length,
          failed: campaign.messageLogs.filter((log: any) => log.status === 'failed').length,
          pending: campaign.messageLogs.filter((log: any) => 
            log.status === 'pending' || log.status === 'queued'
          ).length,
        };

        return {
          total: acc.total + campaignStats.total,
          sent: acc.sent + campaignStats.sent,
          failed: acc.failed + campaignStats.failed,
          pending: acc.pending + campaignStats.pending,
        };
      }, { total: 0, sent: 0, failed: 0, pending: 0 });

      return {
        campaigns: campaigns.length,
        ...totalStats,
        successRate: totalStats.total > 0 ? 
          ((totalStats.sent / totalStats.total) * 100).toFixed(2) : '0',
      };
    } catch (error) {
      logger.error('Failed to get campaign stats', { userId, error });
      throw error;
    }
  }
}