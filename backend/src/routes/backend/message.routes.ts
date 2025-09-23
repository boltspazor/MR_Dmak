import { Router } from 'express';
import { MessageController } from '../../controllers/backend/message.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { upload } from '../../middleware/upload.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { schemas } from '../../utils/validation';

const router = Router();
const messageController = new MessageController();

router.use(authenticateToken);

router.post('/send', validateRequest(schemas.message.send), messageController.sendMessage);
router.post('/campaigns', upload.any(), messageController.createCampaign);
router.post('/upload-image', upload.single('image'), messageController.uploadImage);
router.get('/campaigns', messageController.getAllCampaigns);
router.get('/campaigns/stats', messageController.getCampaignStats);
router.get('/campaign/:campaignId/report', messageController.getCampaignReport);

export default router;