import mongoose from 'mongoose';
import logger from '../utils/logger';

const connectDB = async (): Promise<void> => {
  try {
    // Use the updated connection string
const mongoURI = process.env.MONGODB_URI || 'mongodb+srv://boltspazorlabs:parthprabhjeet@cluster0.dnbrvwm.mongodb.net/';
    
    await mongoose.connect(mongoURI);
    
    logger.info('✅ Connected to MongoDB');
  } catch (error: any) {
    logger.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
