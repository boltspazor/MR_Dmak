import Bull from 'bull';
import whatsappCloudAPIService from './whatsapp-cloud-api.service';
import logger from '../utils/logger';
import MessageLog from '../models/MessageLog';

// Create queue with error handling
let messageQueue: Bull.Queue | any;
let redisAvailable = false;

// Check if Redis is available
const checkRedisAvailability = async () => {
  try {
    const testQueue = new Bull('message queue', "redis://default:EKbrullKNdJjgxJWFvunVTnmZKKbGQjJ@interchange.proxy.rlwy.net:43926")
    
    await testQueue.isReady();
    await testQueue.close();
    return true;
  } catch (error) {
    logger.warn('Redis not available, using direct processing mode');
    return false;
  }
};

// Initialize queue based on Redis availability
const initializeQueue = async () => {
  redisAvailable = await checkRedisAvailability();
  
  if (redisAvailable) {
    try {
      messageQueue = new Bull('message queue', "redis://default:EKbrullKNdJjgxJWFvunVTnmZKKbGQjJ@interchange.proxy.rlwy.net:43926", {
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
          attempts: 1, // Reduce to 1 attempt since WhatsApp API already confirms success
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
        },
      });

      // Handle Redis connection errors
      messageQueue.on('error', (error: any) => {
        logger.error('Redis queue error:', error);
        redisAvailable = false;
      });

      messageQueue.on('failed', (job: any, err: any) => {
        logger.error('Job failed:', { jobId: job.id, error: err.message });
      });

      logger.info('✅ Redis queue initialized successfully');
      
      // Set up queue processing
      messageQueue.process('send-message', async (job: any) => {
        const { campaignId, mrId, phoneNumber, content, imageUrl, messageType, templateName, templateLanguage, templateParameters }: MessageJobData = job.data;
        
        try {
          let result;
          
          if (messageType === 'template' && templateName) {
            logger.info('Processing template message job with WhatsApp Cloud API', { campaignId, mrId, phoneNumber, templateName });
            
            // Send template message using WhatsApp Cloud API
            // Convert templateParameters to named parameter format expected by WhatsApp API
            let processedParameters: Array<{name: string, value: string}> = [];
            if (templateParameters) {
              if (Array.isArray(templateParameters)) {
                // Check if it's an array of objects with name and value properties
                if (templateParameters.length > 0 && typeof templateParameters[0] === 'object' && 'name' in templateParameters[0]) {
                  // New format: array of {name, value} objects
                  processedParameters = templateParameters.map((param: any) => ({
                    name: param.name,
                    value: param.value || param.text || String(param)
                  }));
                } else {
                  // Legacy format: array of parameter names or values
                  processedParameters = templateParameters.map((param: any, index: number) => ({
                    name: `param_${index + 1}`,
                    value: typeof param === 'string' ? param : String(param)
                  }));
                }
              } else if (typeof templateParameters === 'object') {
                // If it's an object with parameter names as keys and values as values
                processedParameters = Object.entries(templateParameters).map(([paramName, paramValue]) => ({
                  name: paramName,
                  value: String(paramValue)
                }));
              }
            }
            
            // Debug logging to see exactly what parameters are being sent
            logger.info('🔍 Template parameters debug', {
              originalTemplateParameters: templateParameters,
              processedParameters: processedParameters,
              parametersCount: processedParameters.length,
              templateName,
              imageUrl: imageUrl,
              hasImageUrl: !!imageUrl,
              imageUrlLength: imageUrl ? imageUrl.length : 0
            });
            
            result = await whatsappCloudAPIService.sendTemplateMessage(
              phoneNumber,
              templateName,
              processedParameters,
              templateLanguage || 'en_US',
              imageUrl // Pass the template image URL
            );
          } else if (imageUrl) {
            logger.info('Processing image message job with WhatsApp Cloud API', { campaignId, mrId, phoneNumber, imageUrl });
            // Send image message using WhatsApp Cloud API
            result = await whatsappCloudAPIService.sendImageMessage(
              phoneNumber,
              imageUrl,
              content
            );
          } else {
            logger.info('Processing text message job with WhatsApp Cloud API', { campaignId, mrId, phoneNumber });
            // Send text message using WhatsApp Cloud API
            result = await whatsappCloudAPIService.sendTextMessage(phoneNumber, content);
          }
          
          await MessageLog.updateMany(
            { campaignId, mrId },
            {
              status: result.messages && result.messages[0]?.message_status === 'accepted' ? 'sent' : 'failed',
              messageId: result.messages?.[0]?.id,
              sentAt: new Date(),
              errorMessage: result.messages && result.messages[0]?.message_status === 'accepted' ? null : 'Message not accepted by WhatsApp',
            }
          );

          // Update campaign statistics
          const Campaign = (await import('../models/Campaign')).default;
          const campaignStats = await MessageLog.aggregate([
            { $match: { campaignId } },
            {
              $group: {
                _id: null,
                totalCount: { $sum: 1 },
                sentCount: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
                failedCount: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
                pendingCount: { $sum: { $cond: [{ $in: ['$status', ['queued', 'pending']] }, 1, 0] } }
              }
            }
          ]);

          if (campaignStats.length > 0) {
            const stats = campaignStats[0];
            const status = stats.pendingCount > 0 ? 'sending' : 
                          stats.failedCount === stats.totalCount ? 'failed' : 'completed';

            await Campaign.findByIdAndUpdate(campaignId, {
              sentCount: stats.sentCount,
              failedCount: stats.failedCount,
              pendingCount: stats.pendingCount,
              status: status,
              ...(status === 'completed' && { completedAt: new Date() })
            });
          }

          const isSuccess = result.messages && result.messages[0]?.message_status === 'accepted';
          logger.info(`${messageType === 'template' ? 'Template' : messageType === 'image' ? 'Image' : 'Text'} message processed successfully`, {
            campaignId,
            mrId,
            success: isSuccess,
            messageType,
            messageId: result.messages?.[0]?.id
          });

          // If WhatsApp API returned success, don't retry even if there are other errors
          if (isSuccess) {
            return result;
          } else {
            throw new Error(`WhatsApp message not accepted: ${result.messages?.[0]?.message_status || 'unknown status'}`);
          }
        } catch (error: any) {
          await MessageLog.updateMany(
            { campaignId, mrId },
            {
              status: 'failed',
              errorMessage: error.message,
            }
          );
          
          logger.error(`${messageType === 'template' ? 'Template' : messageType === 'image' ? 'Image' : 'Text'} message processing failed`, {
            campaignId,
            mrId,
            error: error.message,
            messageType
          });
          
          throw error;
        }
      });

      messageQueue.on('completed', (job: any) => {
        logger.info('Message job completed', { jobId: job.id });
      });

      messageQueue.on('failed', (job: any, err: any) => {
        logger.error('Message job failed', { jobId: job.id, error: err.message });
      });

      messageQueue.on('stalled', (job: any) => {
        logger.warn('Message job stalled', { jobId: job.id });
      });
      
    } catch (error) {
      logger.error('Failed to create message queue:', error);
      redisAvailable = false;
    }
  }
  
  if (!redisAvailable) {
    // Create a mock queue for when Redis is not available
    messageQueue = {
      add: async (jobName: string, data: any) => {
        logger.info('Processing message directly (Redis not available)');
        await processMessageDirectly(data);
      },
      process: () => {},
      on: () => {},
      getWaiting: async (): Promise<any[]> => [],
      getActive: async (): Promise<any[]> => [],
      getCompleted: async (): Promise<any[]> => [],
      getFailed: async (): Promise<any[]> => [],
    } as any;
    logger.info('✅ Direct processing mode initialized (Redis not available)');
  }
};

