import { Request, Response } from 'express';
import Template from '../../models/Template';
import logger from '../../utils/logger';

class MetaTemplateController {
  /**
   * Get Meta Template Sync Service (lazy loading)
   */
  private getMetaTemplateSyncService() {
    try {
      const metaTemplateSyncService = require('../../services/meta-template-sync.service').default;
      return metaTemplateSyncService;
    } catch (error) {
      logger.error('Failed to load Meta Template Sync Service:', error);
      throw new Error('Meta Template Sync Service not available. Please check WhatsApp Cloud API configuration.');
    }
  }

  /**
   * Check if Meta Template Sync Service is available
   */
  private isMetaTemplateSyncAvailable(): boolean {
    try {
      this.getMetaTemplateSyncService();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Sync templates with Meta WhatsApp Business Platform
   */
  async syncTemplates(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Starting template synchronization with Meta');
      
      // Check if service is available
      if (!this.isMetaTemplateSyncAvailable()) {
        res.status(503).json({
          success: false,
          error: 'Meta Template Sync Service not available. Please configure WhatsApp Cloud API access token.'
        });
        return;
      }
      
      const service = this.getMetaTemplateSyncService();
      const result = await service.syncMetaTemplates();
      
      logger.info('Template synchronization completed', result);
      
      res.json({
        success: true,
        message: 'Templates synchronized successfully',
        data: result
      });
    } catch (error: any) {
      logger.error('Error syncing templates:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get Meta template creation URL
   */
  async getMetaTemplateCreationUrl(req: Request, res: Response): Promise<void> {
    try {
      // Check if service is available
      if (!this.isMetaTemplateSyncAvailable()) {
        res.status(503).json({
          success: false,
          error: 'Meta Template Sync Service not available. Please configure WhatsApp Cloud API access token.'
        });
        return;
      }
      
      const service = this.getMetaTemplateSyncService();
      const url = service.getMetaTemplateCreationUrl();
      
      res.json({
        success: true,
        data: {
          url,
          message: 'Redirect to Meta template creation page'
        }
      });
    } catch (error: any) {
      logger.error('Error getting Meta template creation URL:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get Meta Business Manager URL
   */
  async getMetaBusinessManagerUrl(req: Request, res: Response): Promise<void> {
    try {
      const service = this.getMetaTemplateSyncService();
      const url = service.getMetaBusinessManagerUrl();
      
      res.json({
        success: true,
        data: {
          url,
          message: 'Redirect to Meta Business Manager'
        }
      });
    } catch (error: any) {
      logger.error('Error getting Meta Business Manager URL:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get template status summary
   */
  async getTemplateStatusSummary(req: Request, res: Response): Promise<void> {
    try {
      // Check if service is available
      if (!this.isMetaTemplateSyncAvailable()) {
        // Return empty summary if service is not available
        res.json({
          success: true,
          data: {
            total: 0,
            approved: 0,
            pending: 0,
            rejected: 0,
            customTemplates: 0
          }
        });
        return;
      }
      
      const service = this.getMetaTemplateSyncService();
      const summary = await service.getTemplateStatusSummary();
      
      res.json({
        success: true,
        data: summary
      });
    } catch (error: any) {
      logger.error('Error getting template status summary:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get all templates (both Meta and custom) with filtering
   */
  async getAllTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { 
        includeMeta = 'true', 
        includeCustom = 'true', 
        status, 
        category,
        limit = '50',
        offset = '0'
      } = req.query;

      const userId = (req as any).user.userId;

      // Build query
      const query: any = { isActive: true };
      
      // Filter by template source
      if (includeMeta === 'false' && includeCustom === 'true') {
        query.isMetaTemplate = false;
      } else if (includeMeta === 'true' && includeCustom === 'false') {
        query.isMetaTemplate = true;
      }
      // If both are true (default), no filter applied

      // Filter by Meta status
      if (status && query.isMetaTemplate !== false) {
        query.metaStatus = status;
      }

      // Filter by Meta category
      if (category && query.isMetaTemplate !== false) {
        query.metaCategory = category;
      }

      // For custom templates, filter by user
      if (query.isMetaTemplate === false) {
        query.createdBy = userId;
      }

      const templates = await Template.find(query)
        .sort({ updatedAt: -1 })
        .limit(parseInt(limit as string))
        .skip(parseInt(offset as string))
        .populate('createdBy', 'name email')
        .lean();

      // Get total count for pagination
      const totalCount = await Template.countDocuments(query);

      logger.info('Retrieved templates', { 
        count: templates.length, 
        totalCount,
        filters: { includeMeta, includeCustom, status, category }
      });

      res.json({
        success: true,
        data: templates,
        pagination: {
          total: totalCount,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: parseInt(offset as string) + templates.length < totalCount
        }
      });
    } catch (error: any) {
      logger.error('Error getting all templates:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get Meta templates specifically
   */
  async getMetaTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { status, category, limit = '50', offset = '0' } = req.query;

      const query: any = { 
        isActive: true, 
        isMetaTemplate: true 
      };

      if (status) {
        query.metaStatus = status;
      }

      if (category) {
        query.metaCategory = category;
      }

      const templates = await Template.find(query)
        .sort({ updatedAt: -1 })
        .limit(parseInt(limit as string))
        .skip(parseInt(offset as string))
        .lean();

      const totalCount = await Template.countDocuments(query);

      logger.info('Retrieved Meta templates', { 
        count: templates.length, 
        totalCount,
        filters: { status, category }
      });

      res.json({
        success: true,
        data: templates,
        pagination: {
          total: totalCount,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: parseInt(offset as string) + templates.length < totalCount
        }
      });
    } catch (error: any) {
      logger.error('Error getting Meta templates:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Force sync a specific template by Meta template ID
   */
  async syncSpecificTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { metaTemplateId } = req.params;

      if (!metaTemplateId) {
        res.status(400).json({
          success: false,
          error: 'Meta template ID is required'
        });
        return;
      }

      logger.info('Force syncing specific Meta template', { metaTemplateId });

      // Fetch the specific template from Meta
      const service = this.getMetaTemplateSyncService();
      const metaTemplates = await service.fetchMetaTemplates();
      const specificTemplate = metaTemplates.find((t: any) => t.id === metaTemplateId);

      if (!specificTemplate) {
        res.status(404).json({
          success: false,
          error: 'Template not found in Meta'
        });
        return;
      }

      // Sync the specific template
      const syncService = this.getMetaTemplateSyncService();
      await (syncService as any)['syncSingleMetaTemplate'](specificTemplate);

      logger.info('Successfully synced specific Meta template', { metaTemplateId });

      res.json({
        success: true,
        message: 'Template synchronized successfully',
        data: { metaTemplateId, name: specificTemplate.name }
      });
    } catch (error: any) {
      logger.error('Error syncing specific template:', error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

// Create controller instance and bind methods to preserve 'this' context
const metaTemplateController = new MetaTemplateController();

// Bind all methods to preserve 'this' context when used in Express routes
const boundController = {
  syncTemplates: metaTemplateController.syncTemplates.bind(metaTemplateController),
  getMetaTemplateCreationUrl: metaTemplateController.getMetaTemplateCreationUrl.bind(metaTemplateController),
  getMetaBusinessManagerUrl: metaTemplateController.getMetaBusinessManagerUrl.bind(metaTemplateController),
  getTemplateStatusSummary: metaTemplateController.getTemplateStatusSummary.bind(metaTemplateController),
  getAllTemplates: metaTemplateController.getAllTemplates.bind(metaTemplateController),
  getMetaTemplates: metaTemplateController.getMetaTemplates.bind(metaTemplateController),
  syncSpecificTemplate: metaTemplateController.syncSpecificTemplate.bind(metaTemplateController)
};

export default boundController;
