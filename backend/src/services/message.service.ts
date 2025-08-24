
import Message from '../models/Message';
import MessageCampaign from '../models/MessageCampaign';
import MessageLog from '../models/MessageLog';
import MedicalRepresentative from '../models/MedicalRepresentative';
import { MessagePayload, CampaignReport } from '../types/mongodb';
// Queue service will be imported dynamically to avoid circular dependency
import logger from '../utils/logger';

export class MessageService {
  async sendBulkMessage(payload: MessagePayload, userId: string) {
    try {
      // Create message record
      const message = await Message.create({
        content: payload.content,
        imageUrl: payload.imageUrl,
        type: payload.imageUrl ? 'image' : 'text',
        createdBy: userId,
      });

      // Create campaign record
      const campaign = await MessageCampaign.create({
        messageId: message._id,
        scheduledAt: payload.scheduledAt || new Date(),
        createdBy: userId,
        status: 'processing',
      });

      // Get all MRs in target groups
      const medicalReps = await MedicalRepresentative.find({
        groupId: { $in: payload.targetGroups }
      });

      // Create message logs for each MR
      const messageLogs = await Promise.all(
        medicalReps.map((mr: any) =>
          MessageLog.create({
            campaignId: campaign._id,
            mrId: mr._id,
            phoneNumber: mr.phone,
            status: 'queued',
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
          campaignId: (campaign as any)._id.toString(),
          mrId: (mr as any)._id.toString(),
          phoneNumber: mr.phone,
          content: payload.content,
          imageUrl: payload.imageUrl,
        }, delay > 0 ? delay : undefined);
      }

      logger.info('Bulk message campaign created', {
        campaignId: (campaign as any)._id,
        totalRecipients: medicalReps.length,
        targetGroups: payload.targetGroups
      });

      return {
        campaignId: (campaign as any)._id.toString(),
        messageId: (message as any)._id.toString(),
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
      return await MessageLog.updateMany(
        { campaignId, mrId },
        updates
      );
    } catch (error) {
      logger.error('Failed to update message log', { campaignId, mrId, error });
      throw error;
    }
  }

  async getCampaignStats(userId: string) {
    try {
      const campaigns = await MessageCampaign.countDocuments({ createdBy: userId });
      const totalMessages = await MessageLog.countDocuments();
      const sentMessages = await MessageLog.countDocuments({ status: 'sent' });
      const successRate = totalMessages > 0 ? ((sentMessages / totalMessages) * 100).toFixed(1) : '0.0';

      return {
        campaigns,
        total: totalMessages,
        sent: sentMessages,
        successRate,
      };
    } catch (error) {
      logger.error('Failed to get campaign stats', { userId, error });
      throw error;
    }
  }

  async getCampaignReport(campaignId: string) {
    try {
      const campaign = await MessageCampaign.findById(campaignId)
        .populate('messageId')
        .populate('createdBy', 'name email');

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const messageLogs = await MessageLog.find({ campaignId })
        .populate('mrId')
        .populate({
          path: 'mrId',
          populate: {
            path: 'groupId',
            select: 'groupName'
          }
        });

      const stats = {
        total: messageLogs.length,
        sent: messageLogs.filter(log => log.status === 'sent').length,
        failed: messageLogs.filter(log => log.status === 'failed').length,
        pending: messageLogs.filter(log => log.status === 'pending').length,
      };

      return {
        campaign,
        stats,
        messageLogs,
      };
    } catch (error) {
      logger.error('Failed to get campaign report', { campaignId, error });
      throw error;
    }
  }

  async getAllCampaigns(filters: any = {}) {
    try {
      const query: any = {};
      
      if (filters.search) {
        query.$or = [
          { 'message.content': { $regex: filters.search, $options: 'i' } },
          { status: { $regex: filters.search, $options: 'i' } }
        ];
      }

      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.dateFrom || filters.dateTo) {
        query.createdAt = {};
        if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
        if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
      }

      const campaigns = await MessageCampaign.find(query)
        .populate('messageId')
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .limit(filters.limit || 50)
        .skip(filters.offset || 0);

      const total = await MessageCampaign.countDocuments(query);

      return {
        data: campaigns,
        pagination: {
          page: Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1,
          limit: filters.limit || 50,
          total,
          totalPages: Math.ceil(total / (filters.limit || 50)),
          hasMore: (filters.offset || 0) + campaigns.length < total
        }
      };
    } catch (error) {
      logger.error('Failed to get campaigns', { filters, error });
      throw error;
    }
  }

  async uploadImage(file: Express.Multer.File) {
    try {
      // In a real implementation, you would upload to cloud storage
      // For now, we'll return a mock URL
      const imageUrl = `/uploads/${file.filename}`;
      
      logger.info('Image uploaded successfully', { filename: file.filename });
      
      return { imageUrl };
    } catch (error) {
      logger.error('Failed to upload image', { error });
      throw error;
    }
  }
}