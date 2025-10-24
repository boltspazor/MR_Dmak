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
import metaTemplateController from '../../controllers/meta/meta-template.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

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

// Template management routes
router.delete('/:id', metaTemplateController.deleteTemplate);
router.post('/update-image-url', metaTemplateController.updateTemplateImageUrl);

export default router;
