import { Router } from 'express';
import metaTemplateController from '../controllers/meta-template.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Template synchronization routes
router.post('/sync', metaTemplateController.syncTemplates);
router.get('/sync/:metaTemplateId', metaTemplateController.syncSpecificTemplate);

// URL generation routes
router.get('/meta-urls/creation', metaTemplateController.getMetaTemplateCreationUrl);
router.get('/meta-urls/business-manager', metaTemplateController.getMetaBusinessManagerUrl);

// Template retrieval routes
router.get('/status-summary', metaTemplateController.getTemplateStatusSummary);
router.get('/all', metaTemplateController.getAllTemplates);
router.get('/meta', metaTemplateController.getMetaTemplates);

export default router;
