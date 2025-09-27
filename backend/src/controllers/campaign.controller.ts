import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';
import Campaign from '../models/Campaign';
import Template from '../models/Template';
import TemplateRecipients from '../models/TemplateRecipients';
import MessageLog from '../models/MessageLog';
import MedicalRep from '../models/MedicalRepresentative';
import logger from '../utils/logger';

export class CampaignController {
  /**
   * Get MRs for a campaign (for campaigns created with direct MR selection)
   */
  private static async getCampaignMRs(campaignId: any): Promise<string[]> {
    const campaign = await Campaign.findOne({ campaignId: campaignId });
    if (!campaign || !campaign.mrIds) {
      return [];
    }
    return campaign.mrIds.map(id => id.toString());
  }

  /**
   * Create a new campaign
   */
  static async createCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, description, templateId, recipientListId, scheduledAt } = req.body;
      const userId = req.user?.userId;

      // Validate template exists and is active
      const template = await Template.findById(templateId);
      if (!template || !template.isActive) {
        res.status(404).json({
          success: false,
          message: 'Template not found or inactive'
        });
      }

      // Validate recipient list exists and is active
      const recipientList = await TemplateRecipients.findById(recipientListId);
      if (!recipientList || !recipientList.isActive) {
        res.status(404).json({
          success: false,
          message: 'Recipient list not found or inactive'
        });
      }

      // Verify the recipient list belongs to the template
      if (recipientList.templateId.toString() !== templateId) {
        res.status(400).json({
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

      res.status(201).json({
        success: true,
        message: 'Campaign created successfully',
        data: campaign
      });

    } catch (error) {
      logger.error('Error creating campaign:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create campaign',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get all campaigns with template and recipient list details
   */
  static async getCampaigns(req: AuthenticatedRequest, res: Response): Promise<void> {
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
        .populate('templateId', 'name metaTemplateName metaStatus isMetaTemplate type')
        .populate('recipientListId', 'name description recipients')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .limit(Number(limit) * 1)
        .skip((Number(page) - 1) * Number(limit));

      const total = await Campaign.countDocuments(query);

      // Calculate progress for each campaign
      const campaignsWithProgress = await Promise.all(
        campaigns.map(async (campaign) => {
          // Get message logs for this campaign
          const messageLogs = await MessageLog.find({ 
            campaignId: campaign._id 
          });

          const sentCount = messageLogs.filter(log => log.status === 'sent').length;
          const failedCount = messageLogs.filter(log => log.status === 'failed').length;
          const pendingCount = messageLogs.filter(log => 
            log.status === 'pending' || log.status === 'queued'
          ).length;

          const successRate = campaign.totalRecipients > 0 
            ? Math.round((sentCount / campaign.totalRecipients) * 100) 
            : 0;

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
              name: (campaign.templateId as any).name,
              metaTemplateName: (campaign.templateId as any).metaTemplateName,
              metaStatus: (campaign.templateId as any).metaStatus,
              isMetaTemplate: (campaign.templateId as any).isMetaTemplate,
              type: (campaign.templateId as any).type
            },
            recipientList: {
              id: campaign.recipientListId._id,
              name: (campaign.recipientListId as any).name,
              description: (campaign.recipientListId as any).description,
              recipientCount: (campaign.recipientListId as any).recipients?.length || 0
            },
            progress: {
              total: campaign.totalRecipients,
              sent: sentCount,
              failed: failedCount,
              pending: pendingCount,
              successRate
            },
            createdBy: {
              id: campaign.createdBy._id,
              name: (campaign.createdBy as any).name,
              email: (campaign.createdBy as any).email
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
      logger.error('Error getting campaigns:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get campaigns',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get campaign by ID with full details
   */
  static async getCampaignById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;
      const userId = req.user?.userId;

      const campaign = await Campaign.findOne({ 
        campaignId, 
        createdBy: userId, 
        isActive: true 
      })
        .populate('templateId')
        .populate('recipientListId')
        .populate('createdBy', 'name email');

      if (!campaign) {
        res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      // Get message logs for progress tracking
      const messageLogs = await MessageLog.find({ campaignId: campaign._id })
        .populate('mrId', 'mrId firstName lastName phone groupId');

      const sentCount = messageLogs.filter(log => log.status === 'sent').length;
      const failedCount = messageLogs.filter(log => log.status === 'failed').length;
      const pendingCount = messageLogs.filter(log => 
        log.status === 'pending' || log.status === 'queued'
      ).length;

      const successRate = campaign.totalRecipients > 0 
        ? Math.round((sentCount / campaign.totalRecipients) * 100) 
        : 0;

      // Get detailed recipient status
      const recipients = messageLogs.map(log => ({
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
            completedAt: campaign.completedAt
          },
          template: {
            id: campaign.templateId._id,
            name: (campaign.templateId as any).name,
            metaTemplateName: (campaign.templateId as any).metaTemplateName,
            metaStatus: (campaign.templateId as any).metaStatus,
            isMetaTemplate: (campaign.templateId as any).isMetaTemplate,
            type: (campaign.templateId as any).type,
            metaLanguage: (campaign.templateId as any).metaLanguage
          },
          recipientList: {
            id: campaign.recipientListId._id,
            name: (campaign.recipientListId as any).name,
            description: (campaign.recipientListId as any).description,
            recipients: (campaign.recipientListId as any).recipients
          },
          progress: {
            total: campaign.totalRecipients,
            sent: sentCount,
            failed: failedCount,
            pending: pendingCount,
            successRate
          },
          recipients,
          lastUpdated: new Date()
        }
      });

    } catch (error) {
      logger.error('Error getting campaign by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get campaign',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update campaign status
   */
  static async updateCampaignStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;
      const { status } = req.body;
      const userId = req.user?.userId;

      const validStatuses = ['draft', 'pending', 'sending', 'completed', 'failed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
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
      .populate('templateId', 'name metaTemplateName metaLanguage metaStatus isMetaTemplate')
      .populate('recipientListId', 'name recipients');

      if (!campaign) {
        res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      const updateData: any = { status };
      
      if (status === 'sending') {
        // Check if campaign is already in sending state
        if (campaign.status === 'sending') {
          res.status(400).json({
            success: false,
            message: 'Campaign is already being sent'
          });
        }

        // Check if campaign is already completed
        if (campaign.status === 'completed') {
          res.status(400).json({
            success: false,
            message: 'Campaign has already been completed'
          });
        }

        updateData.startedAt = new Date();
        
        // Validate template before sending
        if (!campaign.templateId) {
          res.status(400).json({
            success: false,
            message: 'Campaign missing template'
          });
          return;
        }

        const template = campaign.templateId as any;

        if (!template.isMetaTemplate) {
          res.status(400).json({
            success: false,
            message: 'Only Meta templates can be used for campaigns'
          });
          return;
        }

        if (template.metaStatus !== 'APPROVED') {
          res.status(400).json({
            success: false,
            message: 'Template must be approved by Meta before sending'
          });
          return;
        }

        // Get recipients - either from recipient list or direct MRs
        let recipients = [];
        if (campaign.recipientListId) {
          // Campaign with recipient list
          const recipientList = campaign.recipientListId as any;
          if (!recipientList.recipients || recipientList.recipients.length === 0) {
            res.status(400).json({
              success: false,
              message: 'No recipients found in the recipient list'
            });
            return;
          }
          recipients = recipientList.recipients;
        } else {
          // Campaign with direct MRs - get MRs from database
          const mrs = await MedicalRep.find({ 
            _id: { $in: await this.getCampaignMRs(campaign._id) }, 
            isActive: true 
          });
          
          if (mrs.length === 0) {
            res.status(400).json({
              success: false,
              message: 'No medical representatives found for this campaign'
            });
            return;
          }

          // Convert MRs to recipient format
          recipients = mrs.map(mr => ({
            mrId: mr._id,
            phone: mr.phone,
            firstName: mr.firstName,
            lastName: mr.lastName,
            parameters: {} // No parameters for templates without parameters
          }));
        }

        // Check if messages have already been enqueued for this campaign
        const existingMessageLogs = await MessageLog.find({ campaignId: campaign._id });
        if (existingMessageLogs.length > 0) {
          res.status(400).json({
            success: false,
            message: 'Messages have already been enqueued for this campaign'
          });
        }

        // Update campaign status to sending
        await Campaign.findByIdAndUpdate(campaign._id, updateData);

        // Enqueue messages for all recipients
        const { messageQueue } = await import('../services/queue.service');
        let enqueuedCount = 0;

        for (const recipient of recipients) {
          try {
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

        logger.info('Campaign messages enqueued', {
          campaignId: campaign.campaignId,
          totalRecipients: recipients.length,
          enqueuedCount
        });

        res.json({
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

        res.json({
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

        res.json({
          success: true,
          message: 'Campaign status updated successfully',
          data: updatedCampaign
        });
      }

    } catch (error) {
      logger.error('Error updating campaign status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update campaign status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create a campaign with direct MR selection (for templates without parameters)
   */
  static async createCampaignWithMRs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, description, templateId, mrIds, scheduledAt } = req.body;
      const userId = req.user?.userId;

      // Validate template exists and is active
      const template = await Template.findById(templateId);
      if (!template || !template.isActive) {
        res.status(404).json({
          success: false,
          message: 'Template not found or inactive'
        });
        return;
      }

      // Validate MRs exist
      const mrs = await MedicalRep.find({ _id: { $in: mrIds }, isActive: true });
      if (mrs.length !== mrIds.length) {
        res.status(404).json({
          success: false,
          message: 'Some medical representatives not found or inactive'
        });
        return;
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

      res.status(201).json({
        success: true,
        message: 'Campaign created successfully',
        data: campaign
      });

    } catch (error) {
      logger.error('Error creating campaign with MRs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create campaign',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Delete campaign (soft delete)
   */
  static async deleteCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { campaignId } = req.params;
      const userId = req.user?.userId;

      const campaign = await Campaign.findOneAndUpdate(
        { campaignId, createdBy: userId, isActive: true },
        { isActive: false },
        { new: true }
      );

      if (!campaign) {
        res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      logger.info('Campaign deleted', { campaignId: campaign.campaignId });

      res.json({
        success: true,
        message: 'Campaign deleted successfully'
      });

    } catch (error) {
      logger.error('Error deleting campaign:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete campaign',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
