import { Router } from 'express';
import whatsappCloudController from '../controllers/whatsapp-cloud.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route POST /api/whatsapp-cloud/send-message
 * @desc Send a single text message
 * @access Private
 */
router.post('/send-message', whatsappCloudController.sendSingleMessage);

/**
 * @route POST /api/whatsapp-cloud/send-template
 * @desc Send a template message with parameters
 * @access Private
 */
router.post('/send-template', whatsappCloudController.sendTemplateMessage);

/**
 * @route POST /api/whatsapp-cloud/send-image
 * @desc Send an image message
 * @access Private
 */
router.post('/send-image', whatsappCloudController.sendImageMessage);

/**
 * @route POST /api/whatsapp-cloud/build-message
 * @desc Build a personalized message from template
 * @access Private
 */
router.post('/build-message', whatsappCloudController.buildMessage);

/**
 * @route POST /api/whatsapp-cloud/send-bulk
 * @desc Send bulk messages to multiple recipients
 * @access Private
 */
router.post('/send-bulk', whatsappCloudController.sendBulkMessages);

/**
 * @route GET /api/whatsapp-cloud/message-status/:messageId
 * @desc Get message delivery status
 * @access Private
 */
router.get('/message-status/:messageId', whatsappCloudController.getMessageStatus);

/**
 * @route GET /api/whatsapp-cloud/webhook-info
 * @desc Get webhook configuration information
 * @access Private
 */
router.get('/webhook-info', whatsappCloudController.getWebhookInfo);

/**
 * @route GET|POST /api/whatsapp-cloud/webhook
 * @desc Webhook endpoint for WhatsApp messages and status updates
 * @access Public (no auth required for webhook)
 */
router.get('/webhook', whatsappCloudController.webhook);
router.post('/webhook', whatsappCloudController.webhook);

export default router;
