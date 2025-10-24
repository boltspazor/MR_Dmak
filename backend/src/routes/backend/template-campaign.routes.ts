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
import templateCampaignController from '../../controllers/backend/template-campaign.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route POST /api/template-campaigns
 * @desc Create a new template-based campaign
 * @access Private
 */
router.post('/', templateCampaignController.createTemplateCampaign);

/**
 * @route GET /api/template-campaigns
 * @desc Get all template-based campaigns
 * @access Private
 */
router.get('/', templateCampaignController.getTemplateCampaigns);

/**
 * @route GET /api/template-campaigns/:campaignId/report
 * @desc Get detailed report for a template campaign
 * @access Private
 */
router.get('/:campaignId/report', templateCampaignController.getTemplateCampaignReport);

export default router;
