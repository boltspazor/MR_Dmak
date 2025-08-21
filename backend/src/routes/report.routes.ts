import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const reportController = new ReportController();

router.use(authenticateToken);

router.get('/dashboard', reportController.getDashboardStats);
router.get('/campaign/:campaignId', reportController.getDetailedReport);
router.get('/campaign/:campaignId/export', reportController.exportReport);

export default router;