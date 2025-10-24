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
import { AuthController } from '../../controllers/backend/auth.controller';
import { authenticateToken } from '../../middleware/auth.middleware';
import { validateRequest } from '../../middleware/validation.middleware';
import { schemas } from '../../utils/validation';

const router = Router();
const authController = new AuthController();

router.post('/register', validateRequest(schemas.user.register), authController.register);
router.post('/login', validateRequest(schemas.user.login), authController.login);
router.get('/me', authenticateToken, authController.me);
router.post('/refresh', authenticateToken, authController.refreshToken);

export default router;