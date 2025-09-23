import { Router } from 'express';
import { ReportController } from '../../controllers/backend/report.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();
const reportController = new ReportController();

router.use(authenticateToken);

router.get('/dashboard', reportController.getDashboardStats);
router.get('/campaign/:campaignId', reportController.getDetailedReport);
router.get('/campaign/:campaignId/export', reportController.exportReport);
router.get('/performance', reportController.getPerformanceReport);
router.get('/campaigns', reportController.getCampaignsReport);
router.get('/delivery', reportController.getDeliveryReport);
router.get('/groups', reportController.getGroupsReport);
router.get('/monthly/:year/:month', reportController.getMonthlyReport);

export default router;