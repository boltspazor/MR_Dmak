import { Request, Response } from 'express';
import { MRService } from '../../services/mr.service';
import { ExcelService } from '../../services/excel.service';
import { schemas } from '../../utils/validation';
import fs from 'fs';
import logger from '../../utils/logger';

const mrService = new MRService();
const excelService = new ExcelService();

export class MRController {
  async createMR(req: any, res: Response) {
    try {
      const { error, value } = schemas.mr.create.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
      }

      const mr = await mrService.createMR(value, req.user.userId);
      return res.status(201).json({ 
        message: 'MR created successfully',
        mr 
      });
    } catch (error: any) {
      logger.error('Failed to create MR', { error: error.message, body: req.body });
      
      // Handle specific business logic errors with appropriate status codes
      if (error.message.includes('already exists') || 
          error.message.includes('duplicate') ||
          error.message.includes('not found') ||
          error.message.includes('validation')) {
        return res.status(400).json({ 
          error: error.message,
          message: error.message
        });
      }
      
      // For other errors, return 500
      return res.status(500).json({ error: error.message });
    }
  }

  async bulkUpload(req: any, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'File is required' });
      }

      const mrData = excelService.parseFile(req.file.path);
      const { valid, errors } = excelService.validateMRData(mrData);

      if (errors.length > 0 && valid.length === 0) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors 
        });
      }

      // Process bulk upload
      const results = await mrService.bulkCreateMRs(valid, req.user.userId);

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      return res.json({
        message: 'Bulk upload completed',
        created: results.created,
        errors: results.errors,
        totalProcessed: results.totalProcessed,
        success: results.created > 0
      });
    } catch (error: any) {
      // Clean up uploaded file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      logger.error('Bulk upload failed', { error: error.message });
      return res.status(500).json({ error: error.message });
    }
  }

  async getMRs(req: any, res: Response) {
    try {
      const { groupId, search, page = 1, limit = 50, getAll } = req.query;

      // If getAll is true, return all MRs without pagination for CSV export
      if (getAll === 'true') {
        const result = await mrService.getMRs(
          req.user.userId,
          groupId,
          search,
          undefined, // No limit for getAll
          undefined  // No offset for getAll
        );
        return res.json({
          message: 'MRs retrieved successfully',
          data: result.mrs,
          total: result.total,
          getAll: true
        });
      }

      // Standard pagination
      const result = await mrService.getMRs(
        req.user.userId,
        groupId,
        search,
        parseInt(limit),
        (parseInt(page) - 1) * parseInt(limit)
      );

      return res.json({
        message: 'MRs retrieved successfully',
        data: result.mrs,
        pagination: result.pagination
      });
    } catch (error: any) {
      logger.error('Failed to get MRs', { error: error.message, query: req.query });
      return res.status(500).json({ error: error.message });
    }
  }

  async updateMR(req: any, res: Response) {
    try {
      const { id } = req.params;
      const { error, value } = schemas.mr.update.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
      }

      await mrService.updateMR(id, value, req.user.userId);
      return res.json({ message: 'MR updated successfully' });
    } catch (error: any) {
      logger.error('Failed to update MR', { error: error.message, mrId: req.params.id });
      
      // Handle specific business logic errors with appropriate status codes
      if (error.message.includes('already exists') || 
          error.message.includes('duplicate') ||
          error.message.includes('not found') ||
          error.message.includes('validation')) {
        return res.status(400).json({ 
          error: error.message,
          message: error.message
        });
      }
      
      // For other errors, return 500
      return res.status(500).json({ error: error.message });
    }
  }

  async deleteMR(req: any, res: Response) {
    try {
      const { id } = req.params;
      await mrService.deleteMR(id, req.user.userId);
      return res.json({ message: 'MR deleted successfully' });
    } catch (error: any) {
      logger.error('Failed to delete MR', { error: error.message, mrId: req.params.id });
      
      // Handle specific business logic errors with appropriate status codes
      if (error.message.includes('not found') ||
          error.message.includes('validation')) {
        return res.status(400).json({ 
          error: error.message,
          message: error.message
        });
      }
      
      // For other errors, return 500
      return res.status(500).json({ error: error.message });
    }
  }

  async getGroups(req: any, res: Response) {
    try {
      const groups = await mrService.getGroups(req.user.userId);
      return res.json({ 
        message: 'Groups retrieved successfully',
        data: groups 
      });
    } catch (error: any) {
      logger.error('Failed to get groups', { error: error.message });
      return res.status(500).json({ error: error.message });
    }
  }

  async createGroup(req: any, res: Response) {
    try {
      const { error, value } = schemas.group.create.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
      }

      const group = await mrService.createGroup(value.groupName, value.description, req.user.userId);
      return res.status(201).json({ 
        message: 'Group created successfully',
        group 
      });
    } catch (error: any) {
      logger.error('Failed to create group', { error: error.message, body: req.body });
      return res.status(400).json({ error: error.message });
    }
  }

  async updateGroup(req: any, res: Response) {
    try {
      const { id } = req.params;
      const { error, value } = schemas.group.create.validate(req.body);
      if (error) {
        return res.status(400).json({ 
          error: 'Validation failed',
          details: error.details.map(d => d.message)
        });
      }

      await mrService.updateGroup(id, value.groupName, value.description, req.user.userId);
      return res.json({ message: 'Group updated successfully' });
    } catch (error: any) {
      logger.error('Failed to update group', { error: error.message, groupId: req.params.id });
      return res.status(500).json({ error: error.message });
    }
  }

  async deleteGroup(req: any, res: Response) {
    try {
      const { id } = req.params;
      await mrService.deleteGroup(id, req.user.userId);
      return res.json({ message: 'Group deleted successfully' });
    } catch (error: any) {
      logger.error('Failed to delete group', { error: error.message, groupId: req.params.id });
      return res.status(500).json({ error: error.message });
    }
  }

  async getMRStats(req: any, res: Response) {
    try {
      const stats = await mrService.getMRStats(req.user.userId);
      return res.json({
        message: 'MR statistics retrieved successfully',
        data: stats
      });
    } catch (error: any) {
      logger.error('Failed to get MR stats', { error: error.message });
      return res.status(500).json({ error: error.message });
    }
  }

  async searchMRs(req: any, res: Response) {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const result = await mrService.searchMRs(req.user.userId, q);
      return res.json({
        message: 'MR search completed successfully',
        data: result.mrs,
        pagination: result.pagination
      });
    } catch (error: any) {
      logger.error('Failed to search MRs', { error: error.message, query: req.query });
      return res.status(500).json({ error: error.message });
    }
  }
}