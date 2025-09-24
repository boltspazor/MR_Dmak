import { AppConfig } from '../types/common';

export const config: AppConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mr-communication'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  whatsapp: {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
    apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v19.0'
  },
  
  cors: {
    origins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://mrfrontend-production.up.railway.app',
      'https://mrfrontend-production.up.railway.app/',
      ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
    ]
  },
  
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 1000
  }
};

export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
export const isTest = config.nodeEnv === 'test';
