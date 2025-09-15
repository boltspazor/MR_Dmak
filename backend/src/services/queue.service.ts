import Bull from 'bull';
import { WhatsAppService } from './whatsapp.service';
import logger from '../utils/logger';
import MessageLog from '../models/MessageLog';

const whatsappService = new WhatsAppService();

// Create queue with error handling
let messageQueue: Bull.Queue;

try {
  messageQueue = new Bull('message queue', {
    redis: {
      port: parseInt(process.env.REDIS_PORT || '6379'),
      host: process.env.REDIS_HOST || 'localhost',
    },
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 50,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  });

  // Handle Redis connection errors
  messageQueue.on('error', (error) => {
    logger.error('Redis queue error:', error);
  });

  messageQueue.on('failed', (job, err) => {
    logger.error('Job failed:', { jobId: job.id, error: err.message });
  });

} catch (error) {
  logger.error('Failed to create message queue:', error);
  // Create a mock queue for development
  messageQueue = {
    add: async (jobName: string, data: any) => {
      logger.warn('Redis not available, processing message immediately');
      await processMessageDirectly(data);
    },
    process: () => {},
    on: () => {},
  } as any;
}

interface MessageJobData {
  campaignId: string;
  mrId: string;
  phoneNumber: string;
  content: string;
  imageUrl?: string;
  messageType?: 'text' | 'image' | 'template';
  templateName?: string;
  templateLanguage?: string;
  templateParameters?: Array<{ type: string; text: string }>;
}

// Direct message processing function for when Redis is not available
async function processMessageDirectly(data: MessageJobData) {
  const { campaignId, mrId, phoneNumber, content, imageUrl, messageType, templateName, templateLanguage, templateParameters } = data;
  
  try {
    logger.info('Processing message directly', { campaignId, mrId, phoneNumber, messageType });
    
    let whatsappMessage;
    
    if (messageType === 'template' && templateName) {
      // Create template message
      whatsappMessage = whatsappService.createTemplateMessage(
        phoneNumber, 
        templateName, 
        templateLanguage || 'en_US', 
        templateParameters
      );
    } else if (imageUrl) {
      // Create image message
      whatsappMessage = {
        to: phoneNumber,
        type: 'image' as 'text' | 'image' | 'template',
        image: { link: imageUrl, caption: content }
      };
    } else {
      // For unverified numbers, we need to use templates
      // But since hello_world doesn't accept custom content, we'll use text messages
      // and handle the verification error gracefully
      whatsappMessage = whatsappService.createTextMessage(phoneNumber, content);
    }

    const result = await whatsappService.sendMessage(whatsappMessage);
    
    await MessageLog.updateMany(
      { campaignId, mrId },
      {
        status: result.success ? 'sent' : 'failed',
        sentAt: new Date(),
        errorMessage: result.error,
      }
    );

    // Update campaign statistics
    const MessageCampaign = (await import('../models/MessageCampaign')).default;
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

      await MessageCampaign.findByIdAndUpdate(campaignId, {
        sentCount: stats.sentCount,
        failedCount: stats.failedCount,
        status: status
      });
    }

    logger.info('Message processed successfully', {
      campaignId,
      mrId,
      success: result.success
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

    logger.error('Failed to process message directly', {
      campaignId,
      mrId,
      error: error.message
    });

    throw error;
  }
}

messageQueue.process('send-message', async (job) => {
  const { campaignId, mrId, phoneNumber, content, imageUrl, messageType, templateName, templateLanguage, templateParameters }: MessageJobData = job.data;
  
  try {
    logger.info('Processing message job', { campaignId, mrId, phoneNumber, messageType });
    
    let whatsappMessage;
    
    if (messageType === 'template' && templateName) {
      // Create template message
      whatsappMessage = whatsappService.createTemplateMessage(
        phoneNumber, 
        templateName, 
        templateLanguage || 'en_US', 
        templateParameters
      );
    } else if (imageUrl) {
      // Create image message
      whatsappMessage = {
        to: phoneNumber,
        type: 'image' as 'text' | 'image' | 'template',
        image: { link: imageUrl, caption: content }
      };
    } else {
      // For unverified numbers, we need to use templates
      // But since hello_world doesn't accept custom content, we'll use text messages
      // and handle the verification error gracefully
      whatsappMessage = whatsappService.createTextMessage(phoneNumber, content);
    }

    const result = await whatsappService.sendMessage(whatsappMessage);
    
    await MessageLog.updateMany(
      { campaignId, mrId },
      {
        status: result.success ? 'sent' : 'failed',
        sentAt: new Date(),
        errorMessage: result.error,
      }
    );

    // Update campaign statistics
    const MessageCampaign = (await import('../models/MessageCampaign')).default;
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

      await MessageCampaign.findByIdAndUpdate(campaignId, {
        sentCount: stats.sentCount,
        failedCount: stats.failedCount,
        status: status
      });
    }

    logger.info('Message processed successfully', {
      campaignId,
      mrId,
      success: result.success
    });

    return result;
  } catch (error: any) {
    await MessageLog.updateMany(
      { campaignId, mrId },
      {
        status: 'failed',
        errorMessage: error.message,
      }
    );
    
    logger.error('Message processing failed', {
      campaignId,
      mrId,
      error: error.message
    });
    
    throw error;
  }
});

messageQueue.on('completed', (job) => {
  logger.info('Message job completed', { jobId: job.id });
});

messageQueue.on('failed', (job, err) => {
  logger.error('Message job failed', { jobId: job.id, error: err.message });
});

messageQueue.on('stalled', (job) => {
  logger.warn('Message job stalled', { jobId: job.id });
});

export const addMessageToQueue = async (data: MessageJobData, delay?: number) => {
  try {
    logger.info('🚀 Adding message to queue', { 
      campaignId: data.campaignId,
      mrId: data.mrId,
      phoneNumber: data.phoneNumber,
      delay: delay || 0
    });
    
    const result = await messageQueue.add('send-message', data, {
      delay: delay || 0,
    });
    
    logger.info('✅ Message added to queue successfully', { 
      jobId: result.id,
      campaignId: data.campaignId,
      mrId: data.mrId
    });
    
    return result;
  } catch (error) {
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
  delay?: number
) => {
  const data: MessageJobData = {
    campaignId,
    mrId,
    phoneNumber,
    content: '', // Not used for templates
    messageType: 'template',
    templateName,
    templateLanguage,
    templateParameters
  };

  return addMessageToQueue(data, delay);
};

export const getQueueStats = async () => {
  const waiting = await messageQueue.getWaiting();
  const active = await messageQueue.getActive();
  const completed = await messageQueue.getCompleted();
  const failed = await messageQueue.getFailed();

  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
  };
};