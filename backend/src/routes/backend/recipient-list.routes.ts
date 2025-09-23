import express from 'express';
import { authenticateToken, requireRole } from '../../middleware/auth.middleware';
import recipientListController from '../../controllers/backend/recipient-list.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Regular recipient list routes
router.get('/', recipientListController.getRecipientLists);
router.get('/parameters', recipientListController.getAvailableParameters);
router.get('/:id', recipientListController.getRecipientList);
router.post('/', recipientListController.createRecipientList);
router.post('/upload', recipientListController.uploadRecipientList);
router.put('/:id', recipientListController.updateRecipientList);
router.delete('/:id', recipientListController.deleteRecipientList);

// Template recipients routes
router.post('/template/upload', recipientListController.uploadTemplateRecipients);
router.post('/template/upload-v2', recipientListController.uploadTemplateRecipientsV2);
router.get('/template/:templateId', recipientListController.getTemplateRecipients);
router.delete('/template/:id', recipientListController.deleteTemplateRecipients);

export default router;
