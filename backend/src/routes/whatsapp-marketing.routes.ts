import { Router } from 'express';
import { WhatsAppWebhookEnhancedController } from '../controllers/whatsapp-webhook-enhanced.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import whatsappMarketingService from '../services/whatsapp-marketing.service';
import logger from '../utils/logger';

const router = Router();

/**
 * @route GET /api/whatsapp-marketing/webhook
 * @desc Webhook verification endpoint for WhatsApp Cloud API
 * @access Public (no auth required for webhook verification)
 */
router.get('/webhook', WhatsAppWebhookEnhancedController.verifyWebhook);

/**
 * @route POST /api/whatsapp-marketing/webhook
 * @desc Webhook event handler for WhatsApp Cloud API
 * @access Public (no auth required for webhook events)
 */
router.post('/webhook', WhatsAppWebhookEnhancedController.handleWebhook);

/**
 * @route POST /api/whatsapp-marketing/send-template
 * @desc Send a marketing template message with enhanced tracking
 * @access Private
 */
router.post('/send-template', authenticateToken, async (req, res) => {
  try {
    const { 
      to, 
      templateName, 
      templateLanguage = 'en_US', 
      parameters = [], 
      campaignId, 
      mrId 
    } = req.body;

    if (!to || !templateName) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and template name are required'
      });
    }

    logger.info('Sending marketing template message', {
      to,
      templateName,
      templateLanguage,
      parametersCount: parameters.length,
      campaignId,
      mrId
    });

    const result = await whatsappMarketingService.sendMarketingTemplateMessage(
      to,
      templateName,
      templateLanguage,
      parameters,
      campaignId,
      mrId
    );

    if (result.success) {
      return res.json({
        success: true,
        message: 'Marketing template message sent successfully',
        data: {
          messageId: result.messageId,
          response: result.data
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to send template message'
      });
    }
  } catch (error: any) {
    logger.error('Error sending marketing template message', {
      error: error.message,
      body: req.body
    });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/whatsapp-marketing/subscribe-webhooks
 * @desc Subscribe to WhatsApp webhook events
 * @access Private
 */
router.post('/subscribe-webhooks', authenticateToken, async (req, res) => {
  try {
    const success = await whatsappMarketingService.subscribeToWebhooks();
    
    if (success) {
      return res.json({
        success: true,
        message: 'Webhook subscription successful',
        config: whatsappMarketingService.getWebhookSubscriptionConfig()
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Failed to subscribe to webhooks'
      });
    }
  } catch (error: any) {
    logger.error('Error subscribing to webhooks', {
      error: error.message
    });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/whatsapp-marketing/webhook-config
 * @desc Get webhook configuration information
 * @access Private
 */
router.get('/webhook-config', authenticateToken, (req, res) => {
  try {
    const config = whatsappMarketingService.getWebhookSubscriptionConfig();
    
    return res.json({
      success: true,
      data: {
        webhook: {
          endpoint: '/api/whatsapp-marketing/webhook',
          verification: 'GET /api/whatsapp-marketing/webhook',
          events: 'POST /api/whatsapp-marketing/webhook',
          subscribedFields: config.fields
        },
        config
      }
    });
  } catch (error: any) {
    logger.error('Error getting webhook config', {
      error: error.message
    });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/whatsapp-marketing/status
 * @desc Get WhatsApp marketing service status
 * @access Private
 */
router.get('/status', authenticateToken, (req, res) => {
  try {
    const config = whatsappMarketingService.getWebhookSubscriptionConfig();
    
    return res.json({
      success: true,
      data: {
        status: 'OK',
        service: 'WhatsApp Marketing Service',
        webhook: {
          endpoint: '/api/whatsapp-marketing/webhook',
          verification: 'GET /api/whatsapp-marketing/webhook',
          events: 'POST /api/whatsapp-marketing/webhook',
          subscribedFields: config.fields
        },
        features: [
          'Marketing template messages',
          'Message status tracking',
          'User opt-out handling',
          'Template status updates',
          'Phone quality monitoring',
          'Webhook event processing'
        ],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error('Error getting service status', {
      error: error.message
    });
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
