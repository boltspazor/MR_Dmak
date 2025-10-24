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
import { CampaignProgressController } from '../controllers/campaign-progress.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get campaign progress with real-time status
router.get('/:campaignId', CampaignProgressController.getCampaignProgress);

// Get real-time message status from WhatsApp Cloud API
router.get('/message/:messageId/status', CampaignProgressController.getMessageStatus);

// Update message status from webhook (no auth required for webhooks)
router.post('/webhook/status', CampaignProgressController.updateMessageStatus);

// Get all campaigns with progress summary
router.get('/', CampaignProgressController.getAllCampaignsProgress);

// Get detailed message list by status for a campaign
router.get('/:campaignId/messages', CampaignProgressController.getCampaignMessageDetails);

export default router;
