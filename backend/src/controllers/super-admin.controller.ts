import { Request, Response } from 'express';
import { SuperAdminService } from '../services/super-admin.service';
import logger from '../utils/logger';

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
}
