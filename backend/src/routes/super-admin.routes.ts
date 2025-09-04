import { Router } from 'express';
import { SuperAdminController } from '../controllers/super-admin.controller';

const router = Router();
const superAdminController = new SuperAdminController();

// Public routes for super admin management (no authentication required for setup)
router.post('/create', superAdminController.createOrUpdateSuperAdmin);
router.get('/info', superAdminController.getSuperAdminInfo);
router.post('/reset-password', superAdminController.resetSuperAdminPassword);
router.get('/credentials', superAdminController.getSuperAdminCredentials);

export default router;
