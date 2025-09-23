import { Request, Response } from 'express';
import { SuperAdminService } from '../../services/super-admin.service';
import logger from '../../utils/logger';

const superAdminService = new SuperAdminService();

export class SuperAdminController {
  async createOrUpdateSuperAdmin(req: Request, res: Response) {
    try {
      const result = await superAdminService.createOrUpdateSuperAdmin();
      
      return res.json({
        success: true,
        message: result.message,
        data: result.admin
      });
    } catch (error: any) {
      logger.error('Failed to create/update super admin', { error: error.message });
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  async getSuperAdminInfo(req: Request, res: Response) {
    try {
      const result = await superAdminService.getSuperAdminInfo();
      
      return res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      logger.error('Failed to get super admin info', { error: error.message });
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  async resetSuperAdminPassword(req: Request, res: Response) {
    try {
      const result = await superAdminService.resetSuperAdminPassword();
      
      return res.json({
        success: true,
        message: result.message,
        data: {
          email: result.email,
          password: result.password
        }
      });
    } catch (error: any) {
      logger.error('Failed to reset super admin password', { error: error.message });
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  async getSuperAdminCredentials(req: Request, res: Response) {
    try {
      const credentials = superAdminService.getSuperAdminCredentials();
      
      return res.json({
        success: true,
        message: 'Super admin credentials retrieved successfully',
        data: credentials
      });
    } catch (error: any) {
      logger.error('Failed to get super admin credentials', { error: error.message });
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const stats = await superAdminService.getStats();
      
      return res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      logger.error('Failed to get super admin stats', { error: error.message });
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  async getPerformance(req: Request, res: Response) {
    try {
      const performance = await superAdminService.getPerformance();
      
      return res.json({
        success: true,
        data: performance
      });
    } catch (error: any) {
      logger.error('Failed to get performance data', { error: error.message });
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  async getMarketingManagers(req: Request, res: Response) {
    try {
      const managers = await superAdminService.getMarketingManagers();
      
      return res.json({
        success: true,
        data: managers
      });
    } catch (error: any) {
      logger.error('Failed to get marketing managers', { error: error.message });
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  async createMarketingManager(req: Request, res: Response) {
    try {
      const { name, email } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({
          success: false,
          error: 'Name and email are required'
        });
      }

      const manager = await superAdminService.createMarketingManager({ name, email });
      
      return res.json({
        success: true,
        message: 'Marketing manager created successfully',
        data: manager
      });
    } catch (error: any) {
      logger.error('Failed to create marketing manager', { error: error.message });
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  async updateMarketingManager(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, email } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({
          success: false,
          error: 'Name and email are required'
        });
      }

      const manager = await superAdminService.updateMarketingManager(id, { name, email });
      
      return res.json({
        success: true,
        message: 'Marketing manager updated successfully',
        data: manager
      });
    } catch (error: any) {
      logger.error('Failed to update marketing manager', { error: error.message });
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }

  async deleteMarketingManager(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      await superAdminService.deleteMarketingManager(id);
      
      return res.json({
        success: true,
        message: 'Marketing manager deleted successfully'
      });
    } catch (error: any) {
      logger.error('Failed to delete marketing manager', { error: error.message });
      return res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  }
}
