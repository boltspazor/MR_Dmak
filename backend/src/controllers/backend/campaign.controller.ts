import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import Campaign from '../../models/Campaign';
import Template from '../../models/Template';
import TemplateRecipients from '../../models/TemplateRecipients';
import MessageLog from '../../models/MessageLog';
import MedicalRep from '../../models/MedicalRepresentative';
import logger from '../../utils/logger';
import whatsappCloudAPIService from '../../services/whatsapp-cloud-api.service';

export class CampaignController {
  /**
   * Create a campaign with direct MR selection (for templates without parameters)
   */
  static async createCampaignWithMRs(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { name, description, templateId, mrIds, scheduledAt } = req.body;
      const userId = req.user?.userId;

      // Validate template exists and is active
      const template = await Template.findById(templateId);
      if (!template || !template.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Template not found or inactive'
        });
      }

      // Validate MRs exist (include MRs with isActive: true or undefined)
      const mrs = await MedicalRep.find({ 
        _id: { $in: mrIds }, 
        $or: [{ isActive: true }, { isActive: { $exists: false } }]
      });
      
      if (mrs.length !== mrIds.length) {
        return res.status(404).json({
          success: false,
          message: 'Some medical representatives not found or inactive'
        });
      }

      // Generate unique campaign ID
      const campaignId = `CAMP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create campaign without recipient list but with direct MRs
      const campaign = await Campaign.create({
        campaignId,
        name,
        description,
        templateId,
        recipientListId: null, // No recipient list for direct MR campaigns
        mrIds: mrIds, // Store the MR IDs for direct campaigns
        createdBy: userId,
        totalRecipients: mrs.length,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined
      });

      logger.info('Campaign created successfully with direct MRs', { 
        campaignId: campaign.campaignId, 
        name: campaign.name,
        templateId: campaign.templateId,
        mrCount: mrs.length
      });

      return res.status(201).json({
        success: true,
        message: 'Campaign created successfully',
        data: campaign
      });

    } catch (error) {
      logger.error('Error creating campaign with MRs:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create campaign',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create a new campaign
   */
  static async createCampaign(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { name, description, templateId, recipientListId, scheduledAt } = req.body;
      const userId = req.user?.userId;
      const template = await Template.findById(templateId);
      logger.info('Template found', { template });
      if (!template || !template.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Template not found or inactive'
        });
      }

      const recipientList = await TemplateRecipients.findById(recipientListId);
      logger.info('Recipient list found', { recipientList });
      if (!recipientList || !recipientList.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Recipient list not found or inactive'
        });
      }

      // Verify the recipient list belongs to the template
      if (recipientList.templateId.toString() !== templateId) {
        return res.status(400).json({
          success: false,
          message: 'Recipient list does not belong to the specified template'
        });
      }

      // Generate unique campaign ID
      const campaignId = `CAMP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create campaign
      const campaign = await Campaign.create({
        campaignId,
        name,
        description,
        templateId,
        recipientListId,
        createdBy: userId,
        totalRecipients: recipientList.recipients.length,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined
      });

      logger.info('Campaign created successfully', { 
        campaignId: campaign.campaignId, 
        name: campaign.name,
        templateId: campaign.templateId,
        recipientListId: campaign.recipientListId
      });

      return res.status(201).json({
        success: true,
        message: 'Campaign created successfully',
        data: campaign
      });

    } catch (error) {
      logger.error('Error creating campaign:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create campaign',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get all campaigns with template and recipient list details
   */
  static async getCampaigns(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const { page = 1, limit = 10, status, search } = req.query;

      // Build query
      const query: any = { createdBy: userId, isActive: true };
      
      if (status) {
        query.status = status;
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { campaignId: { $regex: search, $options: 'i' } }
        ];
      }

      // Get campaigns with populated data
      const campaigns = await Campaign.find(query)
        .populate('templateId', 'name metaTemplateName metaStatus isMetaTemplate type imageUrl')
        .populate('recipientListId', 'name description recipients')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(Number(limit) * 1)
        .skip((Number(page) - 1) * Number(limit));

      const total = await Campaign.countDocuments(query);

      // Calculate progress for each campaign
      const campaignsWithProgress = await Promise.all(
        campaigns.map(async (campaign) => {
          // Prefer recipients stored on campaign
          const recipients = (campaign as any).recipients && (campaign as any).recipients.length > 0
            ? (campaign as any).recipients
            : [];

          let total = recipients.length || campaign.totalRecipients || 0;
          let receivedCount = 0; // delivered or read
          let failedCount = 0;
          let pendingCount = 0; // pending/queued/sent

          if (recipients.length > 0) {
            for (const r of recipients as any[]) {
              const status = (r.status || '').toLowerCase();
              if (status === 'delivered' || status === 'read') receivedCount++;
              else if (status === 'failed') failedCount++;
              else pendingCount++;
            }
          } else {
            // Fallback to MessageLog when recipients not yet seeded
            const messageLogs = await MessageLog.find({ campaignId: campaign._id });
            total = messageLogs.length || total;
            messageLogs.forEach(log => {
              const s = (log.status || '').toLowerCase();
              if (s === 'delivered' || s === 'read') receivedCount++;
              else if (s === 'failed') failedCount++;
              else pendingCount++;
            });
          }

          const successRate = total > 0 ? Math.round((receivedCount / total) * 100) : 0;

          // Compute API-facing status strictly from recipient outcomes:
          // - completed: ONLY if all recipients are delivered/read
          // - sending: if any are still pending/queued/sent
          // - failed: if none delivered/read and at least one failed (edge)
          // - otherwise fall back to stored status
          let apiStatus = campaign.status;
          if (total > 0) {
            if (receivedCount === total) {
              apiStatus = 'completed';
            } else if (pendingCount > 0) {
              apiStatus = 'sending';
            } else if (receivedCount === 0 && failedCount > 0) {
              apiStatus = 'failed';
            }
          }

          return {
            id: campaign._id,
            campaignId: campaign.campaignId,
            name: campaign.name,
            description: campaign.description,
            status: apiStatus,
            createdAt: campaign.createdAt,
            scheduledAt: campaign.scheduledAt,
            startedAt: campaign.startedAt,
            completedAt: campaign.completedAt,
            template: campaign.templateId ? {
              id: campaign.templateId._id,
              name: (campaign.templateId as any).name,
              metaTemplateName: (campaign.templateId as any).metaTemplateName,
              metaStatus: (campaign.templateId as any).metaStatus,
              isMetaTemplate: (campaign.templateId as any).isMetaTemplate,
              type: (campaign.templateId as any).type
            } : null,
            // recipientList removed as requested
            progress: {
              total,
              sent: receivedCount, // treat delivered/read as successful sends
              failed: failedCount,
              pending: pendingCount,
              successRate
            },
            createdBy: campaign.createdBy ? {
              id: campaign.createdBy._id,
              name: (campaign.createdBy as any).name,
              email: (campaign.createdBy as any).email
            } : null
          };
        })
      );

      return res.json({
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
      logger.error('Error getting campaigns:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get campaigns',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get campaign by ID with full details
   */
  static async getCampaignById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { campaignId } = req.params;
      const userId = req.user?.userId;

      // Try to find by MongoDB _id first, then by custom campaignId
      const campaign = await Campaign.findOne({ 
        $or: [
          { _id: campaignId, createdBy: userId, isActive: true },
        ]
      })
        .populate('templateId')
        .populate('recipientListId')
        .populate('createdBy', 'name email');

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      // Prefer recipients stored on campaign; fallback to recipient list if missing
      let campaignRecipients = (campaign as any).recipients && (campaign as any).recipients.length > 0
        ? (campaign as any).recipients
        : (campaign.recipientListId ? ((campaign.recipientListId as any).recipients || []) : []);
      
      // Get message logs for this campaign to find status
      const messageLogs = await MessageLog.find({ campaignId: campaign._id });

      // Create a map of mrId to message log for quick lookup
      const messageLogMap = new Map();
      messageLogs.forEach(log => {
        const mrId = log.mrId;
        if (!messageLogMap.has(mrId) || log.createdAt > messageLogMap.get(mrId).createdAt) {
          messageLogMap.set(mrId, log);
        }
      });

      // Fetch real-time status for each campaign recipient
      const recipientsWithRealTimeStatus = await Promise.all(
        campaignRecipients.map(async (recipient: any) => {
          const messageLog = messageLogMap.get(recipient.mrId);
          let realTimeStatus = 'pending'; // Default status
          let realTimeTimestamp = null;
          let errorMessage = null;
          let messageId = null;
          
          // If we have a message log for this recipient, use webhook-updated status
          if (messageLog) {
            // Always prioritize webhook-updated status (most reliable)
            realTimeStatus = messageLog.status;
            realTimeTimestamp = messageLog.sentAt || messageLog.deliveredAt;
            errorMessage = messageLog.errorMessage;
            messageId = messageLog.messageId;
            
            logger.info('Using webhook status for recipient', {
              mrId: recipient.mrId,
              status: realTimeStatus,
              messageId: messageLog.messageId,
              lastUpdated: messageLog.lastUpdated || messageLog.updatedAt
            });
          } else {
            // No message log found, default to pending
            realTimeStatus = 'pending';
            logger.info('No message log found for recipient, defaulting to pending', {
              mrId: recipient.mrId
            });
          }

          return  {
            id: recipient._id || recipient.mrId,
            mrId: recipient.mrId,
            firstName: recipient.firstName,
            lastName: recipient.lastName,
            phone: recipient.phone,
            group: recipient.groupId || 'Default Group',
            status: (recipient.status || realTimeStatus),
            sentAt: recipient.sentAt || realTimeTimestamp,
            errorMessage: recipient.errorMessage || errorMessage,
            errorCode: messageLog?.errorCode,
            errorTitle: messageLog?.errorTitle,
            errorDetails: messageLog?.errorDetails,
            messageId: recipient.messageId || messageId,
            templateParameters: recipient.parameters || {}
          };
        })
      );

      // Calculate progress based on real-time status
      const sentCount = recipientsWithRealTimeStatus.filter((r: any) => r.status === 'sent' || r.status === 'delivered' || r.status === 'read').length;
      const failedCount = recipientsWithRealTimeStatus.filter((r: any) => r.status === 'failed').length;
      const pendingCount = recipientsWithRealTimeStatus.filter((r: any) => 
        r.status === 'pending' || r.status === 'queued'
      ).length;

      const successRate = campaign.totalRecipients > 0 
        ? Math.round((sentCount / campaign.totalRecipients) * 100) 
        : 0;

      return res.json({
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
            completedAt: campaign.completedAt
          },
          template: campaign.templateId ? {
            id: campaign.templateId._id,
            name: (campaign.templateId as any).name,
            metaTemplateName: (campaign.templateId as any).metaTemplateName,
            metaStatus: (campaign.templateId as any).metaStatus,
            isMetaTemplate: (campaign.templateId as any).isMetaTemplate,
            type: (campaign.templateId as any).type,
            metaLanguage: (campaign.templateId as any).metaLanguage
          } : null,
          progress: {
            total: campaign.totalRecipients,
            sent: sentCount,
            failed: failedCount,
            pending: pendingCount,
            successRate
          },
          recipients: recipientsWithRealTimeStatus,
          lastUpdated: new Date()
        }
      });

    } catch (error) {
      logger.error('Error getting campaign by ID:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get campaign',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update campaign status
   */
  static async updateCampaignStatus(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { campaignId } = req.params;
      const { status } = req.body;
      const userId = req.user?.userId;

      const validStatuses = ['draft', 'pending', 'sending', 'completed', 'failed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      // Find the campaign first to get full details
      const campaign = await Campaign.findOne({ 
        campaignId, 
        createdBy: userId, 
        isActive: true 
      })
      .populate('templateId', 'name metaTemplateName metaLanguage metaStatus isMetaTemplate imageUrl')
      .populate('recipientListId', 'name recipients')
      .populate('mrIds', 'mrId firstName lastName phone');

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      const updateData: any = { status };
      
      if (status === 'sending') {
        // Check if campaign is already in sending state
        if (campaign.status === 'sending') {
          return res.status(400).json({
            success: false,
            message: 'Campaign is already being sent'
          });
        }

        // Check if campaign is already completed
        if (campaign.status === 'completed') {
          return res.status(400).json({
            success: false,
            message: 'Campaign has already been completed'
          });
        }

        updateData.startedAt = new Date();
        
        // Validate template before sending
        if (!campaign.templateId) {
          return res.status(400).json({
            success: false,
            message: 'Campaign missing template'
          });
        }

        const template = campaign.templateId as any;

        if (!template.isMetaTemplate) {
          return res.status(400).json({
            success: false,
            message: 'Only Meta templates can be used for campaigns'
          });
        }

        if (template.metaStatus !== 'APPROVED') {
          return res.status(400).json({
            success: false,
            message: 'Template must be approved by Meta before sending'
          });
        }

        // Get recipients - either from recipient list or direct MRs
        let recipients = [];
        if (campaign.recipientListId) {
          // Campaign with recipient list
          const recipientList = campaign.recipientListId as any;
          if (!recipientList.recipients || recipientList.recipients.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'No recipients found in the recipient list'
            });
          }
          recipients = recipientList.recipients;
        } else if (campaign.mrIds && campaign.mrIds.length > 0) {
          // Campaign with direct MRs - get MRs from database
          const mrs = await MedicalRep.find({ 
            _id: { $in: campaign.mrIds }, 
            $or: [{ isActive: true }, { isActive: { $exists: false } }]
          });
          
          if (mrs.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'No medical representatives found for this campaign'
            });
          }

          // Convert MRs to recipient format
          recipients = mrs.map(mr => ({
            mrId: mr._id,
            phone: mr.phone,
            firstName: mr.firstName,
            lastName: mr.lastName,
            parameters: {} // No parameters for templates without parameters
          }));
        } else {
          return res.status(400).json({
            success: false,
            message: 'Campaign has no recipients or medical representatives'
          });
        }

        // Check if messages have already been enqueued for this campaign
        const existingMessageLogs = await MessageLog.find({ campaignId: campaign._id });
        if (existingMessageLogs.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Messages have already been enqueued for this campaign'
          });
        }

        // Update campaign status to sending
        await Campaign.findByIdAndUpdate(campaign._id, updateData);

        // Seed campaign recipients list and enqueue messages for all recipients
        const seededRecipients: any[] = [];
        const { messageQueue } = await import('../../services/queue.service');
        let enqueuedCount = 0;

        for (const recipient of recipients) {
          try {
            // Seed recipient into campaign document (pending/queued)
            seededRecipients.push({
              mrId: recipient.mrId,
              phone: recipient.phone,
              firstName: recipient.firstName,
              lastName: recipient.lastName,
              status: 'queued'
            });

            // Create message log entry
            const messageLog = await MessageLog.create({
              campaignId: campaign._id,
              mrId: recipient.mrId,
              phoneNumber: recipient.phone,
              templateName: template.metaTemplateName,
              templateLanguage: template.metaLanguage,
              templateParameters: recipient.parameters || {},
              status: 'queued',
              sentBy: userId,
            });

            // Add message to queue
            await messageQueue.add('send-message', {
              messageType: 'template',
              campaignId: campaign._id.toString(),
              mrId: recipient.mrId,
              phoneNumber: recipient.phone,
              templateName: template.metaTemplateName,
              templateLanguage: template.metaLanguage,
              templateParameters: recipient.parameters || {},
              imageUrl: template.imageUrl || '', // Pass template imageUrl to queue
              messageLogId: (messageLog._id as any).toString(),
            });

            enqueuedCount++;
          } catch (error) {
            logger.error('Error enqueuing message for recipient:', {
              recipient: recipient.phone,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        // Persist seeded recipients to campaign document
        if (seededRecipients.length > 0) {
          await Campaign.findByIdAndUpdate(campaign._id, {
            $set: {
              recipients: seededRecipients,
              pendingCount: seededRecipients.length,
              sentCount: 0,
              failedCount: 0
            }
          });
        }

        logger.info('Campaign messages enqueued', {
          campaignId: campaign.campaignId,
          totalRecipients: recipients.length,
          enqueuedCount
        });

        return res.json({
          success: true,
          message: `Campaign activated! ${enqueuedCount} messages enqueued for sending`,
          data: {
            campaignId: campaign.campaignId,
            status: 'sending',
            enqueuedCount,
            totalRecipients: recipients.length
          }
        });

      } else if (status === 'completed' || status === 'failed') {
        updateData.completedAt = new Date();
        
        const updatedCampaign = await Campaign.findByIdAndUpdate(
          campaign._id,
          updateData,
          { new: true }
        );

        logger.info('Campaign status updated', { 
          campaignId: campaign.campaignId, 
          status: updatedCampaign?.status 
        });

        return res.json({
          success: true,
          message: 'Campaign status updated successfully',
          data: updatedCampaign
        });
      } else {
        // For other status changes (draft, pending, cancelled)
        const updatedCampaign = await Campaign.findByIdAndUpdate(
          campaign._id,
          updateData,
          { new: true }
        );

        logger.info('Campaign status updated', { 
          campaignId: campaign.campaignId, 
          status: updatedCampaign?.status 
        });

        return res.json({
          success: true,
          message: 'Campaign status updated successfully',
          data: updatedCampaign
        });
      }

    } catch (error) {
      logger.error('Error updating campaign status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update campaign status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Delete campaign (soft delete)
   */
  static async deleteCampaign(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { campaignId } = req.params;
      const userId = req.user?.userId;

      const campaign = await Campaign.findOneAndUpdate(
        { campaignId, createdBy: userId, isActive: true },
        { isActive: false },
        { new: true }
      );

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      logger.info('Campaign deleted', { campaignId: campaign.campaignId });

      return res.json({
        success: true,
        message: 'Campaign deleted successfully'
      });

    } catch (error) {
      logger.error('Error deleting campaign:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete campaign',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get real-time message status from WhatsApp Cloud API
   */
  static async getMessageStatus(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { messageId } = req.params;

      if (!messageId) {
        return res.status(400).json({
          success: false,
          message: 'Message ID is required'
        });
      }

      // Get message status from database (webhook-updated data)
      const messageLog = await MessageLog.findOne({ messageId });
      
      if (!messageLog) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      // Return database status (most reliable as it's updated by webhooks)
      const transformedStatus = {
        messageId: messageLog.messageId,
        status: messageLog.status,
        timestamp: (messageLog as any).lastUpdated || messageLog.updatedAt,
        recipient_id: messageLog.phoneNumber,
        conversation: null as any, // Not stored in our database
        pricing: null as any // Not stored in our database
      };

      return res.json({
        success: true,
        data: transformedStatus
      });

    } catch (error) {
      logger.error('Error getting message status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get message status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update message status from webhook
   */
  static async updateMessageStatus(req: AuthenticatedRequest, res: Response): Promise<Response> {
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
      if (updatedLog.campaignId) {
        await this.checkAndUpdateCampaignCompletion(updatedLog.campaignId.toString());
      }

      return res.json({
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
      return res.status(500).json({
        success: false,
        message: 'Failed to update message status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Check and update campaign completion status
   */
  static async checkAndUpdateCampaignCompletion(campaignId: string) {
    try {
      const campaign = await Campaign.findOne({ campaignId: campaignId });
      if (!campaign) {
        logger.warn('Campaign not found for completion check', { campaignId });
        return;
      }

      // Skip if already completed
      if (campaign.status === 'completed') {
        return;
      }

      const allLogs = await MessageLog.find({ campaignId: campaign._id });
      const allProcessed = allLogs.every(log => 
        log.status === 'sent' || log.status === 'failed' || log.status === 'delivered' || log.status === 'read'
      );

      if (allProcessed && allLogs.length > 0) {
        campaign.status = 'completed';
        campaign.completedAt = new Date();
        await campaign.save();
        logger.info('Campaign marked as completed', { 
          campaignId: campaign.campaignId,
          totalMessages: allLogs.length,
          sentCount: allLogs.filter(log => log.status === 'sent' || log.status === 'delivered' || log.status === 'read').length,
          failedCount: allLogs.filter(log => log.status === 'failed').length
        });
      }
    } catch (error) {
      logger.error('Error checking campaign completion', { campaignId, error });
    }
  }

  /**
   * Manually check and update campaign completion status
   */
  static async checkCampaignCompletion(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { campaignId } = req.params;
      const userId = req.user?.userId;

      // Find campaign
      const campaign = await Campaign.findOne({ 
        $or: [
          { campaignId, createdBy: userId, isActive: true },
          { _id: campaignId, createdBy: userId, isActive: true }
        ]
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      await this.checkAndUpdateCampaignCompletion(campaign._id.toString());

      // Get updated campaign
      const updatedCampaign = await Campaign.findById(campaign._id)
        .populate('templateId', 'name metaTemplateName metaLanguage metaStatus isMetaTemplate imageUrl')
        .populate('recipientListId', 'name recipients')
        .populate('createdBy', 'name email');

      return res.json({
        success: true,
        message: 'Campaign completion status checked and updated',
        data: {
          campaignId: updatedCampaign?.campaignId,
          status: updatedCampaign?.status,
          completedAt: updatedCampaign?.completedAt
        }
      });

    } catch (error) {
      logger.error('Error checking campaign completion:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to check campaign completion',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get real-time status for all messages in a campaign
   */
  static async getCampaignRealTimeStatus(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { campaignId } = req.params;
      const userId = req.user?.userId;

      // Find campaign
      const campaign = await Campaign.findOne({ 
        $or: [
          { _id: campaignId, createdBy: userId, isActive: true },
          { campaignId: campaignId, createdBy: userId, isActive: true }
        ]
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      // Get the campaign's actual recipients from the recipient list (guard null)
      const campaignRecipients = campaign.recipientListId
        ? ((campaign.recipientListId as any).recipients || [])
        : [];
      
      // Get message logs for this campaign to find status
      const messageLogs = await MessageLog.find({ campaignId: campaign._id });

      // Create a map of mrId to message log for quick lookup
      const messageLogMap = new Map();
      messageLogs.forEach(log => {
        const mrId = log.mrId;
        if (!messageLogMap.has(mrId) || log.createdAt > messageLogMap.get(mrId).createdAt) {
          messageLogMap.set(mrId, log);
        }
      });

      // Fetch real-time status for each campaign recipient
      const realTimeStatuses = await Promise.all(
        campaignRecipients.map(async (recipient: any) => {
          const messageLog = messageLogMap.get(recipient.mrId);
          let realTimeStatus = 'pending'; // Default status
          let realTimeTimestamp = null;
          let errorMessage = null;
          let messageId = null;
          
          // If we have a message log for this recipient, use webhook-updated status
          if (messageLog) {
            // Always prioritize webhook-updated status (most reliable)
            realTimeStatus = messageLog.status;
            realTimeTimestamp = messageLog.sentAt || messageLog.deliveredAt;
            errorMessage = messageLog.errorMessage;
            messageId = messageLog.messageId;
            
            logger.info('Using webhook status for recipient in real-time status', {
              mrId: recipient.mrId,
              status: realTimeStatus,
              messageId: messageLog.messageId,
              lastUpdated: messageLog.lastUpdated || messageLog.updatedAt
            });
          } else {
            // No message log found, default to pending
            realTimeStatus = 'pending';
            logger.info('No message log found for recipient in real-time status, defaulting to pending', {
              mrId: recipient.mrId
            });
          }

          return {
            id: recipient._id || recipient.mrId,
            mrId: recipient.mrId,
            firstName: recipient.firstName,
            lastName: recipient.lastName,
            phone: recipient.phone,
            group: recipient.groupId || 'Default Group', // Frontend expects 'group' field
            status: realTimeStatus,
            sentAt: realTimeTimestamp,
            errorMessage: errorMessage,
            messageId: messageId
          };
        })
      );

      return res.json({
        success: true,
        data: {
          campaignId: campaign._id,
          campaignName: campaign.name,
          totalRecipients: campaign.totalRecipients,
          recipients: realTimeStatuses,
          lastUpdated: new Date()
        }
      });

    } catch (error) {
      logger.error('Error getting campaign real-time status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get campaign real-time status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
