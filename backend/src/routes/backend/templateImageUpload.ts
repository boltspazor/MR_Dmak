import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import Template from '../../models/Template';

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, '../uploads/template-images');
fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(console.error);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req: any, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
    // Only accept images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

/**
 * POST /api/templates/:templateId/upload-image
 * Upload and link image to template
 */
router.post('/:templateId/upload-image', upload.single('image'), async (req: express.Request, res: express.Response) => {
  try {
    const { templateId } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Verify template exists
    const template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Generate unique filename
    const imageId = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(req.file.originalname) || '.jpg';
    const filename = `${imageId}${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);

    // Process and save image with sharp (resize + optimize)
    await sharp(req.file.buffer)
      .resize(1200, 1200, { // Max 1200x1200, maintains aspect ratio
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 85 }) // Convert to JPEG with 85% quality
      .toFile(filepath);

    // Generate public URL
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/template-images/${filename}`;

    // Delete old image if exists
    if (template.imageUrl && template.imageUrl.includes('/uploads/template-images/')) {
      const oldFilename = path.basename(template.imageUrl);
      const oldFilepath = path.join(UPLOADS_DIR, oldFilename);
      await fs.unlink(oldFilepath).catch(() => {}); // Ignore errors if file doesn't exist
    }

    // Update template with new image URL
    template.imageUrl = imageUrl;
    await template.save();

    return res.json({
      success: true,
      imageUrl,
      message: 'Image uploaded and linked to template successfully',
    });

  } catch (error: unknown) {
    console.error('Image upload error:', error);
    return res.status(500).json({ 
      error: 'Failed to upload image', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * DELETE /api/templates/:templateId/delete-image
 * Remove image from template and delete file
 */
router.delete('/:templateId/delete-image', async (req: express.Request, res: express.Response) => {
  try {
    const { templateId } = req.params;

    const template = await Template.findById(templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    if (!template.imageUrl) {
      return res.status(400).json({ error: 'Template has no image' });
    }

    // Delete file if it's a local upload
    if (template.imageUrl.includes('/uploads/template-images/')) {
      const filename = path.basename(template.imageUrl);
      const filepath = path.join(UPLOADS_DIR, filename);
      await fs.unlink(filepath).catch(() => {}); // Ignore if file doesn't exist
    }

    // Remove imageUrl from template
    template.imageUrl = '';
    await template.save();

    return res.json({
      success: true,
      message: 'Image deleted successfully',
    });

  } catch (error: unknown) {
    console.error('Image delete error:', error);
    return res.status(500).json({ 
      error: 'Failed to delete image', 
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;