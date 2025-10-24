/**
 * @swagger
 * /user:
 *   get:
 *     summary: Get user information
 *     responses:
 *       200:
 *         description: Successfully retrieved user data
 */
import 'swagger-jsdoc';
import { Router } from 'express';
import { WebhookController } from '../controllers/backend/webhook.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route GET /api/webhook
 * @desc Webhook verification endpoint for WhatsApp Cloud API
 * @access Public (no auth required for webhook verification)
 */
router.get('/', WebhookController.verifyWebhook);

/**
 * @route POST /api/webhook
 * @desc Webhook event handler for WhatsApp Cloud API
 * @access Public (no auth required for webhook events)
 */
router.post('/', WebhookController.handleWebhook);

/**
 * @route GET /api/webhook/status
 * @desc Get webhook configuration status
 * @access Public
 */
router.get('/status', (req, res) => {
  const whatsappConfig = {
    hasAccessToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
    hasPhoneNumberId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
    hasVerifyToken: !!process.env.WHATSAPP_VERIFY_TOKEN,
    apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v19.0'
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

/**
 * @route GET /api/webhook/data
 * @desc Get webhook data for display with filtering options
 * @access Private
 */
router.get('/data', authenticateToken, WebhookController.getWebhookData);

/**
 * @route POST /api/webhook/test
 * @desc Test webhook logging for message sending
 * @access Private
 */
router.post('/test', authenticateToken, WebhookController.testWebhookLogging);

export default router;
