import { Request, Response } from 'express';
import Template, { ITemplate } from '../models/Template';
import { upload } from '../middleware/upload.middleware';
import logger from '../utils/logger';

export class TemplateController {
  // Get all templates for a marketing manager
  async getTemplates(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId;
      const { search, type, page = 1, limit = 10 } = req.query;

      const query: any = { 
        createdBy: userId,
        isActive: true 
      };

      // Add search filter
      if (search) {
        query.name = { $regex: search, $options: 'i' };
      }

      // Add type filter
      if (type) {
        query.type = type;
      }

      const skip = (Number(page) - 1) * Number(limit);
      
      const templates = await Template.find(query)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit));

      const total = await Template.countDocuments(query);

      // Get summary statistics
      const stats = await Template.aggregate([
        { $match: { createdBy: userId, isActive: true } },
        {
          $group: {
            _id: null,
            totalTemplates: { $sum: 1 },
            htmlTemplates: {
              $sum: { $cond: [{ $eq: ['$type', 'html'] }, 1, 0] }
            },
            textTemplates: {
              $sum: { $cond: [{ $eq: ['$type', 'text'] }, 1, 0] }
            },
            imageTemplates: {
              $sum: { $cond: [{ $eq: ['$type', 'image'] }, 1, 0] }
            }
          }
        }
      ]);

      const summaryStats = stats[0] || {
        totalTemplates: 0,
        htmlTemplates: 0,
        textTemplates: 0,
        imageTemplates: 0
      };

      res.json({
        success: true,
        data: templates,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        },
        stats: summaryStats
      });
    } catch (error) {
      logger.error('Error fetching templates:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch templates' 
      });
    }
  }

  // Get a single template by ID
  async getTemplateById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const template = await Template.findOne({ 
        _id: id, 
        createdBy: userId,
        isActive: true 
      }).populate('createdBy', 'name email');

      if (!template) {
        res.status(404).json({ 
          success: false, 
          error: 'Template not found' 
        });
        return;
      }

      res.json({
        success: true,
        data: template
      });
    } catch (error) {
      logger.error('Error fetching template:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch template' 
      });
    }
  }

  // Create a new template
  async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { name, content, type, parameters, imageUrl, footerImageUrl } = req.body;

      // Check if template name already exists
      const existingTemplate = await Template.findOne({ 
        name: name.trim(),
        createdBy: userId,
        isActive: true 
      });

      if (existingTemplate) {
        res.status(400).json({ 
          success: false, 
          error: 'Template name already exists' 
        });
        return;
      }

      // Extract parameters from content if not provided
      let extractedParameters = parameters || [];
      if (!parameters && content) {
        const paramMatches = content.match(/#[A-Za-z0-9_]+/g);
        if (paramMatches) {
          extractedParameters = [...new Set(paramMatches.map((param: string) => param.substring(1)))];
        }
      }

      const templateData: any = {
        name: name.trim(),
        content,
        type: type || 'text',
        imageUrl: imageUrl || '',
        parameters: extractedParameters,
        createdBy: userId
      };

      // Only add footerImageUrl if it exists (for backward compatibility)
      if (footerImageUrl) {
        templateData.footerImageUrl = footerImageUrl;
      }

      const template = await Template.create(templateData);

      const populatedTemplate = await Template.findById(template._id)
        .populate('createdBy', 'name email');

      logger.info('Template created successfully', { 
        templateId: template._id, 
        name: template.name,
        createdBy: userId 
      });

      res.status(201).json({
        success: true,
        data: populatedTemplate,
        message: 'Template created successfully'
      });
    } catch (error) {
      logger.error('Error creating template:', error);
      console.error('Template creation error details:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to create template',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Update a template
  async updateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;
      const { name, content, type, parameters, imageUrl, footerImageUrl } = req.body;

      const template = await Template.findOne({ 
        _id: id, 
        createdBy: userId,
        isActive: true 
      });

      if (!template) {
        res.status(404).json({ 
          success: false, 
          error: 'Template not found' 
        });
        return;
      }

      // Check if new name conflicts with existing template
      if (name && name !== template.name) {
        const existingTemplate = await Template.findOne({ 
          name: name.trim(),
          createdBy: userId,
          isActive: true,
          _id: { $ne: id }
        });

        if (existingTemplate) {
          res.status(400).json({ 
            success: false, 
            error: 'Template name already exists' 
          });
          return;
        }
      }

      // Extract parameters from content if not provided
      let extractedParameters = parameters || template.parameters;
      if (!parameters && content) {
        const paramMatches = content.match(/#[A-Za-z0-9_]+/g);
        if (paramMatches) {
          extractedParameters = [...new Set(paramMatches.map((param: string) => param.substring(1)))];
        }
      }

      const updateData: any = {
        name: name ? name.trim() : template.name,
        content: content || template.content,
        type: type || template.type,
        imageUrl: imageUrl !== undefined ? imageUrl : template.imageUrl,
        parameters: extractedParameters
      };

      // Only update footerImageUrl if it exists (for backward compatibility)
      if (footerImageUrl !== undefined) {
        updateData.footerImageUrl = footerImageUrl;
      }

      const updatedTemplate = await Template.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).populate('createdBy', 'name email');

      logger.info('Template updated successfully', { 
        templateId: id, 
        updatedBy: userId 
      });

      res.json({
        success: true,
        data: updatedTemplate,
        message: 'Template updated successfully'
      });
    } catch (error) {
      logger.error('Error updating template:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to update template' 
      });
    }
  }

  // Delete a template (soft delete)
  async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const template = await Template.findOne({ 
        _id: id, 
        createdBy: userId,
        isActive: true 
      });

      if (!template) {
        res.status(404).json({ 
          success: false, 
          error: 'Template not found' 
        });
        return;
      }

      // Soft delete by setting isActive to false
      await Template.findByIdAndUpdate(id, { isActive: false });

      logger.info('Template deleted successfully', { 
        templateId: id, 
        deletedBy: userId 
      });

      res.json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting template:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete template' 
      });
    }
  }

  // Upload template image
  async uploadTemplateImage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ 
          success: false, 
          error: 'No image file provided' 
        });
        return;
      }

      // For production, we need to return the full URL
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://mrbackend-production-2ce3.up.railway.app'
        : 'http://localhost:5000';
      const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;

      logger.info('Template image uploaded successfully', { 
        filename: req.file.filename,
        uploadedBy: (req as any).user.userId 
      });

      res.json({
        success: true,
        data: { imageUrl },
        message: 'Image uploaded successfully'
      });
    } catch (error) {
      logger.error('Error uploading template image:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to upload image' 
      });
    }
  }

  // Get template statistics
  async getTemplateStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;

      const stats = await Template.aggregate([
        { $match: { createdBy: userId, isActive: true } },
        {
          $group: {
            _id: null,
            totalTemplates: { $sum: 1 },
            htmlTemplates: {
              $sum: { $cond: [{ $eq: ['$type', 'html'] }, 1, 0] }
            },
            textTemplates: {
              $sum: { $cond: [{ $eq: ['$type', 'text'] }, 1, 0] }
            },
            imageTemplates: {
              $sum: { $cond: [{ $eq: ['$type', 'image'] }, 1, 0] }
            },
            avgParameters: { $avg: { $size: '$parameters' } }
          }
        }
      ]);

      const result = stats[0] || {
        totalTemplates: 0,
        htmlTemplates: 0,
        textTemplates: 0,
        imageTemplates: 0,
        avgParameters: 0
      };

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error fetching template stats:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch template statistics' 
      });
    }
  }

  // Export templates to CSV
  async exportTemplates(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { type } = req.query;

      const query: any = { 
        createdBy: userId,
        isActive: true 
      };

      if (type) {
        query.type = type;
      }

      const templates = await Template.find(query)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 });

      // Convert to CSV format
      const csvHeader = 'Template Name,Type,Parameters,Content Preview,Created At,Created By\n';
      const csvRows = templates.map(template => {
        const contentPreview = template.content.length > 100 
          ? template.content.substring(0, 100) + '...' 
          : template.content;
        
        return [
          `"${template.name}"`,
          `"${template.type}"`,
          `"${template.parameters.join(', ')}"`,
          `"${contentPreview.replace(/"/g, '""')}"`,
          `"${template.createdAt.toISOString()}"`,
          `"${(template.createdBy as any).name}"`
        ].join(',');
      }).join('\n');

      const csvContent = csvHeader + csvRows;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=templates.csv');
      res.send(csvContent);
    } catch (error) {
      logger.error('Error exporting templates:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to export templates' 
      });
    }
  }
}
