import { Router } from 'express';
import { WebhookController } from '../controllers/backend/webhook.controller';

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

export default router;
