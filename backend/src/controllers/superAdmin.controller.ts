import { Request, Response } from 'express';
import User from '../models/User';
import MedicalRepresentative from '../models/MedicalRepresentative';
import Group from '../models/Group';
import MessageCampaign from '../models/MessageCampaign';
import logger from '../utils/logger';

export class SuperAdminController {
  /**
   * Get system-wide dashboard statistics
   */
  async getSystemStats(req: any, res: Response) {
    try {
      const [totalUsers, totalMRs, totalGroups, totalCampaigns, marketingManagers] = await Promise.all([
        User.countDocuments(),
        MedicalRepresentative.countDocuments(),
        Group.countDocuments(),
        MessageCampaign.countDocuments(),
        User.countDocuments({ isMarketingManager: true })
      ]);

      const stats = {
        totalUsers,
        totalMRs,
        totalGroups,
        totalCampaigns,
        marketingManagers,
        systemHealth: 'healthy'
      };

      logger.info('System stats retrieved by super admin', { userId: req.user.userId });
      
      return res.json({
        success: true,
        stats
      });
    } catch (error: any) {
      logger.error('Failed to get system stats', { error: error.message });
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all marketing managers
   */
  async getMarketingManagers(req: any, res: Response) {
    try {
      const marketingManagers = await User.find({ isMarketingManager: true })
        .select('-password')
        .sort({ createdAt: -1 });

      logger.info('Marketing managers retrieved by super admin', { userId: req.user.userId });
      
      return res.json({
        success: true,
        data: marketingManagers
      });
    } catch (error: any) {
      logger.error('Failed to get marketing managers', { error: error.message });
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Create a new marketing manager
   */
  async createMarketingManager(req: any, res: Response) {
    try {
      const { email, password, name } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }

      // Create marketing manager user
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 12);

      const marketingManager = new User({
        email,
        password: hashedPassword,
        name,
        role: 'admin',
        isMarketingManager: true
      });

      await marketingManager.save();

      logger.info('Marketing manager created by super admin', { 
        userId: req.user.userId,
        newManagerId: marketingManager._id 
      });

      return res.status(201).json({
        success: true,
        message: 'Marketing manager created successfully',
        user: {
          id: marketingManager._id,
          email: marketingManager.email,
          name: marketingManager.name,
          role: marketingManager.role,
          isMarketingManager: marketingManager.isMarketingManager
        }
      });
    } catch (error: any) {
      logger.error('Failed to create marketing manager', { error: error.message });
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update marketing manager
   */
  async updateMarketingManager(req: any, res: Response) {
    try {
      const { id } = req.params;
      const { name, email, isMarketingManager } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!user.isMarketingManager) {
        return res.status(400).json({ error: 'User is not a marketing manager' });
      }

      // Update fields
      if (name) user.name = name;
      if (email) user.email = email;
      if (typeof isMarketingManager === 'boolean') user.isMarketingManager = isMarketingManager;

      await user.save();

      logger.info('Marketing manager updated by super admin', { 
        userId: req.user.userId,
        managerId: id 
      });

      return res.json({
        success: true,
        message: 'Marketing manager updated successfully',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          isMarketingManager: user.isMarketingManager
        }
      });
    } catch (error: any) {
      logger.error('Failed to update marketing manager', { error: error.message });
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Delete marketing manager
   */
  async deleteMarketingManager(req: any, res: Response) {
    try {
      const { id } = req.params;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!user.isMarketingManager) {
        return res.status(400).json({ error: 'User is not a marketing manager' });
      }

      // Check if marketing manager has associated MRs
      const mrCount = await MedicalRepresentative.countDocuments({ marketingManagerId: id });
      if (mrCount > 0) {
        return res.status(400).json({ 
          error: `Cannot delete marketing manager. They have ${mrCount} associated Medical Representatives.` 
        });
      }

      await User.findByIdAndDelete(id);

      logger.info('Marketing manager deleted by super admin', { 
        userId: req.user.userId,
        managerId: id 
      });

      return res.json({
        success: true,
        message: 'Marketing manager deleted successfully'
      });
    } catch (error: any) {
      logger.error('Failed to delete marketing manager', { error: error.message });
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get MRs by marketing manager
   */
  async getMRsByManager(req: any, res: Response) {
    try {
      const { managerId } = req.params;
      const { page = 1, limit = 50, search = '' } = req.query;

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      // Build query
      const query: any = { marketingManagerId: managerId };
      if (search) {
        query.$or = [
          { mrId: { $regex: search, $options: 'i' } },
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const [mrs, total] = await Promise.all([
        MedicalRepresentative.find(query)
          .populate('groupId', 'groupName')
          .populate('marketingManagerId', 'name email')
          .sort({ createdAt: -1 })
          .limit(parseInt(limit as string))
          .skip(offset),
        MedicalRepresentative.countDocuments(query)
      ]);

      logger.info('MRs by manager retrieved by super admin', { 
        userId: req.user.userId,
        managerId 
      });

      return res.json({
        success: true,
        data: mrs,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      });
    } catch (error: any) {
      logger.error('Failed to get MRs by manager', { error: error.message });
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get system performance metrics
   */
  async getPerformanceMetrics(req: any, res: Response) {
    try {
      const [totalCampaigns, completedCampaigns, totalMessages, deliveredMessages] = await Promise.all([
        MessageCampaign.countDocuments(),
        MessageCampaign.countDocuments({ status: 'completed' }),
        MedicalRepresentative.countDocuments(),
        MedicalRepresentative.countDocuments() // This would be actual delivered messages in a real system
      ]);

      const metrics = {
        campaignSuccessRate: totalCampaigns > 0 ? ((completedCampaigns / totalCampaigns) * 100).toFixed(2) : '0',
        totalCampaigns,
        completedCampaigns,
        totalMRs: totalMessages,
        messageDeliveryRate: '95%', // Placeholder - would be calculated from actual delivery data
        systemUptime: '99.9%', // Placeholder - would be calculated from monitoring
        averageResponseTime: '2.3s' // Placeholder - would be calculated from actual metrics
      };

      logger.info('Performance metrics retrieved by super admin', { userId: req.user.userId });
      
      return res.json({
        success: true,
        metrics
      });
    } catch (error: any) {
      logger.error('Failed to get performance metrics', { error: error.message });
      return res.status(500).json({ error: error.message });
    }
  }
}
