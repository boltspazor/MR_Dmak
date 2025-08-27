import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User';
import dotenv from 'dotenv';

dotenv.config();

const createSuperAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ email: 'sprabhjeet037@gmail.com' });
    
    if (existingSuperAdmin) {
      console.log('Super admin already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin1234', 12);

    // Create super admin user
    const superAdmin = new User({
      email: 'sprabhjeet037@gmail.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'super_admin',
      isMarketingManager: false
    });

    await superAdmin.save();
    console.log('Super admin created successfully');
    console.log('Email: sprabhjeet037@gmail.com');
    console.log('Password: admin1234');

  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
createSuperAdmin();