// Initialize the queue
initializeQueue();

interface MessageJobData {
  campaignId: string;
  mrId: string;
  phoneNumber: string;
  content: string;
  imageUrl?: string;
  messageType?: 'text' | 'image' | 'template';
  templateName?: string;
  templateLanguage?: string;
  templateParameters?: Array<{ name: string; value: string }> | Array<{ type: string; text: string }>;
}

// Direct message processing function for when Redis is not available
async function processMessageDirectly(data: MessageJobData) {
  const { campaignId, mrId, phoneNumber, content, imageUrl, messageType, templateName, templateLanguage, templateParameters } = data;
  
  try {
    let result;
    
    if (messageType === 'template' && templateName) {
      logger.info('Processing template message directly with WhatsApp Cloud API', { campaignId, mrId, phoneNumber, templateName });
      // Send template message using WhatsApp Cloud API
      // Convert templateParameters to named parameter format expected by WhatsApp API
      let processedParameters: Array<{name: string, value: string}> = [];
      if (templateParameters) {
        if (Array.isArray(templateParameters)) {
          // Check if it's an array of objects with name and value properties
          if (templateParameters.length > 0 && typeof templateParameters[0] === 'object' && 'name' in templateParameters[0]) {
            // New format: array of {name, value} objects
            processedParameters = templateParameters.map((param: any) => ({
              name: param.name,
              value: param.value || param.text || String(param)
            }));
          } else {
            // Legacy format: array of parameter names or values
            processedParameters = templateParameters.map((param: any, index: number) => ({
              name: `param_${index + 1}`,
              value: typeof param === 'string' ? param : String(param)
            }));
          }
        } else if (typeof templateParameters === 'object') {
          // If it's an object with parameter names as keys and values as values
          processedParameters = Object.entries(templateParameters).map(([paramName, paramValue]) => ({
            name: paramName,
            value: String(paramValue)
          }));
        }
      }
      
      result = await whatsappCloudAPIService.sendTemplateMessage(
        phoneNumber,
        templateName,
        processedParameters,
        templateLanguage || 'en_US',
        imageUrl // Pass the template image URL
      );
    } else if (imageUrl) {
      logger.info('Processing image message directly with WhatsApp Cloud API', { campaignId, mrId, phoneNumber, imageUrl });
      // Send image message using WhatsApp Cloud API
      result = await whatsappCloudAPIService.sendImageMessage(
        phoneNumber,
        imageUrl,
        content
      );
    } else {
      logger.info('Processing text message directly with WhatsApp Cloud API', { campaignId, mrId, phoneNumber });
      // Send text message using WhatsApp Cloud API
      result = await whatsappCloudAPIService.sendTextMessage(phoneNumber, content);
    }
    
    await MessageLog.updateMany(
      { campaignId, mrId },
      {
        status: result.messages && result.messages[0]?.message_status === 'accepted' ? 'sent' : 'failed',
        messageId: result.messages?.[0]?.id,
        sentAt: new Date(),
        errorMessage: result.messages && result.messages[0]?.message_status === 'accepted' ? null : 'Message not accepted by WhatsApp',
      }
    );

    // Update campaign statistics
    const Campaign = (await import('../models/Campaign')).default;
    const campaignStats = await MessageLog.aggregate([
      { $match: { campaignId } },
      {
        $group: {
          _id: null,
          totalCount: { $sum: 1 },
          sentCount: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
          failedCount: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          pendingCount: { $sum: { $cond: [{ $in: ['$status', ['queued', 'pending']] }, 1, 0] } }
        }
      }
    ]);

    if (campaignStats.length > 0) {
      const stats = campaignStats[0];
      const status = stats.pendingCount > 0 ? 'sending' : 
                    stats.failedCount === stats.totalCount ? 'failed' : 'completed';

      await Campaign.findByIdAndUpdate(campaignId, {
        sentCount: stats.sentCount,
        failedCount: stats.failedCount,
        pendingCount: stats.pendingCount,
        status: status,
        ...(status === 'completed' && { completedAt: new Date() })
      });
    }

    const isSuccess = result.messages && result.messages[0]?.message_status === 'accepted';
    logger.info(`${messageType === 'template' ? 'Template' : messageType === 'image' ? 'Image' : 'Text'} message processed successfully`, {
      campaignId,
      mrId,
      success: isSuccess,
      messageType,
      messageId: result.messages?.[0]?.id
    });

    return result;
  } catch (error: any) {
    await MessageLog.updateMany(
      { campaignId, mrId },
      {
        status: 'failed',
        sentAt: new Date(),
        errorMessage: error.message,
      }
    );

    logger.error(`Failed to process ${messageType === 'template' ? 'template' : messageType === 'image' ? 'image' : 'text'} message directly`, {
      campaignId,
      mrId,
      error: error.message,
      messageType
    });

    throw error;
  }
}


