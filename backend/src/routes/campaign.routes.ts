import { Router } from 'express';
import { CampaignController } from '../controllers/campaign.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Campaign routes
router.post('/', CampaignController.createCampaign);
router.post('/with-mrs', CampaignController.createCampaignWithMRs);
router.get('/', CampaignController.getCampaigns);
router.get('/:campaignId', CampaignController.getCampaignById);
router.patch('/:campaignId/status', CampaignController.updateCampaignStatus);
router.delete('/:campaignId', CampaignController.deleteCampaign);

export default router;
