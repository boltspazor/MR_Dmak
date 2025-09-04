import mongoose from 'mongoose';
import logger from '../utils/logger';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/mr_communication_tool?authSource=admin';
    
    await mongoose.connect(mongoURI);
    
    logger.info('✅ Connected to MongoDB', { 
      uri: mongoURI.replace(/\/\/.*@/, '//***:***@'), // Hide credentials in logs
      database: mongoose.connection.db?.databaseName 
    });
  } catch (error: any) {
    logger.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
