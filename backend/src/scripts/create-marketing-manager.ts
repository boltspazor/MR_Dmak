import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from '../config/database';
import User from '../models/User';
import logger from '../utils/logger';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MARKETING_MANAGER_EMAIL = 'prabhjeetsingh054@gmail.com';
const MARKETING_MANAGER_PASSWORD = 'admin1234';
const MARKETING_MANAGER_NAME = 'Prabhjeet Singh';

async function createMarketingManager() {
  try {
    // Connect to database
    await connectDB();
    logger.info('Connected to database');

    // Check if marketing manager already exists
    const existingManager = await User.findOne({ email: MARKETING_MANAGER_EMAIL });
    
    if (existingManager) {
      logger.info('Marketing Manager already exists', { 
        email: MARKETING_MANAGER_EMAIL,
        id: existingManager._id 
      });
      
      // Update password if needed
      const hashedPassword = await bcrypt.hash(MARKETING_MANAGER_PASSWORD, 12);
      existingManager.password = hashedPassword;
      existingManager.isMarketingManager = true;
      existingManager.role = 'admin';
      await existingManager.save();
      
      logger.info('✅ Marketing Manager updated successfully', {
        email: existingManager.email,
        name: existingManager.name,
        role: existingManager.role,
        id: existingManager._id
      });
      
      console.log('\n✅ Marketing Manager Updated Successfully!');
      console.log('=========================================');
      console.log('Email:', existingManager.email);
      console.log('Password:', MARKETING_MANAGER_PASSWORD);
      console.log('Name:', existingManager.name);
      console.log('Role:', existingManager.role);
      console.log('isMarketingManager:', existingManager.isMarketingManager);
      console.log('=========================================\n');
      
      process.exit(0);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(MARKETING_MANAGER_PASSWORD, 12);

    // Create marketing manager
    const manager = await User.create({
      email: MARKETING_MANAGER_EMAIL,
      password: hashedPassword,
      name: MARKETING_MANAGER_NAME,
      role: 'admin',
      isMarketingManager: true
    });

    logger.info('✅ Marketing Manager created successfully', {
      email: manager.email,
      name: manager.name,
      role: manager.role,
      id: manager._id
    });

    console.log('\n✅ Marketing Manager Created Successfully!');
    console.log('=========================================');
    console.log('Email:', manager.email);
    console.log('Password:', MARKETING_MANAGER_PASSWORD);
    console.log('Name:', manager.name);
    console.log('Role:', manager.role);
    console.log('isMarketingManager:', manager.isMarketingManager);
    console.log('ID:', manager._id);
    console.log('=========================================\n');

    process.exit(0);
  } catch (error) {
    logger.error('Failed to create marketing manager', { error });
    console.error('❌ Error creating marketing manager:', error);
    process.exit(1);
  }
}

// Run the script
createMarketingManager();
