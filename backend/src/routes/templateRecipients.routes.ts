import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.middleware';
import { 
  uploadTemplateRecipients, 
  uploadTemplateRecipientsV2,
  getTemplateRecipients, 
  deleteTemplateRecipients 
} from '../controllers/templateRecipients.controller';

const router = express.Router();

// Configure multer for CSV file upload
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Upload recipients for a template (legacy CSV approach)
router.post('/upload', upload.single('csvFile'), uploadTemplateRecipients);

// Upload recipients for a template (new clean JSON approach)
router.post('/upload-v2', uploadTemplateRecipientsV2);

// Get all recipient lists for a template
router.get('/template/:templateId', getTemplateRecipients);

// Delete a recipient list
router.delete('/:id', deleteTemplateRecipients);

export default router;
