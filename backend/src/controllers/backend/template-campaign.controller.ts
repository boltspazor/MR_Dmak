import { Request, Response } from 'express';
import { MessageService } from '../../services/message.service';
import whatsappCloudAPI from '../../services/whatsapp-cloud-api.service';
import logger from '../../utils/logger';
import MessageCampaign from '../../models/MessageCampaign';
import MessageLog from '../../models/MessageLog';
import MedicalRep from '../../models/MedicalRepresentative';
import MetaTemplate from '../../models/Template';
import TemplateRecipients from '../../models/TemplateRecipients';  

export class TemplateCampaignController {
  async createTemplateCampaign(req: any, res: Response) {
    try {
      logger.info('🚀 Template campaign creation started', {
        body: req.body,
        user: req.user?.userId
      });

      const { name, templateId, recipientListId } = req.body;
      
      // Validate required fields
      if (!name || !templateId || !recipientListId) {
        logger.warn('❌ Template campaign validation failed', { name, templateId, recipientListId });
        return res.status(400).json({ 
          error: 'Campaign name, template ID, and recipient list ID are required' 
        });
      }

      logger.info('✅ Template campaign validation passed');

      // Get template information
      const template = await MetaTemplate.findById(templateId);
      if (!template) {
        logger.warn('❌ Template not found', { templateId });
        return res.status(404).json({ 
          error: 'Template not found' 
        });
      }

      logger.info('📄 Template found', { 
        templateName: template.name, 
        language: template.metaLanguage,
        status: template.metaStatus 
      });

      // Get recipient list from database
      const recipientList = await TemplateRecipients.findById(recipientListId);
      if (!recipientList) {
        logger.warn('❌ Recipient list not found', { recipientListId });
        return res.status(404).json({ 
          error: 'Recipient list not found' 
        });
      }

      if (!recipientList.isActive) {
        logger.warn('❌ Recipient list is inactive', { recipientListId });
        return res.status(400).json({ 
          error: 'Recipient list is inactive' 
        });
      }

      if (recipientList.recipients.length === 0) {
        logger.warn('❌ No recipients found in recipient list', { recipientListId });
        return res.status(400).json({ 
          error: 'No recipients found in the selected recipient list' 
        });
      }

      logger.info('👥 Recipients found in list', { 
        count: recipientList.recipients.length,
        listName: recipientList.name 
      });

      // Generate unique campaign ID
      const campaignId = `CAMP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Create a dummy message record for the campaign (since template campaigns don't use the Message model)
      const dummyMessageId = new (await import('mongoose')).Types.ObjectId();

      // Create campaign record
      const campaign = await MessageCampaign.create({
        campaignId,
        messageId: dummyMessageId,
        createdBy: req.user.userId,
        targetGroups: [recipientListId],
        totalRecipients: recipientList.recipients.length,
        status: 'pending'
      });
      logger.info('✅ Campaign record created', { campaignId: campaignId });

      // Get the actual MedicalRepresentative ObjectIds from the string mrIds
      const mrIds = recipientList.recipients.map(r => r.mrId);
      const medicalReps = await MedicalRep.find({ mrId: { $in: mrIds } });
      const mrIdMap = new Map(medicalReps.map(mr => [mr.mrId, mr._id]));

      // Create message logs for tracking
      const messageLogs = recipientList.recipients.map(recipient => {
        const actualMrId = mrIdMap.get(recipient.mrId);
        if (!actualMrId) {
          throw new Error(`Medical representative with mrId "${recipient.mrId}" not found`);
        }
        return {
          campaignId: campaign._id,
          mrId: actualMrId,
          phoneNumber: recipient.phone,
          status: 'pending'
        };
      });

      await MessageLog.insertMany(messageLogs);
      logger.info('✅ Message logs created', { count: messageLogs.length });

      // Send template messages directly using WhatsApp Cloud API
      const results = [];
      const errors = [];

      for (const recipient of recipientList.recipients) {
        try {
          logger.info('📤 Sending template message', { 
            mrId: recipient.mrId, 
            phone: recipient.phone, 
            templateName: template.name,
            firstName: recipient.firstName,
            lastName: recipient.lastName
          });

          // Use template parameters from the recipient data
          const templateParameters: Array<{name: string, value: string}> = Object.entries(recipient.parameters || {}).map(([name, value]) => ({
            name,
            value: String(value)
          }));
          
          // If no parameters are provided, use basic name parameters
          if (templateParameters.length === 0) {
            templateParameters.push({ name: 'first_name', value: recipient.firstName || 'User' });
            templateParameters.push({ name: 'last_name', value: recipient.lastName || '' });
          }

          const result = await whatsappCloudAPI.sendTemplateMessage(
            recipient.phone,
            template.name,
            templateParameters,
            template.metaLanguage || 'en_US'
          );

          // Update message log with success
          const actualMrId = mrIdMap.get(recipient.mrId);
          await MessageLog.updateOne(
            { campaignId: campaign._id, mrId: actualMrId },
            {
              status: 'sent',
              sentAt: new Date(),
              errorMessage: null
            }
          );

          results.push({
            mrId: recipient.mrId,
            phone: recipient.phone,
            firstName: recipient.firstName,
            lastName: recipient.lastName,
            success: true,
            messageId: result.messages[0]?.id,
            status: result.messages[0]?.message_status
          });

          logger.info('✅ Template message sent successfully', {
            mrId: recipient.mrId,
            messageId: result.messages[0]?.id,
            status: result.messages[0]?.message_status
          });

        } catch (error: any) {
          logger.error('❌ Template message failed', {
            mrId: recipient.mrId,
            phone: recipient.phone,
            error: error.message
          });

          // Update message log with failure
          const actualMrId = mrIdMap.get(recipient.mrId);
          await MessageLog.updateOne(
            { campaignId: campaign._id, mrId: actualMrId },
            {
              status: 'failed',
              errorMessage: error.message,
              sentAt: new Date()
            }
          );

          errors.push({
            mrId: recipient.mrId,
            phone: recipient.phone,
            firstName: recipient.firstName,
            lastName: recipient.lastName,
            error: error.message
          });
        }

        // Add delay between messages to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Update campaign status
      const successCount = results.length;
      const failureCount = errors.length;
      const status = failureCount === 0 ? 'completed' : 
                    successCount === 0 ? 'failed' : 'completed';

      await MessageCampaign.findByIdAndUpdate((campaign as any)._id, {
        status,
        sentCount: successCount,
        failedCount: failureCount
      });

      logger.info('🎉 Template campaign completed', {
        campaignId: campaignId,
        totalRecipients: recipientList.recipients.length,
        successCount,
        failureCount,
        status
      });

      return res.json({
        success: true,
        message: 'Template campaign created and processed successfully',
        data: {
          campaignId: campaignId,
          campaignName: name,
          totalRecipients: recipientList.recipients.length,
          successCount,
          failureCount,
          status,
          templateName: template.name,
          recipientListName: recipientList.name,
          results,
          errors
        }
      });

    } catch (error: any) {
      logger.error('❌ Template campaign creation failed', { 
        error: error.message, 
        body: req.body 
      });
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  async getTemplateCampaigns(req: any, res: Response) {
    try {
      const { limit = 50, offset = 0, search, status } = req.query;
      
      const query: any = { type: 'with-template' };
      
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }
      
      if (status) {
        query.status = status;
      }

      const campaigns = await MessageCampaign.find(query)
        .populate('templateId', 'name language status')
        .populate('recipientListId', 'name description')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset));

      const total = await MessageCampaign.countDocuments(query);

      return res.json({
        success: true,
        data: {
          campaigns,
          total,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });

    } catch (error: any) {
      logger.error('❌ Failed to get template campaigns', { error: error.message });
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  async getTemplateCampaignReport(req: Request, res: Response) {
    try {
      const { campaignId } = req.params;

      const campaign = await MessageCampaign.findOne({ campaignId: campaignId })
        .populate('templateId', 'name language status')
        .populate('recipientListId', 'name description');

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      const messageLogs = await MessageLog.find({ campaignId: campaign._id });

      const stats = {
        total: messageLogs.length,
        sent: messageLogs.filter(log => log.status === 'sent').length,
        failed: messageLogs.filter(log => log.status === 'failed').length,
        pending: messageLogs.filter(log => log.status === 'pending').length
      };

      return res.json({
        success: true,
        data: {
          campaign,
          stats,
          recipients: messageLogs.map(log => ({
            id: log.mrId,
            phone: log.phoneNumber,
            status: log.status,
            sentAt: log.sentAt,
            errorMessage: log.errorMessage
          }))
        }
      });

    } catch (error: any) {
      logger.error('❌ Failed to get template campaign report', { 
        error: error.message,
        campaignId: req.params.campaignId 
      });
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
}

export default new TemplateCampaignController();
