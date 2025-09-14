import { Router } from 'express';
import { WhatsAppController } from '../controllers/whatsapp.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const whatsappController = new WhatsAppController();

router.use(authenticateToken);

// WhatsApp allowed recipients management routes
router.get('/allowed-recipients', whatsappController.getAllowedRecipients);
router.post('/allowed-recipients/add', whatsappController.addAllowedRecipient);
router.post('/allowed-recipients/add-multiple', whatsappController.addAllowedRecipients);
router.post('/allowed-recipients/remove', whatsappController.removeAllowedRecipient);
router.post('/allowed-recipients/remove-multiple', whatsappController.removeAllowedRecipients);

export default router;
