
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
        status: 'pending',
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
          messageType: 'text' // Use text messages to send user content
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
      logger.info('🎯 MessageService.createCampaign started', {
        campaignType: campaignData.type,
        userId,
        hasContent: !!campaignData.content,
        hasImageUrl: !!campaignData.imageUrl,
        targetMrsCount: campaignData.targetMrs?.length || 0
      });

      const MedicalRepresentative = (await import('../models/MedicalRepresentative')).default;
      let mrs: any[] = [];
      let messageContent = '';
      let imageUrl = '';
      let campaignName = '';

      // Handle different campaign types
      if (campaignData.type === 'with-template') {
        logger.info('📄 Processing template-based campaign in service');
        // Template-based campaign
        const Template = (await import('../models/Template')).default;
        const RecipientList = (await import('../models/RecipientList')).default;

        logger.info('🔍 Looking up template', { templateId: campaignData.templateId });
        const template = await Template.findById(campaignData.templateId);
        if (!template) {
          logger.error('❌ Template not found', { templateId: campaignData.templateId });
          throw new Error('Template not found');
        }
        logger.info('✅ Template found', { templateId: template._id });

        logger.info('🔍 Looking up recipient list', { recipientListId: campaignData.recipientListId });
        const recipientList = await RecipientList.findById(campaignData.recipientListId);
        if (!recipientList) {
          logger.error('❌ Recipient list not found', { recipientListId: campaignData.recipientListId });
          throw new Error('Recipient list not found');
        }
        logger.info('✅ Recipient list found', { recipientListId: recipientList._id });

        // Get MRs from recipient list data
        const mrIds = recipientList.data
          .map((row: any) => row['MR id'])
          .filter((id: string) => id && id.trim() !== '');
        
        logger.info('🔍 Looking up MRs from recipient list', { mrIdsCount: mrIds.length, mrIds: mrIds.slice(0, 5) });
        mrs = await MedicalRepresentative.find({
          mrId: { $in: mrIds }
        }).populate('groupId', 'groupName');
        logger.info('✅ MRs found from recipient list', { mrsCount: mrs.length });

        messageContent = template.content;
        imageUrl = template.imageUrl || '';
        campaignName = campaignData.name;
        logger.info('✅ Template-based campaign data prepared');

      } else if (campaignData.type === 'custom-messages') {
        logger.info('💬 Processing custom message campaign in service');
        // Custom message campaign
        const mrIds = campaignData.targetMrs.map((mr: any) => mr.mrId);
        
        logger.info('🔍 Looking up MRs for custom campaign', { mrIdsCount: mrIds.length, mrIds: mrIds.slice(0, 5) });
        mrs = await MedicalRepresentative.find({
          _id: { $in: mrIds }
        }).populate('groupId', 'groupName');
        logger.info('✅ MRs found for custom campaign', { mrsCount: mrs.length });

        messageContent = campaignData.content;
        imageUrl = campaignData.imageUrl || '';
        campaignName = campaignData.name;
        logger.info('✅ Custom message campaign data prepared');

      } else {
        logger.error('❌ Invalid campaign type', { type: campaignData.type });
        throw new Error('Invalid campaign type');
      }

      logger.info('🔍 Checking MR count', { mrCount: mrs.length });
      if (mrs.length === 0) {
        logger.error('❌ No MRs found for campaign', { 
          campaignType: campaignData.type,
          targetMrsCount: campaignData.targetMrs?.length || 0,
          mrIds: campaignData.targetMrs?.map((mr: any) => mr.mrId) || []
        });
        throw new Error('No MRs found for campaign');
      }
      logger.info('✅ MR validation passed', { mrCount: mrs.length });

      // Create message record
      logger.info('📝 Creating message record', { 
        hasContent: !!messageContent,
        hasImageUrl: !!imageUrl,
        messageType: imageUrl ? 'image' : 'text'
      });
      const message = await Message.create({
        content: messageContent,
        imageUrl: imageUrl,
        type: imageUrl ? 'image' : 'text',
        createdBy: userId,
      });
      logger.info('✅ Message record created', { messageId: message._id });

      // Generate unique campaign ID
      const campaignId = `CAMP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      logger.info('🆔 Generated campaign ID', { campaignId });

      // Create campaign record
      logger.info('📝 Creating campaign record');
      const campaign = await MessageCampaign.create({
        campaignId,
        messageId: message._id,
        targetGroups: campaignData.type === 'with-template' ? 
          (await (await import('../models/RecipientList')).default.findById(campaignData.recipientListId))?.name : 
          'Custom Messages',
        scheduledAt: new Date(),
        createdBy: userId,
        status: 'pending',
        totalRecipients: mrs.length,
        sentCount: 0,
        failedCount: 0,
      });
      logger.info('✅ Campaign record created', { campaignId: campaign._id });

      // Create message logs for each MR
      logger.info('📝 Creating message logs', { mrCount: mrs.length });
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
      logger.info('✅ Message logs created', { logCount: messageLogs.length });

      // Queue messages for processing
      logger.info('🚀 Starting message queueing process');
      const { addMessageToQueue } = await import('./queue.service');
      
      for (const mr of mrs) {
        logger.info('📤 Adding message to queue', { mrId: mr._id, phone: mr.phone });
        await addMessageToQueue({
          campaignId: (campaign as any)._id.toString(),
          mrId: (mr as any)._id.toString(),
          phoneNumber: mr.phone,
          content: messageContent,
          imageUrl: imageUrl,
          messageType: 'text' // Use text messages to send user content
        });
      }
      logger.info('✅ All messages queued successfully');

      // Update campaign status to 'pending' after queuing all messages
      logger.info('📝 Updating campaign status to pending');
      await MessageCampaign.findByIdAndUpdate(campaign._id, {
        status: 'pending'
      });

      logger.info('🎉 Campaign created successfully', {
        campaignId: (campaign as any)._id,
        totalRecipients: mrs.length,
        campaignName: campaignName,
        type: campaignData.type
      });

      const result = {
        campaignId: (campaign as any)._id.toString(),
        messageId: (message as any)._id.toString(),
        totalRecipients: mrs.length,
        status: 'pending',
        campaignName: campaignName,
        type: campaignData.type
      };

      logger.info('✅ Returning campaign creation result', { result });
      return result;
    } catch (error) {
      logger.error('❌ Failed to create campaign in service', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        campaignData 
      });
      throw error;
    }
  }

  async getPerformanceReport(userId: string, filters: any) {
    try {
      const query: any = { createdBy: userId };
      
      if (filters.startDate && filters.endDate) {
        query.createdAt = {
          $gte: filters.startDate,
          $lte: filters.endDate
        };
      }

      if (filters.groupId) {
        const Group = (await import('../models/Group')).default;
        const group = await Group.findOne({ _id: filters.groupId, createdBy: userId });
        if (group) {
          query.targetGroups = group.groupName;
        }
      }

      const campaigns = await MessageCampaign.find(query)
        .populate('messageId')
        .sort({ createdAt: -1 });

      const totalCampaigns = campaigns.length;
      const totalSent = campaigns.reduce((sum, campaign) => sum + campaign.sentCount, 0);
      const totalFailed = campaigns.reduce((sum, campaign) => sum + campaign.failedCount, 0);
      const totalRecipients = campaigns.reduce((sum, campaign) => sum + campaign.totalRecipients, 0);

      return {
        totalCampaigns,
        totalSent,
        totalFailed,
        totalRecipients,
        successRate: totalRecipients > 0 ? Math.round((totalSent / totalRecipients) * 100 * 100) / 100 : 0,
        campaigns: campaigns.map(campaign => ({
          campaignId: campaign.campaignId,
          status: campaign.status,
          sentCount: campaign.sentCount,
          failedCount: campaign.failedCount,
          totalRecipients: campaign.totalRecipients,
          createdAt: campaign.createdAt
        }))
      };
    } catch (error) {
      logger.error('Failed to get performance report', { userId, filters, error });
      throw error;
    }
  }

  async getCampaignsReport(userId: string, filters: any) {
    try {
      const query: any = { createdBy: userId };
      
      if (filters.startDate && filters.endDate) {
        query.createdAt = {
          $gte: filters.startDate,
          $lte: filters.endDate
        };
      }

      if (filters.status) {
        query.status = filters.status;
      }

      const campaigns = await MessageCampaign.find(query)
        .populate('messageId')
        .sort({ createdAt: -1 });

      return campaigns.map(campaign => ({
        campaignId: campaign.campaignId,
        status: campaign.status,
        sentCount: campaign.sentCount,
        failedCount: campaign.failedCount,
        totalRecipients: campaign.totalRecipients,
        createdAt: campaign.createdAt,
        targetGroups: campaign.targetGroups
      }));
    } catch (error) {
      logger.error('Failed to get campaigns report', { userId, filters, error });
      throw error;
    }
  }

  async getDeliveryReport(userId: string, filters: any) {
    try {
      const query: any = { createdBy: userId };
      
      if (filters.startDate && filters.endDate) {
        query.createdAt = {
          $gte: filters.startDate,
          $lte: filters.endDate
        };
      }

      if (filters.groupId) {
        const Group = (await import('../models/Group')).default;
        const group = await Group.findOne({ _id: filters.groupId, createdBy: userId });
        if (group) {
          query.targetGroups = group.groupName;
        }
      }

      const campaigns = await MessageCampaign.find(query);
      
      const deliveryStats = {
        totalMessages: campaigns.reduce((sum, campaign) => sum + campaign.totalRecipients, 0),
        deliveredMessages: campaigns.reduce((sum, campaign) => sum + campaign.sentCount, 0),
        failedMessages: campaigns.reduce((sum, campaign) => sum + campaign.failedCount, 0),
        deliveryRate: 0
      };

      if (deliveryStats.totalMessages > 0) {
        deliveryStats.deliveryRate = Math.round((deliveryStats.deliveredMessages / deliveryStats.totalMessages) * 100 * 100) / 100;
      }

      return deliveryStats;
    } catch (error) {
      logger.error('Failed to get delivery report', { userId, filters, error });
      throw error;
    }
  }

  async getGroupStats(groupId: string, userId: string) {
    try {
      const Group = (await import('../models/Group')).default;
      const group = await Group.findOne({ _id: groupId, createdBy: userId });
      
      if (!group) {
        return null;
      }

      const campaigns = await MessageCampaign.find({
        createdBy: userId,
        targetGroups: group.groupName
      });

      const totalMessages = campaigns.reduce((sum, campaign) => sum + campaign.totalRecipients, 0);
      const sentMessages = campaigns.reduce((sum, campaign) => sum + campaign.sentCount, 0);
      const failedMessages = campaigns.reduce((sum, campaign) => sum + campaign.failedCount, 0);

      return {
        groupId: group._id,
        groupName: group.groupName,
        totalCampaigns: campaigns.length,
        totalMessages,
        sentMessages,
        failedMessages,
        successRate: totalMessages > 0 ? Math.round((sentMessages / totalMessages) * 100 * 100) / 100 : 0
      };
    } catch (error) {
      logger.error('Failed to get group stats', { groupId, userId, error });
      throw error;
    }
  }

  async getMonthlyReport(userId: string, filters: any) {
    try {
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59);

      const campaigns = await MessageCampaign.find({
        createdBy: userId,
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      });

      const dailyStats: { [key: number]: any } = {};
      for (let day = 1; day <= endDate.getDate(); day++) {
        const dayDate = new Date(filters.year, filters.month - 1, day);
        dailyStats[day] = {
          date: dayDate.toISOString().split('T')[0],
          campaigns: 0,
          messages: 0,
          sent: 0,
          failed: 0
        };
      }

      campaigns.forEach(campaign => {
        const day = campaign.createdAt.getDate();
        if (dailyStats[day]) {
          dailyStats[day].campaigns++;
          dailyStats[day].messages += campaign.totalRecipients;
          dailyStats[day].sent += campaign.sentCount;
          dailyStats[day].failed += campaign.failedCount;
        }
      });

      return {
        year: filters.year,
        month: filters.month,
        totalCampaigns: campaigns.length,
        totalMessages: campaigns.reduce((sum, campaign) => sum + campaign.totalRecipients, 0),
        totalSent: campaigns.reduce((sum, campaign) => sum + campaign.sentCount, 0),
        totalFailed: campaigns.reduce((sum, campaign) => sum + campaign.failedCount, 0),
        dailyStats: Object.values(dailyStats)
      };
    } catch (error) {
      logger.error('Failed to get monthly report', { userId, filters, error });
      throw error;
    }
  }
}