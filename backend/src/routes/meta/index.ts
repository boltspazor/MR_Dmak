// Meta-related routes
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
export { default as metaTemplateRoutes } from './meta-template.routes';
export { default as whatsappCloudRoutes } from './whatsapp-cloud.routes';
