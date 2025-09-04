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
}
