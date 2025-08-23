import { Router } from 'express';
import { GroupController } from '../controllers/group.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { schemas } from '../utils/validation';

const router = Router();
const groupController = new GroupController();

router.use(authenticateToken);

router.get('/', groupController.getGroups);
router.post('/', validateRequest(schemas.group.create), groupController.createGroup);
router.put('/:id', validateRequest(schemas.group.create), groupController.updateGroup);
router.delete('/:id', groupController.deleteGroup);
router.get('/:id', groupController.getGroupById);
router.get('/:id/stats', groupController.getGroupStats);
router.get('/:id/mrs', groupController.getGroupMRs);
router.post('/:id/mrs/move', groupController.moveMRsToGroup);
router.get('/:id/export', groupController.exportGroupData);
router.get('/:id/activity', groupController.getGroupActivity);
router.delete('/bulk', groupController.bulkDeleteGroups);

export default router;