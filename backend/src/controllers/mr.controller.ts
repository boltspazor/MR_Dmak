import { Request, Response } from 'express';
import { MRService } from '../services/mr.service';
import { ExcelService } from '../services/excel.service';
import { schemas } from '../utils/validation';
import fs from 'fs';
import logger from '../utils/logger';

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
      return res.status(500).json({ error: error.message });
    }
  }

  async bulkUpload(req: any, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Excel file is required' });
      }

      const mrData = excelService.parseExcelFile(req.file.path);
      const { valid, errors } = excelService.validateMRData(mrData);

      if (errors.length > 0 && valid.length === 0) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors 
        });
      }

      const result = await mrService.bulkCreateMRs(valid, req.user.userId);
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      return res.json({
        message: 'Bulk upload completed',
        created: result.created,
        errors: [...errors, ...result.errors],
        totalProcessed: mrData.length,
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
      const { groupId, search, limit = 100, offset = 0 } = req.query;
      const result = await mrService.getMRs(
        req.user.userId, 
        groupId, 
        search, 
        parseInt(limit), 
        parseInt(offset)
      );
      res.json(result);
    } catch (error: any) {
      logger.error('Failed to get MRs', { error: error.message, query: req.query });
      res.status(500).json({ error: error.message });
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
      return res.status(500).json({ error: error.message });
    }
  }

  async deleteMR(req: any, res: Response) {
    try {
      const { id } = req.params;
      await mrService.deleteMR(id, req.user.userId);
      res.json({ message: 'MR deleted successfully' });
    } catch (error: any) {
      logger.error('Failed to delete MR', { error: error.message, mrId: req.params.id });
      res.status(500).json({ error: error.message });
    }
  }

  async getGroups(req: any, res: Response) {
    try {
      const groups = await mrService.getGroups(req.user.userId);
      res.json({ groups });
    } catch (error: any) {
      logger.error('Failed to get groups', { error: error.message });
      res.status(500).json({ error: error.message });
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
      res.json({ message: 'Group deleted successfully' });
    } catch (error: any) {
      logger.error('Failed to delete group', { error: error.message, groupId: req.params.id });
      res.status(500).json({ error: error.message });
    }
  }

  async downloadTemplate(req: Request, res: Response) {
    try {
      const templateBuffer = excelService.generateExcelTemplate();
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=mr-template.xlsx');
      res.send(templateBuffer);
    } catch (error: any) {
      logger.error('Failed to generate template', { error: error.message });
      res.status(500).json({ error: 'Failed to generate template' });
    }
  }
}