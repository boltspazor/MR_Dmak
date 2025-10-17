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

      // Validate MRs exist
      const mrs = await MedicalRep.find({ 
        _id: { $in: mrIds }
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
   * Get total number of campaigns (lightweight) for the authenticated user
   */
  static async getCampaignsTotalCount(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const total = await Campaign.countDocuments({ createdBy: userId, isActive: true });
      return res.json({ success: true, data: { total } });
    } catch (error) {
      logger.error('Error getting campaigns total count:', error);
      return res.status(500).json({ success: false, message: 'Failed to get campaigns total count' });
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
      const { page = 1, limit = 10, status, search, sortField, sortDirection } = req.query;
  
      console.log('🔍 Backend getCampaigns - Received params:', { page, limit, status, search, sortField, sortDirection });
  
      // Build query
      const baseQuery: any = { createdBy: userId, isActive: true };
      console.log('🔍 Backend - Base query:', baseQuery);
      console.log('🔍 Backend - Requested status filter:', status);
  
      // Handle search
      let searchQuery = baseQuery;
      if (search) {
        const searchStr = String(search);
        const initialMatch: any = { createdBy: userId, isActive: true };
        
        console.log('🔍 Backend - Performing search with term:', searchStr);
        const campaigns = await Campaign.aggregate([
          { $match: initialMatch },
          {
            $lookup: {
              from: 'templates',
              localField: 'templateId',
              foreignField: '_id',
              as: 'template'
            }
          },
          {
            $lookup: {
              from: 'templaterecipients',
              localField: 'recipientListId', 
              foreignField: '_id',
              as: 'recipientList'
            }
          },
          {
            $match: {
              $or: [
                { name: { $regex: searchStr, $options: 'i' } },
                { description: { $regex: searchStr, $options: 'i' } },
                { campaignId: { $regex: searchStr, $options: 'i' } },
                { 'template.name': { $regex: searchStr, $options: 'i' } },
                { 'template.metaTemplateName': { $regex: searchStr, $options: 'i' } },
                { 'recipientList.name': { $regex: searchStr, $options: 'i' } }
              ]
            }
          },
          { $project: { _id: 1 } }
        ]);
        
        console.log('🔍 Backend - Search found campaigns:', campaigns.length);
        
        const campaignIds = campaigns.map(c => c._id);
        searchQuery = { createdBy: userId, isActive: true, _id: { $in: campaignIds } };
      }
  
      // Build sort options
      const sortOptions: any = {};
      if (sortField && sortDirection) {
        const fieldMap: { [key: string]: string } = {
          'campaignName': 'name',
          'template': 'templateId',
          'recipientList': 'recipientListId',
          'date': 'createdAt',
          'sendStatus': 'status'
        };
        
        const sortFieldStr = String(sortField);
        const dbField = fieldMap[sortFieldStr] || sortFieldStr || 'createdAt';
        const actualSortField = dbField.includes('.') ? dbField.split('.')[0] : dbField;
        sortOptions[actualSortField] = sortDirection === 'asc' ? 1 : -1;
      } else {
        sortOptions.createdAt = -1;
      }
  
      console.log('🔍 Backend - Final searchQuery:', searchQuery);
      console.log('🔍 Backend - Sort options:', sortOptions);
      
      // ✅ Get ALL campaigns (no limit yet) with populated data
      let campaigns = await Campaign.find(searchQuery)
        .populate('templateId', 'name metaTemplateName metaStatus isMetaTemplate type imageUrl')
        .populate('recipientListId', 'name description recipients')
        .populate('createdBy', 'name email')
        .sort(sortOptions);
  
      const totalCampaigns = campaigns.length;
      console.log('🔍 Backend - Total campaigns fetched:', totalCampaigns);
  
      // ✅ Calculate progress for ALL campaigns
      const campaignsWithProgress = await Promise.all(
        campaigns.map(async (campaign) => {
          const recipients = (campaign as any).recipients && (campaign as any).recipients.length > 0
            ? (campaign as any).recipients
            : [];
  
          let total = recipients.length || campaign.totalRecipients || 0;
          let receivedCount = 0;
          let failedCount = 0;
          let pendingCount = 0;
  
          if (recipients.length > 0) {
            for (const r of recipients as any[]) {
              const status = (r.status || '').toLowerCase();
              if (status === 'delivered' || status === 'read') receivedCount++;
              else if (status === 'failed') failedCount++;
              else pendingCount++;
            }
          } else {
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
  
          // Calculate dynamic status
          let apiStatus = campaign.status;
          if (total > 0) {
            if (receivedCount + failedCount === total) {
              if (failedCount === total) {
                apiStatus = 'failed';
              } else {
                apiStatus = 'completed';
              }
            } else if (pendingCount > 0) {
              apiStatus = 'in-progress';
            } else {
              apiStatus = 'pending';
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
            progress: {
              total,
              sent: receivedCount,
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
  
      // ✅ Apply status filtering AFTER calculating dynamic statuses
      let filteredCampaigns = campaignsWithProgress;
      if (status) {
        console.log('🔍 Backend - Applying status filter:', status);
        filteredCampaigns = campaignsWithProgress.filter(campaign => {
          const matches = campaign.status === status;
          return matches;
        });
        console.log('🔍 Backend - Campaigns after status filter:', filteredCampaigns.length);
      }
  
      // ✅ Apply sorting if needed (for nested fields)
      if (sortField && sortDirection) {
        if (sortField === 'template' || sortField === 'recipientList') {
          filteredCampaigns = filteredCampaigns.sort((a, b) => {
            let aValue = '';
            let bValue = '';
            
            if (sortField === 'template') {
              aValue = a.template?.name || '';
              bValue = b.template?.name || '';
            }
            
            if (sortDirection === 'asc') {
              return aValue.localeCompare(bValue);
            } else {
              return bValue.localeCompare(aValue);
            }
          });
        }
      }
  
      // ✅ Calculate total AFTER filtering
      const filteredTotal = filteredCampaigns.length;
  
      // ✅ Apply pagination LAST
      const paginatedCampaigns = filteredCampaigns.slice(
        (Number(page) - 1) * Number(limit),
        Number(page) * Number(limit)
      );
  
      console.log('🔍 Backend - Total campaigns from DB:', totalCampaigns);
      console.log('🔍 Backend - Filtered total:', filteredTotal);
      console.log('🔍 Backend - Paginated campaigns count:', paginatedCampaigns.length);
  
      return res.json({
        success: true,
        data: {
          campaigns: paginatedCampaigns,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: filteredTotal,
            totalPages: Math.ceil(filteredTotal / Number(limit))
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
   * Get available campaign statuses
   */
  static async getAvailableStatuses(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;
      
      // Get distinct statuses from the database for this user
      const dbStatuses = await Campaign.distinct('status', { 
        createdBy: userId, 
        isActive: true 
      });
      
      // Only include allowed statuses for filtering
      const allowedStatuses = ['pending', 'in-progress', 'completed', 'failed'];
      
      // Get distinct statuses from database and filter to only allowed ones
      const availableStatuses = dbStatuses.filter(status => allowedStatuses.includes(status));
      
      // Ensure all allowed statuses are included even if not in database
      const allStatuses = [...new Set([...availableStatuses, ...allowedStatuses])];
      
      return res.json({
        success: true,
        data: {
          statuses: allStatuses.map(status => ({
            value: status,
            label: status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)
          }))
        }
      });
    } catch (error) {
      console.error('Error getting available statuses:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get available statuses'
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

      // Get campaign recipients - handle both recipient list campaigns and direct MR campaigns  
      let campaignRecipients: any[] = [];
      
      if ((campaign as any).recipients && (campaign as any).recipients.length > 0) {
        // Campaign has seeded recipients (after being activated)
        campaignRecipients = (campaign as any).recipients;
      } else if (campaign.recipientListId) {
        // Campaign with recipient list - get from populated recipientListId
        campaignRecipients = ((campaign.recipientListId as any).recipients || []);
      } else if (campaign.mrIds && campaign.mrIds.length > 0) {
        // Campaign with direct MRs - fetch MRs from database
        const mrs = await MedicalRep.find({ 
          _id: { $in: campaign.mrIds }
        });
        
        campaignRecipients = mrs.map((mr: any) => ({
          mrId: mr._id,
          firstName: mr.firstName,
          lastName: mr.lastName,
          phone: mr.phone,
          groupId: mr.groupId,
          status: 'pending' // Default status for non-activated campaigns
        }));
      }

      console.log('🔍 getCampaignById - Found campaign recipients:', campaignRecipients.length);
      
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
        r.status === 'pending'
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

      const validStatuses = ['pending', 'in-progress', 'completed', 'failed'];
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
      
      if (status === 'in-progress') {
        // Check if campaign is already in progress state
        if (campaign.status === 'in-progress') {
          return res.status(400).json({
            success: false,
            message: 'Campaign is already in progress'
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
          // Campaign with direct MRs - get MRs from database (exclude soft deleted)
          const mrs = await MedicalRep.find({ 
            _id: { $in: campaign.mrIds }, 

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

        // Update campaign status to in-progress
        await Campaign.findByIdAndUpdate(campaign._id, updateData);

        // Seed campaign recipients list and enqueue messages for all recipients
        const seededRecipients: any[] = [];
        const { messageQueue } = await import('../../services/queue.service');
        let enqueuedCount = 0;

        for (const recipient of recipients) {
          try {
            // Seed recipient into campaign document (pending status)
            seededRecipients.push({
              mrId: recipient.mrId,
              phone: recipient.phone,
              firstName: recipient.firstName,
              lastName: recipient.lastName,
              status: 'pending'
            });

            // Create message log entry
            const messageLog = await MessageLog.create({
              campaignId: campaign._id,
              mrId: recipient.mrId,
              phoneNumber: recipient.phone,
              templateName: template.metaTemplateName,
              templateLanguage: template.metaLanguage,
              templateParameters: recipient.parameters || {},
              status: 'pending',
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
            status: 'in-progress',
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
        // For other status changes (pending)
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
        const sentCount = allLogs.filter(log => log.status === 'sent' || log.status === 'delivered' || log.status === 'read').length;
        const failedCount = allLogs.filter(log => log.status === 'failed').length;
        
        // Determine final status: failed if all failed, otherwise completed
        const finalStatus = failedCount === allLogs.length ? 'failed' : 'completed';
        
        campaign.status = finalStatus;
        campaign.completedAt = new Date();
        await campaign.save();
        logger.info('Campaign marked as final status', { 
          campaignId: campaign.campaignId,
          finalStatus,
          totalMessages: allLogs.length,
          sentCount,
          failedCount
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
   * Export campaigns to CSV with current filters applied
   */
  static async exportCampaigns(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.userId;
      const { search, status, sortField, sortDirection } = req.query;

      logger.info('Exporting campaigns with filters', { 
        userId, 
        filters: { search, status, sortField, sortDirection }
      });

      // Build query - same as getCampaigns but without pagination
      const baseQuery: any = { createdBy: userId, isActive: true };
      
      // Build sort options
      const sortOptions: any = {};
      if (sortField && sortDirection) {
        const fieldMap: { [key: string]: string } = {
          'campaignName': 'name',
          'template': 'templateId',
          'date': 'createdAt',
          'sendStatus': 'status'
        };
        
        const sortFieldStr = String(sortField);
        const dbField = fieldMap[sortFieldStr] || 'createdAt';
        sortOptions[dbField] = sortDirection === 'asc' ? 1 : -1;
      } else {
        sortOptions.createdAt = -1;
      }

      // Apply search filter if provided
      let searchQuery = baseQuery;
      if (search) {
        const searchStr = String(search);
        const campaigns = await Campaign.aggregate([
          { $match: { createdBy: userId, isActive: true } },
          {
            $lookup: {
              from: 'templates',
              localField: 'templateId',
              foreignField: '_id',
              as: 'template'
            }
          },
          {
            $match: {
              $or: [
                { name: { $regex: searchStr, $options: 'i' } },
                { description: { $regex: searchStr, $options: 'i' } },
                { campaignId: { $regex: searchStr, $options: 'i' } },
                { 'template.name': { $regex: searchStr, $options: 'i' } }
              ]
            }
          },
          { $project: { _id: 1 } }
        ]);
        
        const campaignIds = campaigns.map(c => c._id);
        searchQuery = { createdBy: userId, isActive: true, _id: { $in: campaignIds } };
      }

      // Get campaigns with populated data (no pagination for export)
      let campaigns = await Campaign.find(searchQuery)
        .populate('templateId', 'name metaTemplateName metaStatus isMetaTemplate type')
        .populate('createdBy', 'name email')
        .sort(sortOptions);

      // Calculate progress and apply status filtering
      const campaignsWithProgress = await Promise.all(
        campaigns.map(async (campaign) => {
          // Similar progress calculation as in getCampaigns
          const recipients = (campaign as any).recipients || [];
          let total = recipients.length || campaign.totalRecipients || 0;
          let receivedCount = 0;
          let failedCount = 0;
          let pendingCount = 0;

          if (recipients.length > 0) {
            for (const r of recipients as any[]) {
              const status = (r.status || '').toLowerCase();
              if (status === 'delivered' || status === 'read') receivedCount++;
              else if (status === 'failed') failedCount++;
              else pendingCount++;
            }
          } else {
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

          // Calculate status
          let apiStatus = campaign.status;
          if (total > 0) {
            if (receivedCount + failedCount === total) {
              if (failedCount === total) {
                apiStatus = 'failed';
              } else {
                apiStatus = 'completed';
              }
            } else if (pendingCount > 0) {
              apiStatus = 'in-progress';
            } else {
              apiStatus = 'pending';
            }
          }

          return {
            id: campaign._id,
            campaignId: campaign.campaignId,
            name: campaign.name,
            description: campaign.description,
            status: apiStatus,
            createdAt: campaign.createdAt,
            template: campaign.templateId ? {
              name: (campaign.templateId as any).name,
              metaTemplateName: (campaign.templateId as any).metaTemplateName
            } : null,
            progress: {
              total,
              sent: receivedCount,
              failed: failedCount,
              pending: pendingCount,
              successRate
            }
          };
        })
      );

      // Apply status filtering after calculation
      let filteredCampaigns = campaignsWithProgress;
      if (status) {
        filteredCampaigns = campaignsWithProgress.filter(campaign => campaign.status === status);
      }

      // Import ExcelService for CSV generation
      const { ExcelService } = await import('../../services/excel.service');
      const excelService = new ExcelService();
      
      // Generate CSV from filtered results
      const csvData = excelService.generateCSV(filteredCampaigns, 'campaign');
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=campaigns-${new Date().toISOString().split('T')[0]}.csv`);
      
      return res.send(csvData);
    } catch (error) {
      logger.error('Error exporting campaigns:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to export campaigns',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Search campaign recipients with filters
   */
  static async searchCampaignRecipients(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { campaignId } = req.params;
      const { search, status, page = 1, limit = 10 } = req.query;
      const userId = req.user?.userId;

      console.log('🔍 Backend searchCampaignRecipients - Received params:', { campaignId, search, status, page, limit });

      // Find campaign and verify ownership
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

      // Get campaign recipients - handle both recipient list campaigns and direct MR campaigns
      let campaignRecipients: any[] = [];
      
      if ((campaign as any).recipients && (campaign as any).recipients.length > 0) {
        // Campaign has seeded recipients (after being activated)
        campaignRecipients = (campaign as any).recipients;
      } else if (campaign.recipientListId) {
        // Campaign with recipient list - fetch from recipient list
        const recipientList = await TemplateRecipients.findById(campaign.recipientListId);
        if (recipientList && recipientList.recipients) {
          campaignRecipients = recipientList.recipients.map((recipient: any) => ({
            mrId: recipient.mrId || recipient._id,
            firstName: recipient.firstName,
            lastName: recipient.lastName,
            phone: recipient.phone,
            groupId: recipient.groupId,
            status: 'pending' // Default status for non-activated campaigns
          }));
        }
      } else if (campaign.mrIds && campaign.mrIds.length > 0) {
        // Campaign with direct MRs - fetch MRs from database
        const mrs = await MedicalRep.find({ 
          _id: { $in: campaign.mrIds }
        });
        
        campaignRecipients = mrs.map((mr: any) => ({
          mrId: mr._id,
          firstName: mr.firstName,
          lastName: mr.lastName,
          phone: mr.phone,
          groupId: mr.groupId,
          status: 'pending' // Default status for non-activated campaigns
        }));
      }

      console.log('🔍 Backend - Found campaign recipients:', campaignRecipients.length);
      
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

      // Process recipients with real-time status
      let recipients = campaignRecipients.map((recipient: any) => {
        const messageLog = messageLogMap.get(recipient.mrId);
        let realTimeStatus = recipient.status || 'pending';
        let realTimeTimestamp = null;
        let errorMessage = null;
        let messageId = null;
        
        if (messageLog) {
          realTimeStatus = messageLog.status;
          realTimeTimestamp = messageLog.sentAt || messageLog.deliveredAt;
          errorMessage = messageLog.errorMessage;
          messageId = messageLog.messageId;
        }

        return {
          id: recipient._id || recipient.mrId,
          mrId: recipient.mrId,
          firstName: recipient.firstName,
          lastName: recipient.lastName,
          name: `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim() || 'Unknown',
          phone: recipient.phone,
          group: recipient.groupId || 'Default Group',
          status: realTimeStatus,
          sentAt: recipient.sentAt || realTimeTimestamp,
          errorMessage: recipient.errorMessage || errorMessage,
          errorCode: messageLog?.errorCode,
          errorTitle: messageLog?.errorTitle,
          errorDetails: messageLog?.errorDetails,
          messageId: recipient.messageId || messageId
        };
      });

      console.log('🔍 Backend - Total recipients before filtering:', recipients.length);

      // Apply search filter
      if (search && search.toString().trim() !== '') {
        const searchStr = search.toString().toLowerCase();
        recipients = recipients.filter((recipient: any) => {
          const nameMatch = (recipient.name || '').toLowerCase().includes(searchStr);
          const phoneMatch = (recipient.phone || '').toLowerCase().includes(searchStr);
          const firstNameMatch = (recipient.firstName || '').toLowerCase().includes(searchStr);
          const lastNameMatch = (recipient.lastName || '').toLowerCase().includes(searchStr);
          
          return nameMatch || phoneMatch || firstNameMatch || lastNameMatch;
        });
        console.log('🔍 Backend - Recipients after search filtering:', recipients.length, 'search term:', searchStr);
      }

      // Apply status filter
      if (status && status.toString().trim() !== '' && status !== 'all') {
        recipients = recipients.filter((recipient: any) => recipient.status === status);
        console.log('🔍 Backend - Recipients after status filtering:', recipients.length, 'status:', status);
      }

      // Calculate pagination
      const totalFiltered = recipients.length;
      const pageNum = Number(page);
      const limitNum = Number(limit);
      const totalPages = Math.ceil(totalFiltered / limitNum);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedRecipients = recipients.slice(startIndex, endIndex);

      // Calculate aggregate statistics for filtered results
      const delivered = recipients.filter(r => r.status === 'delivered').length;
      const read = recipients.filter(r => r.status === 'read').length;
      const successCount = delivered + read;
      
      const stats = {
        total: totalFiltered,
        pending: recipients.filter(r => r.status === 'pending').length,
        sent: recipients.filter(r => r.status === 'sent').length,
        delivered,
        read,
        failed: recipients.filter(r => r.status === 'failed').length,
        received: successCount, // Combined delivered + read
        successRate: totalFiltered > 0 ? Math.round((successCount / totalFiltered) * 100) : 0
      };

      console.log('🔍 Backend - Pagination:', { page: pageNum, limit: limitNum, totalFiltered, totalPages, startIndex, endIndex });
      console.log('🔍 Backend - Returning recipients count:', paginatedRecipients.length);
      console.log('🔍 Backend - Aggregate stats:', stats);

      return res.json({
        success: true,
        data: {
          recipients: paginatedRecipients,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: totalFiltered,
            totalPages
          },
          stats,
          campaign: {
            id: campaign._id,
            campaignId: campaign.campaignId,
            name: campaign.name
          }
        }
      });

    } catch (error) {
      logger.error('Error searching campaign recipients:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to search campaign recipients',
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
