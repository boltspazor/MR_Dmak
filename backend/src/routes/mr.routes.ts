import { Router } from 'express';
import { MRController } from '../controllers/mr.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { schemas } from '../utils/validation';

const router = Router();
const mrController = new MRController();

router.use(authenticateToken);

router.post('/', validateRequest(schemas.mr.create), mrController.createMR);
router.post('/bulk-upload', upload.single('excel'), mrController.bulkUpload);
router.get('/', mrController.getMRs);
router.put('/:id', validateRequest(schemas.mr.update), mrController.updateMR);
router.delete('/:id', mrController.deleteMR);
router.get('/template', mrController.downloadTemplate);

export default router;