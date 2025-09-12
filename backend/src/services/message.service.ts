
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

      // Generate unique campaign ID
      const campaignId = `CAMP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create campaign record
      const campaign = await MessageCampaign.create({
        campaignId,
        messageId: message._id,
        targetGroups: payload.targetGroups, // Store group names for reference
        scheduledAt: payload.scheduledAt || new Date(),
        createdBy: userId,
        status: 'processing',
        totalRecipients: 0, // Will be updated after counting MRs
        sentCount: 0,
        failedCount: 0,
      });

      // Get all MRs in target groups (targetGroups contains group names)
      // First, find the group IDs by group names
      const Group = (await import('../models/Group')).default;
      const groups = await Group.find({
        groupName: { $in: payload.targetGroups },
        userId: userId
      });
      
      const groupIds = groups.map(group => group._id);
      
      const medicalReps = await MedicalRepresentative.find({
        groupId: { $in: groupIds }
      }).populate('groupId', 'groupName');

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

      // Update campaign with total recipients count
      await MessageCampaign.findByIdAndUpdate(campaign._id, {
        totalRecipients: medicalReps.length
      });

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

      // Update campaign status to 'pending' after queuing all messages
      await MessageCampaign.findByIdAndUpdate(campaign._id, {
        status: medicalReps.length > 0 ? 'pending' : 'completed'
      });

      return {
        campaignId: (campaign as any)._id.toString(),
        messageId: (message as any)._id.toString(),
        totalRecipients: medicalReps.length,
        status: medicalReps.length > 0 ? 'pending' : 'completed',
        targetGroups: payload.targetGroups
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
      
      // Add user filter if provided
      if (filters.userId) {
        query.createdBy = filters.userId;
      }
      
      if (filters.search) {
        // Search in message content and target groups
        const messageQuery = await Message.find({
          content: { $regex: filters.search, $options: 'i' }
        }).select('_id');
        
        query.$or = [
          { messageId: { $in: messageQuery.map(m => m._id) } },
          { status: { $regex: filters.search, $options: 'i' } },
          { targetGroups: { $in: [new RegExp(filters.search, 'i')] } }
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

      // Transform campaigns to include necessary fields
      const transformedCampaigns = campaigns.map((campaign: any) => ({
        id: campaign._id.toString(),
        campaignId: campaign.campaignId,
        content: (campaign as any).messageId?.content || '',
        imageUrl: (campaign as any).messageId?.imageUrl || '',
        targetGroups: campaign.targetGroups || [],
        status: campaign.status,
        totalRecipients: campaign.totalRecipients || 0,
        sentCount: campaign.sentCount || 0,
        failedCount: campaign.failedCount || 0,
        scheduledAt: campaign.scheduledAt,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt
      }));

      const total = await MessageCampaign.countDocuments(query);

      return {
        data: transformedCampaigns,
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

  async createCampaign(campaignData: any, userId: string) {
    try {
      const MedicalRepresentative = (await import('../models/MedicalRepresentative')).default;
      let mrs: any[] = [];
      let messageContent = '';
      let imageUrl = '';
      let campaignName = '';

      // Handle different campaign types
      if (campaignData.type === 'with-template') {
        // Template-based campaign
        const Template = (await import('../models/Template')).default;
        const RecipientList = (await import('../models/RecipientList')).default;

        const template = await Template.findById(campaignData.templateId);
        if (!template) {
          throw new Error('Template not found');
        }

        const recipientList = await RecipientList.findById(campaignData.recipientListId);
        if (!recipientList) {
          throw new Error('Recipient list not found');
        }

        // Get MRs from recipient list data
        const mrIds = recipientList.data
          .map((row: any) => row['MR id'])
          .filter((id: string) => id && id.trim() !== '');
        
        mrs = await MedicalRepresentative.find({
          mrId: { $in: mrIds }
        }).populate('groupId', 'groupName');

        messageContent = template.content;
        imageUrl = template.imageUrl || '';
        campaignName = campaignData.name;

      } else if (campaignData.type === 'custom-messages') {
        // Custom message campaign
        const mrIds = campaignData.targetMrs.map((mr: any) => mr.mrId);
        
        mrs = await MedicalRepresentative.find({
          mrId: { $in: mrIds }
        }).populate('groupId', 'groupName');

        messageContent = campaignData.content;
        imageUrl = campaignData.imageUrl || '';
        campaignName = campaignData.name;

      } else {
        throw new Error('Invalid campaign type');
      }

      if (mrs.length === 0) {
        throw new Error('No MRs found for campaign');
      }

      // Create message record
      const message = await Message.create({
        content: messageContent,
        imageUrl: imageUrl,
        type: imageUrl ? 'image' : 'text',
        createdBy: userId,
      });

      // Generate unique campaign ID
      const campaignId = `CAMP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create campaign record
      const campaign = await MessageCampaign.create({
        campaignId,
        messageId: message._id,
        targetGroups: campaignData.type === 'with-template' ? 
          (await (await import('../models/RecipientList')).default.findById(campaignData.recipientListId))?.name : 
          'Custom Messages',
        scheduledAt: new Date(),
        createdBy: userId,
        status: 'processing',
        totalRecipients: mrs.length,
        sentCount: 0,
        failedCount: 0,
      });

      // Create message logs for each MR
      const messageLogs = await Promise.all(
        mrs.map((mr: any) =>
          MessageLog.create({
            campaignId: campaign._id,
            mrId: mr._id,
            phoneNumber: mr.phone,
            status: 'queued',
          })
        )
      );

      // Queue messages for processing
      const { addMessageToQueue } = await import('./queue.service');
      
      for (const mr of mrs) {
        await addMessageToQueue({
          campaignId: (campaign as any)._id.toString(),
          mrId: (mr as any)._id.toString(),
          phoneNumber: mr.phone,
          content: messageContent,
          imageUrl: imageUrl,
        });
      }

      // Update campaign status to 'pending' after queuing all messages
      await MessageCampaign.findByIdAndUpdate(campaign._id, {
        status: 'pending'
      });

      logger.info('Campaign created successfully', {
        campaignId: (campaign as any)._id,
        totalRecipients: mrs.length,
        campaignName: campaignName,
        type: campaignData.type
      });

      return {
        campaignId: (campaign as any)._id.toString(),
        messageId: (message as any)._id.toString(),
        totalRecipients: mrs.length,
        status: 'pending',
        campaignName: campaignName,
        type: campaignData.type
      };
    } catch (error) {
      logger.error('Failed to create campaign', { error, campaignData });
      throw error;
    }
  }
}