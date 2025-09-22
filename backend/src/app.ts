import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

import authRoutes from './routes/auth.routes';
import mrRoutes from './routes/mr.routes';
import groupRoutes from './routes/group.routes';
import messageRoutes from './routes/message.routes';
import reportRoutes from './routes/report.routes';
import superAdminRoutes from './routes/super-admin.routes';
import templateRoutes from './routes/template.routes';
import recipientListRoutes from './routes/recipientList.routes';
import templateRecipientsRoutes from './routes/templateRecipients.routes';
import whatsappCloudRoutes from './routes/whatsapp-cloud.routes';
import metaTemplateRoutes from './routes/meta-template.routes';
import templateCampaignRoutes from './routes/template-campaign.routes';
import cacheRoutes from './routes/cache.routes';

import logger from './utils/logger';
import connectDB from './config/database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Railway deployment (fixes rate limiting issue)
app.set('trust proxy', 1);

// Create necessary directories
const dirs = ['uploads', 'logs'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://mrfrontend-production.up.railway.app',
    'https://mrfrontend-production.up.railway.app/',
  ],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Rate limiting for auth endpoints (more lenient in development)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 50, // 50 requests in development, 5 in production
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/mrs', mrRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/recipient-lists', recipientListRoutes);
app.use('/api/template-recipients', templateRecipientsRoutes);
app.use('/api/whatsapp-cloud', whatsappCloudRoutes);
app.use('/api/meta-templates', metaTemplateRoutes);
app.use('/api/template-campaigns', templateCampaignRoutes);
app.use('/api/cache', cacheRoutes);

// WhatsApp Cloud API Webhook

// Webhook verification endpoint (GET) for WhatsApp Cloud API
app.get('/api/webhook', async (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  logger.info('WhatsApp Cloud API webhook verification request', { 
    mode, 
    token: token ? `${(token as string).substring(0, 4)}...` : 'undefined',
    challenge: challenge ? `${(challenge as string).substring(0, 4)}...` : 'undefined',
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  try {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    
    if (mode === 'subscribe' && token === verifyToken) {
      logger.info('WhatsApp Cloud API webhook verification successful', { 
        challenge: challenge ? `${(challenge as string).substring(0, 4)}...` : 'undefined',
        ip: req.ip
      });
      return res.status(200).send(challenge);
    } else {
      logger.warn('WhatsApp Cloud API webhook verification failed', { 
        mode, 
        token: token ? `${(token as string).substring(0, 4)}...` : 'undefined',
        hasVerifyToken: !!verifyToken,
        ip: req.ip
      });
      return res.status(403).send('Forbidden');
    }
  } catch (error) {
    logger.error('WhatsApp Cloud API webhook verification error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      mode, 
      token: token ? `${(token as string).substring(0, 4)}...` : 'undefined',
      ip: req.ip
    });
    return res.status(500).send('Internal Server Error');
  }
});

// Webhook event processing endpoint (POST) for WhatsApp Cloud API
app.post('/api/webhook', async (req, res) => {
  const startTime = Date.now();
  
  logger.info('WhatsApp Cloud API webhook event received', { 
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    bodySize: JSON.stringify(req.body).length
  });

  try {
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      logger.warn('Invalid webhook payload', { 
        body: req.body,
        ip: req.ip
      });
      return res.status(400).send('Bad Request');
    }

    // Process WhatsApp Cloud API webhook event
    if (req.body.object === 'whatsapp_business_account') {
      req.body.entry?.forEach((entry: any) => {
        entry.changes?.forEach((change: any) => {
          if (change.field === 'messages') {
            logger.info('WhatsApp Cloud API message event received', {
              messageCount: change.value.messages?.length || 0,
              statusCount: change.value.statuses?.length || 0
            });
            // Here you can process message events, status updates, etc.
          }
        });
      });
    }

    const processingTime = Date.now() - startTime;
    logger.info('WhatsApp Cloud API webhook event processed', { 
      processingTime: `${processingTime}ms`,
      ip: req.ip
    });

    return res.status(200).send('OK');
  } catch (error) {
    logger.error('Webhook event processing error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      body: req.body
    });
    return res.status(500).send('Internal Server Error');
  }
});

// Health check
app.get('/api/health', (req, res) => {
  return res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Webhook status endpoint
app.get('/api/webhook/status', (req, res) => {
  const whatsappConfig = {
    hasAccessToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
    hasPhoneNumberId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
    hasVerifyToken: !!process.env.WHATSAPP_VERIFY_TOKEN,
    apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0'
  };

  return res.json({
    status: 'OK',
    webhook: {
      endpoint: '/api/webhook',
      verification: 'GET /api/webhook',
      events: 'POST /api/webhook',
      configured: whatsappConfig.hasAccessToken && whatsappConfig.hasPhoneNumberId && whatsappConfig.hasVerifyToken
    },
    whatsapp: whatsappConfig,
    timestamp: new Date().toISOString()
  });
});

// API documentation
app.get('/api', (req, res) => {
  return res.json({
    message: 'MR Communication Tool API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      mrs: '/api/mrs',
      groups: '/api/groups',
      messages: '/api/messages',
      reports: '/api/reports',
      superAdmin: '/api/super-admin',
      templates: '/api/templates',
      recipientLists: '/api/recipient-lists',
      whatsapp: {
        base: '/api/whatsapp',
        recipients: '/api/whatsapp/allowed-recipients',
        sendMessage: 'POST /api/whatsapp/send-message',
        sendBulk: 'POST /api/whatsapp/send-bulk-messages',
        sendToAll: 'POST /api/whatsapp/send-to-all',
        testConnection: 'GET /api/whatsapp/test-connection'
      },
      webhook: {
        verification: 'GET /api/webhook',
        events: 'POST /api/webhook',
        status: 'GET /api/webhook/status'
      },
      health: '/api/health'
    },
    webhook: {
      description: 'WhatsApp Business API webhook endpoints',
      verification: 'Handles Meta webhook verification challenge',
      events: 'Processes incoming WhatsApp events and messages',
      status: 'Shows webhook configuration status'
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'File too large' });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File size exceeds limit' });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected file field' });
  }

  return res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  return res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API: http://localhost:${PORT}/api`);
      logger.info(`📊 Health: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;