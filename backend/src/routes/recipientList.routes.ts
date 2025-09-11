import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import recipientListController from '../controllers/recipientList.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all recipient lists for the authenticated user
router.get('/', recipientListController.getRecipientLists);

// Get available parameters from all recipient lists
router.get('/parameters', recipientListController.getAvailableParameters);

// Get a specific recipient list
router.get('/:id', recipientListController.getRecipientList);

// Create a new recipient list
router.post('/', recipientListController.createRecipientList);

// Upload recipient list from CSV
router.post('/upload', recipientListController.uploadRecipientList);

// Update a recipient list
router.put('/:id', recipientListController.updateRecipientList);

// Delete a recipient list
router.delete('/:id', recipientListController.deleteRecipientList);

export default router;
