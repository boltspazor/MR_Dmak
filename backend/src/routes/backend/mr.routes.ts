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
import { MRController } from '../../controllers/backend/mr.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { upload } from '../../middleware/upload.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { schemas } from '../../utils/validation';

const router = Router();
const mrController = new MRController();

router.use(authenticateToken);

router.post('/', validateRequest(schemas.mr.create), mrController.createMR);
router.post('/bulk-upload', upload.single('file'), mrController.bulkUpload);
router.get('/', mrController.getMRs);
router.get('/with-status', mrController.getMRsWithStatus);
router.get('/stats', mrController.getMRStats);
router.get('/export', mrController.exportMRs);
router.get('/search', mrController.searchMRs);
router.put('/:id', validateRequest(schemas.mr.update), mrController.updateMR);
router.put('/:id/status', mrController.updateMRStatus);
router.put('/:id/reset-status', mrController.resetMRStatus);
router.delete('/:id', mrController.deleteMR);


export default router;