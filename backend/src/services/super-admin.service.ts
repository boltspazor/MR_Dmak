import User from '../models/User';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger';

export class SuperAdminService {
  private static readonly SUPER_ADMIN_EMAIL = 'sprabhjeet037@gmail.com';
  private static readonly SUPER_ADMIN_PASSWORD = 'admin1234';
  private static readonly SUPER_ADMIN_NAME = 'Super Admin';

  async createOrUpdateSuperAdmin() {
    try {
      // Check if super admin already exists
      const existingSuperAdmin = await User.findOne({ 
        email: SuperAdminService.SUPER_ADMIN_EMAIL,
        role: 'super_admin'
      });

      if (existingSuperAdmin) {
        logger.info('Super admin already exists, updating...');
        
        // Update password and details
        const hashedPassword = await bcrypt.hash(SuperAdminService.SUPER_ADMIN_PASSWORD, 12);
        const updatedAdmin = await User.findByIdAndUpdate(
          existingSuperAdmin._id,
          {
            password: hashedPassword,
            name: SuperAdminService.SUPER_ADMIN_NAME,
            isMarketingManager: true,
            updatedAt: new Date()
          },
          { new: true }
        );
        
        logger.info('Super admin updated successfully', { 
          userId: updatedAdmin?._id,
          email: SuperAdminService.SUPER_ADMIN_EMAIL 
        });
        
        return {
          success: true,
          message: 'Super admin updated successfully',
          admin: {
            id: updatedAdmin?._id,
            email: SuperAdminService.SUPER_ADMIN_EMAIL,
            name: SuperAdminService.SUPER_ADMIN_NAME,
            role: 'super_admin'
          }
        };
      } else {
        // Create new super admin
        const hashedPassword = await bcrypt.hash(SuperAdminService.SUPER_ADMIN_PASSWORD, 12);
        
        const superAdmin = await User.create({
          email: SuperAdminService.SUPER_ADMIN_EMAIL,
          password: hashedPassword,
          name: SuperAdminService.SUPER_ADMIN_NAME,
          role: 'super_admin',
          isMarketingManager: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        logger.info('Permanent super admin created successfully', { 
          userId: superAdmin._id,
          email: SuperAdminService.SUPER_ADMIN_EMAIL 
        });
        
        return {
          success: true,
          message: 'Super admin created successfully',
          admin: {
            id: superAdmin._id,
            email: SuperAdminService.SUPER_ADMIN_EMAIL,
            name: SuperAdminService.SUPER_ADMIN_NAME,
            role: 'super_admin'
          }
        };
      }
    } catch (error: any) {
      logger.error('Failed to create/update super admin', { error: error.message });
      throw new Error(`Failed to create/update super admin: ${error.message}`);
    }
  }

  async getSuperAdminInfo() {
    try {
      const superAdmin = await User.findOne({ 
        email: SuperAdminService.SUPER_ADMIN_EMAIL,
        role: 'super_admin'
      });

      if (!superAdmin) {
        return {
          exists: false,
          message: 'Super admin not found'
        };
      }

      return {
        exists: true,
        admin: {
          id: superAdmin._id,
          email: superAdmin.email,
          name: superAdmin.name,
          role: superAdmin.role,
          isMarketingManager: superAdmin.isMarketingManager,
          createdAt: superAdmin.createdAt,
          updatedAt: superAdmin.updatedAt
        }
      };
    } catch (error: any) {
      logger.error('Failed to get super admin info', { error: error.message });
      throw new Error(`Failed to get super admin info: ${error.message}`);
    }
  }

  async resetSuperAdminPassword() {
    try {
      const superAdmin = await User.findOne({ 
        email: SuperAdminService.SUPER_ADMIN_EMAIL,
        role: 'super_admin'
      });

      if (!superAdmin) {
        throw new Error('Super admin not found');
      }

      const hashedPassword = await bcrypt.hash(SuperAdminService.SUPER_ADMIN_PASSWORD, 12);
      
      await User.findByIdAndUpdate(superAdmin._id, {
        password: hashedPassword,
        updatedAt: new Date()
      });

      logger.info('Super admin password reset successfully', { 
        userId: superAdmin._id,
        email: SuperAdminService.SUPER_ADMIN_EMAIL 
      });

      return {
        success: true,
        message: 'Super admin password reset successfully',
        email: SuperAdminService.SUPER_ADMIN_EMAIL,
        password: SuperAdminService.SUPER_ADMIN_PASSWORD
      };
    } catch (error: any) {
      logger.error('Failed to reset super admin password', { error: error.message });
      throw new Error(`Failed to reset super admin password: ${error.message}`);
    }
  }

  getSuperAdminCredentials() {
    return {
      email: SuperAdminService.SUPER_ADMIN_EMAIL,
      password: SuperAdminService.SUPER_ADMIN_PASSWORD,
      name: SuperAdminService.SUPER_ADMIN_NAME,
      role: 'super_admin'
    };
  }

  async getStats() {
    try {
      const totalUsers = await User.countDocuments();
      const marketingManagers = await User.countDocuments({ isMarketingManager: true });
      const superAdmins = await User.countDocuments({ role: 'super_admin' });
      
      return {
        totalUsers,
        marketingManagers,
        superAdmins,
        regularUsers: totalUsers - marketingManagers - superAdmins
      };
    } catch (error) {
      logger.error('Failed to get super admin stats', { error });
      throw error;
    }
  }

  async getPerformance() {
    try {
      // Get performance data for all users
      const users = await User.find({ isMarketingManager: true })
        .select('name email createdAt lastLoginAt')
        .sort({ createdAt: -1 });

      return {
        totalMarketingManagers: users.length,
        activeUsers: users.filter(user => (user as any).lastLoginAt && 
          new Date((user as any).lastLoginAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
        users: users.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          lastLoginAt: (user as any).lastLoginAt,
          isActive: (user as any).lastLoginAt && 
            new Date((user as any).lastLoginAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }))
      };
    } catch (error) {
      logger.error('Failed to get performance data', { error });
      throw error;
    }
  }

  async getMarketingManagers() {
    try {
      const managers = await User.find({ isMarketingManager: true })
        .select('name email createdAt lastLoginAt')
        .sort({ createdAt: -1 });

      return managers.map(manager => ({
        id: manager._id,
        name: manager.name,
        email: manager.email,
        createdAt: manager.createdAt,
        lastLoginAt: (manager as any).lastLoginAt
      }));
    } catch (error) {
      logger.error('Failed to get marketing managers', { error });
      throw error;
    }
  }

  async createMarketingManager(data: { name: string; email: string; password: string }) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        const error: any = new Error('A user with this email address already exists. Please use a different email.');
        error.code = 'USER_EXISTS';
        throw error;
      }

      // Validate input data
      if (!data.name || data.name.trim().length === 0) {
        throw new Error('Name cannot be empty');
      }

      if (!data.email || data.email.trim().length === 0) {
        throw new Error('Email cannot be empty');
      }

      if (!data.password || data.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      // Create new marketing manager with the provided password
      const hashedPassword = await bcrypt.hash(data.password, 12);
      const manager = await User.create({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: hashedPassword,
        isMarketingManager: true,
        role: 'admin'
      });

      logger.info('Marketing manager created successfully', { 
        managerId: manager._id, 
        email: data.email 
      });

      return {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        createdAt: manager.createdAt
      };
    } catch (error: any) {
      logger.error('Failed to create marketing manager', { 
        error: error.message, 
        code: error.code,
        email: data.email 
      });
      
      // Re-throw with more context if it's a database error
      if (error.name === 'MongoError' || error.name === 'MongoServerError') {
        if (error.code === 11000) {
          const duplicateError: any = new Error('A user with this email address already exists');
          duplicateError.code = 'DUPLICATE_EMAIL';
          throw duplicateError;
        }
        throw new Error('Database error occurred while creating marketing manager');
      }
      
      throw error;
    }
  }

  async updateMarketingManager(id: string, data: { name: string; email: string }) {
    try {
      const manager = await User.findOneAndUpdate(
        { _id: id, isMarketingManager: true },
        { 
          name: data.name, 
          email: data.email,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!manager) {
        throw new Error('Marketing manager not found');
      }

      logger.info('Marketing manager updated successfully', { 
        managerId: id, 
        email: data.email 
      });

      return {
        id: manager._id,
        name: manager.name,
        email: manager.email,
        updatedAt: manager.updatedAt
      };
    } catch (error) {
      logger.error('Failed to update marketing manager', { error, id, data });
      throw error;
    }
  }

  async deleteMarketingManager(id: string) {
    try {
      const manager = await User.findOneAndDelete({ 
        _id: id, 
        isMarketingManager: true 
      });

      if (!manager) {
        throw new Error('Marketing manager not found');
      }

      logger.info('Marketing manager deleted successfully', { 
        managerId: id, 
        email: manager.email 
      });

      return { success: true };
    } catch (error) {
      logger.error('Failed to delete marketing manager', { error, id });
      throw error;
    }
  }
}
