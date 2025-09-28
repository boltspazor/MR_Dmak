import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Backend routes
import {
  authRoutes,
  mrRoutes,
  groupRoutes,
  messageRoutes,
  reportRoutes,
  superAdminRoutes,
  templateRoutes,
  recipientListRoutes,
  templateCampaignRoutes,
  campaignRoutes,
  campaignProgressRoutes,
  cacheRoutes,
  consentRoutes
} from './routes/backend';

// Meta routes
import {
  whatsappCloudRoutes,
  metaTemplateRoutes
} from './routes/meta';

// WhatsApp Marketing routes
import whatsappMarketingRoutes from './routes/whatsapp-marketing.routes';

// Webhook routes
import webhookRoutes from './routes/webhook.routes';

import logger from './utils/logger';
import connectDB from './config/database';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { config } from './config/app.config';

// Load environment variables
dotenv.config();

const app = express();

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
  origin: config.cors.origins,
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Rate limiting for auth endpoints (more lenient in development)
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.nodeEnv === 'production' ? 5 : 50,
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
app.use('/api/whatsapp-cloud', whatsappCloudRoutes);
app.use('/api/meta-templates', metaTemplateRoutes);
app.use('/api/template-campaigns', templateCampaignRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/campaign-progress', campaignProgressRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/whatsapp-marketing', whatsappMarketingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  return res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: config.nodeEnv
  });
});

// Webhook status endpoint available at /api/webhook/status

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
app.use(errorHandler);

// 404 handler
app.use('*', notFoundHandler);

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
    
    app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📱 Environment: ${config.nodeEnv}`);
      logger.info(`🔗 API: http://localhost:${config.port}/api`);
      logger.info(`📊 Health: http://localhost:${config.port}/api/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;