export const addMessageToQueue = async (data: MessageJobData, delay?: number) => {
  try {
    logger.info('🚀 Adding message to queue', { 
      campaignId: data.campaignId,
      mrId: data.mrId,
      phoneNumber: data.phoneNumber,
      delay: delay || 0,
      redisAvailable
    });
    
    if (!redisAvailable) {
      logger.info('Processing message directly (Redis not available)');
      await processMessageDirectly(data);
      return { id: 'direct-processing' };
    }
    
    const result = await messageQueue.add('send-message', data, {
      delay: delay || 0,
    });
    
    logger.info('✅ Message added to queue successfully', { 
      jobId: result.id,
      campaignId: data.campaignId,
      mrId: data.mrId
    });
    
    return result;
  } catch (error: any) {
    logger.error('❌ Failed to add message to queue', {
      error: error.message,
      campaignId: data.campaignId,
      mrId: data.mrId
    });
    throw error;
  }
};

// New method to add template messages to queue
export const addTemplateMessageToQueue = async (
  campaignId: string,
  mrId: string,
  phoneNumber: string,
  templateName: string,
  templateLanguage: string = 'en_US',
  templateParameters?: Array<{ type: string; text: string }>,
  templateImageUrl?: string,
  delay?: number
) => {
  const data: MessageJobData = {
    campaignId,
    mrId,
    phoneNumber,
    content: '', // Not used for templates
    imageUrl: templateImageUrl,
    messageType: 'template',
    templateName,
    templateLanguage,
    templateParameters
  };

  return addMessageToQueue(data, delay);
};

export const getQueueStats = async () => {
  if (!redisAvailable) {
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      mode: 'direct-processing'
    };
  }

  const waiting = await messageQueue.getWaiting();
  const active = await messageQueue.getActive();
  const completed = await messageQueue.getCompleted();
  const failed = await messageQueue.getFailed();

  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
    mode: 'redis-queue'
  };
};

export { messageQueue };