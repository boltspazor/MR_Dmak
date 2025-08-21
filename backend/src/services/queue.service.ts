import Bull from 'bull';
import { WhatsAppService } from './whatsapp.service';
import logger from '../utils/logger';
import prisma from '../config/database';

const whatsappService = new WhatsAppService();

export const messageQueue = new Bull('message queue', {
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

interface MessageJobData {
  campaignId: string;
  mrId: string;
  phoneNumber: string;
  content: string;
  imageUrl?: string;
}

messageQueue.process('send-message', async (job) => {
  const { campaignId, mrId, phoneNumber, content, imageUrl }: MessageJobData = job.data;
  
  try {
    logger.info('Processing message job', { campaignId, mrId, phoneNumber });
    
    const whatsappMessage = {
      to: phoneNumber,
      type: imageUrl ? 'image' : 'text' as 'text' | 'image',
      ...(imageUrl ? {
        image: { link: imageUrl, caption: content }
      } : {
        text: { body: content }
      })
    };

    const result = await whatsappService.sendMessage(whatsappMessage);
    
    await prisma.messageLog.updateMany({
      where: { campaignId, mrId },
      data: {
        status: result.success ? 'sent' : 'failed',
        sentAt: new Date(),
        errorMessage: result.error,
      },
    });

    logger.info('Message processed successfully', {
      campaignId,
      mrId,
      success: result.success
    });

    return result;
  } catch (error: any) {
    await prisma.messageLog.updateMany({
      where: { campaignId, mrId },
      data: {
        status: 'failed',
        errorMessage: error.message,
      },
    });
    
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
  return await messageQueue.add('send-message', data, {
    delay: delay || 0,
  });
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