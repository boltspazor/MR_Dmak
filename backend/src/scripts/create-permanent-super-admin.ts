import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import connectDB from '../config/database';
import logger from '../utils/logger';

const SUPER_ADMIN_EMAIL = 'sprabhjeet037@gmail.com';
const SUPER_ADMIN_PASSWORD = 'admin1234';
const SUPER_ADMIN_NAME = 'Super Admin';

async function createPermanentSuperAdmin() {
  try {
    // Connect to database
    await connectDB();
    logger.info('Connected to database for super admin creation');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ 
      email: SUPER_ADMIN_EMAIL,
      role: 'super_admin'
    });

    if (existingSuperAdmin) {
      logger.info('Super admin already exists, updating password...');
      
      // Update password
      const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);
      await User.findByIdAndUpdate(existingSuperAdmin._id, {
        password: hashedPassword,
        name: SUPER_ADMIN_NAME,
        isMarketingManager: true,
        updatedAt: new Date()
      });
      
      logger.info('Super admin password updated successfully');
      console.log('✅ Super admin password updated successfully');
      console.log(`📧 Email: ${SUPER_ADMIN_EMAIL}`);
      console.log(`🔑 Password: ${SUPER_ADMIN_PASSWORD}`);
      console.log(`👤 Name: ${SUPER_ADMIN_NAME}`);
      console.log(`🔐 Role: super_admin`);
      
    } else {
      // Create new super admin
      const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 12);
      
      const superAdmin = await User.create({
        email: SUPER_ADMIN_EMAIL,
        password: hashedPassword,
        name: SUPER_ADMIN_NAME,
        role: 'super_admin',
        isMarketingManager: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      logger.info('Permanent super admin created successfully', { 
        userId: superAdmin._id,
        email: SUPER_ADMIN_EMAIL 
      });
      
      console.log('✅ Permanent super admin created successfully');
      console.log(`📧 Email: ${SUPER_ADMIN_EMAIL}`);
      console.log(`🔑 Password: ${SUPER_ADMIN_PASSWORD}`);
      console.log(`👤 Name: ${SUPER_ADMIN_NAME}`);
      console.log(`🔐 Role: super_admin`);
      console.log(`🆔 User ID: ${superAdmin._id}`);
    }

    // Verify the super admin was created/updated
    const verifyAdmin = await User.findOne({ 
      email: SUPER_ADMIN_EMAIL,
      role: 'super_admin'
    });

    if (verifyAdmin) {
      console.log('\n🎉 Super admin setup completed successfully!');
      console.log('You can now login with these credentials:');
      console.log(`Email: ${SUPER_ADMIN_EMAIL}`);
      console.log(`Password: ${SUPER_ADMIN_PASSWORD}`);
    } else {
      throw new Error('Failed to verify super admin creation');
    }

  } catch (error: any) {
    logger.error('Failed to create permanent super admin', { error: error.message });
    console.error('❌ Error creating super admin:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

// Run the script
createPermanentSuperAdmin();
