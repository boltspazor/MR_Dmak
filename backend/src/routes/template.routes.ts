import { Router } from 'express';
import { TemplateController } from '../controllers/template.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { schemas } from '../utils/validation';

const router = Router();
const templateController = new TemplateController();

// All routes require authentication
router.use(authenticateToken);

// Template CRUD operations
router.get('/', templateController.getTemplates);
router.get('/stats', templateController.getTemplateStats);
router.get('/export', templateController.exportTemplates);
router.get('/:id', templateController.getTemplateById);
router.post('/', validateRequest(schemas.template.create), templateController.createTemplate);
router.put('/:id', validateRequest(schemas.template.update), templateController.updateTemplate);
router.delete('/:id', templateController.deleteTemplate);

// File upload for template images
router.post('/upload-image', upload.single('image'), templateController.uploadTemplateImage);

export default router;
