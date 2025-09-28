import logger from '../utils/logger';
import whatsappMarketingService from './whatsapp-marketing.service';
import MessageLog from '../models/MessageLog';
import Campaign from '../models/Campaign';

/**
 * Enhanced Queue Service for WhatsApp Marketing Templates
 * Integrates with the new WhatsApp Marketing Service for better tracking and compliance
 */
export class QueueMarketingEnhancedService {
  
  /**
   * Process marketing template message job with enhanced tracking
   * This replaces the existing template message processing with improved error handling and compliance
   */
  static async processMarketingTemplateJob(jobData: {
    campaignId: string,
    mrId: string,
    phoneNumber: string,
    templateName: string,
    templateLanguage: string,
    templateParameters: Array<{name: string, value: string}>,
    imageUrl?: string,
  }): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const { 
        campaignId, 
        mrId, 
        phoneNumber, 
        templateName, 
        templateLanguage, 
        templateParameters,
        imageUrl 
      } = jobData;

      logger.info('Processing marketing template job with enhanced service', {
        campaignId,
        mrId,
        phoneNumber,
        templateName,
        templateLanguage,
        parametersCount: templateParameters.length,
        hasImageUrl: !!imageUrl
      });

      // Process template parameters with image handling
      const processedParameters = this.processTemplateParameters(templateParameters, imageUrl);

      // Send marketing template message using enhanced service
      const result = await whatsappMarketingService.sendMarketingTemplateMessage(
        phoneNumber,
        templateName,
        templateLanguage,
        processedParameters,
        campaignId,
        mrId
      );

