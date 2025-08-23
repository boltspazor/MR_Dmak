import mongoose from 'mongoose';
import logger from '../utils/logger';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mr_communication_tool';
    
    await mongoose.connect(mongoURI);
    
    logger.info('✅ Connected to MongoDB');
  } catch (error: any) {
    logger.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
