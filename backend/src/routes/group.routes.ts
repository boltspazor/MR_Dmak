import { Router } from 'express';
import { MRController } from '../controllers/mr.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { schemas } from '../utils/validation';

const router = Router();
const mrController = new MRController();

router.use(authenticateToken);

router.get('/', mrController.getGroups);
router.post('/', validateRequest(schemas.group.create), mrController.createGroup);
router.put('/:id', validateRequest(schemas.group.create), mrController.updateGroup);
router.delete('/:id', mrController.deleteGroup);

export default router;