      if (result.success && result.messageId) {
        // Update message log with WhatsApp message ID
        await MessageLog.findOneAndUpdate(
          { 
            campaignId: campaignId,
            mrId: mrId 
          },
          {
            messageId: result.messageId,
            status: 'sent',
            sentAt: new Date(),
            updatedAt: new Date()
          },
          { upsert: false }
        );

        logger.info('Marketing template message processed successfully', {
          campaignId,
          mrId,
          phoneNumber,
          messageId: result.messageId,
          templateName
        });

        return {
          success: true,
          messageId: result.messageId
        };
      } else {
        // Update message log with error status
        await MessageLog.findOneAndUpdate(
          { 
            campaignId: campaignId,
            mrId: mrId 
          },
          {
            status: 'failed',
            errorMessage: result.error || 'Unknown error',
            failedAt: new Date(),
            updatedAt: new Date()
          },
          { upsert: false }
        );

        logger.error('Marketing template message failed', {
          campaignId,
          mrId,
          phoneNumber,
          error: result.error
        });

        return {
          success: false,
          error: result.error || 'Failed to send template message'
        };
      }

    } catch (error: any) {
      logger.error('Error processing marketing template job', {
        error: error.message,
        jobData
      });

      // Update message log with error status
      try {
        await MessageLog.findOneAndUpdate(
          { 
            campaignId: jobData.campaignId,
            mrId: jobData.mrId 
          },
          {
            status: 'failed',
            errorMessage: error.message,
            failedAt: new Date(),
            updatedAt: new Date()
          },
          { upsert: false }
        );
      } catch (updateError) {
        logger.error('Error updating message log with failure status', {
          error: updateError instanceof Error ? updateError.message : 'Unknown error'
        });
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process template parameters with enhanced handling for different types
   */
  private static processTemplateParameters(
    parameters: Array<{name: string, value: string}>, 
    imageUrl?: string
  ): Array<{name: string, value: string}> {
    const processedParameters = [...parameters];

    // Handle image URL if provided
    if (imageUrl && imageUrl.trim() !== '') {
      // Check if there's already a header parameter
      const hasHeaderParam = processedParameters.some(p => p.name.includes('header'));
      
      if (!hasHeaderParam) {
        // Add image as header parameter
        processedParameters.unshift({
          name: 'header_image',
          value: imageUrl
        });
      } else {
        // Update existing header parameter with image
        const headerParamIndex = processedParameters.findIndex(p => p.name.includes('header'));
        if (headerParamIndex !== -1) {
          processedParameters[headerParamIndex].value = imageUrl;
        }
      }
    }

    // Process parameter values for better WhatsApp API compatibility
    return processedParameters.map(param => ({
      name: param.name,
      value: this.sanitizeParameterValue(param.value)
    }));
  }

  /**
   * Sanitize parameter values for WhatsApp API
   */
  private static sanitizeParameterValue(value: string): string {
    // Remove any potentially problematic characters
    return value
      .replace(/[^\w\s\-.,!?@#$%^&*()+=<>:"'[\]{}|\\~`]/g, '') // Keep only safe characters
      .trim()
      .substring(0, 1000); // Limit length to prevent API issues
  }

  /**
   * Process bulk marketing template messages
   * Enhanced version for batch processing with better error handling
   */
  static async processBulkMarketingTemplates(
    campaignId: string,
    recipients: Array<{
      mrId: string;
      phoneNumber: string;
      templateName: string;
      templateLanguage: string;
      templateParameters: Array<{name: string, value: string}>;
      imageUrl?: string;
    }>
  ): Promise<{
    success: boolean;
    processed: number;
    failed: number;
    results: Array<{
      mrId: string;
      success: boolean;
      messageId?: string;
      error?: string;
    }>;
  }> {
    try {
      logger.info('Processing bulk marketing templates', {
        campaignId,
        recipientCount: recipients.length
      });

      const results = [];
      let processed = 0;
      let failed = 0;

      // Process recipients in batches to avoid overwhelming the API
      const batchSize = 10;
      for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (recipient) => {
          try {
            const result = await this.processMarketingTemplateJob({
              campaignId,
              mrId: recipient.mrId,
              phoneNumber: recipient.phoneNumber,
              templateName: recipient.templateName,
              templateLanguage: recipient.templateLanguage,
              templateParameters: recipient.templateParameters,
              imageUrl: recipient.imageUrl
            });

            if (result.success) {
              processed++;
            } else {
              failed++;
            }

            return {
              mrId: recipient.mrId,
              success: result.success,
              messageId: result.messageId,
              error: result.error
            };
          } catch (error: any) {
            failed++;
            return {
              mrId: recipient.mrId,
              success: false,
              error: error.message
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to respect rate limits
        if (i + batchSize < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      logger.info('Bulk marketing templates processing completed', {
        campaignId,
        total: recipients.length,
        processed,
        failed
      });

      return {
        success: true,
        processed,
        failed,
        results
      };

    } catch (error: any) {
      logger.error('Error processing bulk marketing templates', {
        error: error.message,
        campaignId,
        recipientCount: recipients.length
      });

      return {
        success: false,
        processed: 0,
        failed: recipients.length,
        results: recipients.map(r => ({
          mrId: r.mrId,
          success: false,
          error: error.message
        }))
      };
    }
  }

  /**
   * Update campaign statistics after processing
   */
  static async updateCampaignStatistics(campaignId: string): Promise<void> {
    try {
      // Get campaign
      const campaign = await Campaign.findOne({ campaignId: campaignId });
      if (!campaign) {
        logger.warn('Campaign not found for statistics update', { campaignId });
        return;
      }

      // Get message logs for this campaign
      const messageLogs = await MessageLog.find({ campaignId: campaign._id });

      // Calculate statistics
      const totalCount = messageLogs.length;
      const sentCount = messageLogs.filter(log => 
        log.status === 'sent' || log.status === 'delivered' || log.status === 'read'
      ).length;
      const failedCount = messageLogs.filter(log => log.status === 'failed').length;
      const pendingCount = totalCount - sentCount - failedCount;

      // Determine campaign status
      const status = pendingCount > 0 ? 'sending' : 
                    failedCount === totalCount ? 'failed' : 'completed';

      // Update campaign
      await Campaign.findOneAndUpdate(
        { campaignId: campaignId },
        {
          sentCount,
          failedCount,
          pendingCount,
          status,
          ...(status === 'completed' && { completedAt: new Date() })
        }
      );

      logger.info('Campaign statistics updated', {
        campaignId,
        totalCount,
        sentCount,
        failedCount,
        pendingCount,
        status
      });

    } catch (error: any) {
      logger.error('Error updating campaign statistics', {
        error: error.message,
        campaignId
      });
    }
  }
}

export default new QueueMarketingEnhancedService();
