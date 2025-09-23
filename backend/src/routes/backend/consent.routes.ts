import { Router } from 'express';
import ConsentController from '../../controllers/backend/consent.controller';
import { validateRequest, validateParams } from '../../middleware/validation.middleware';
import { schemas } from '../../utils/validation';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();
const consentController = ConsentController;

// Public routes (no authentication required)
router.post('/create', validateRequest(schemas.consent.create), consentController.createConsent);
router.get('/status/:phone_e164', validateParams(schemas.consent.getStatus), consentController.getConsentStatus);
router.post('/opt-out', validateRequest(schemas.consent.optOut), consentController.processOptOut);
router.get('/health', consentController.healthCheck);

// Protected routes (authentication required)
router.get('/list', authenticateToken, validateRequest(schemas.consent.list), consentController.getAllConsents);
router.delete('/:phone_e164', authenticateToken, validateParams(schemas.consent.getStatus), consentController.deleteConsent);
router.get('/stats', authenticateToken, consentController.getConsentStats);

export default router;
