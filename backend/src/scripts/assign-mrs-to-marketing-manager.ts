import dotenv from 'dotenv';
import path from 'path';
import connectDB from '../config/database';
import User from '../models/User';
import MedicalRepresentative from '../models/MedicalRepresentative';
import logger from '../utils/logger';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MARKETING_MANAGER_EMAIL = 'prabhjeetsingh054@gmail.com';

async function assignMRsToMarketingManager() {
  try {
    // Connect to database
    await connectDB();
    logger.info('Connected to database');

    // Find the marketing manager
    const marketingManager = await User.findOne({ email: MARKETING_MANAGER_EMAIL });
    
    if (!marketingManager) {
      console.error('❌ Marketing manager not found!');
      process.exit(1);
    }

    console.log('\n📋 Marketing Manager Found:');
    console.log('=========================================');
    console.log('Name:', marketingManager.name);
    console.log('Email:', marketingManager.email);
    console.log('ID:', marketingManager._id);
    console.log('Role:', marketingManager.role);
    console.log('isMarketingManager:', marketingManager.isMarketingManager);
    console.log('=========================================\n');

    // Find all MRs that are NOT assigned to this marketing manager
    const unassignedMRs = await MedicalRepresentative.find({
      marketingManagerId: { $ne: marketingManager._id }
    });

    console.log(`Found ${unassignedMRs.length} MRs to assign to marketing manager\n`);

    if (unassignedMRs.length === 0) {
      console.log('✅ No MRs to assign. All MRs are already assigned to this marketing manager.');
      process.exit(0);
    }

    // Ask for confirmation
    console.log('This will assign the following MRs to the marketing manager:');
    unassignedMRs.slice(0, 10).forEach((mr, index) => {
      console.log(`  ${index + 1}. ${mr.firstName} ${mr.lastName} (${mr.mrId})`);
    });
    if (unassignedMRs.length > 10) {
      console.log(`  ... and ${unassignedMRs.length - 10} more`);
    }
    console.log('');

    // Update all MRs to be assigned to the marketing manager
    const result = await MedicalRepresentative.updateMany(
      { marketingManagerId: { $ne: marketingManager._id } },
      { $set: { marketingManagerId: marketingManager._id } }
    );

    console.log('\n✅ Assignment Complete!');
    console.log('=========================================');
    console.log('Total MRs Updated:', result.modifiedCount);
    console.log('Marketing Manager:', marketingManager.name);
    console.log('Marketing Manager ID:', marketingManager._id);
    console.log('=========================================\n');

    // Verify by counting MRs for this marketing manager
    const totalMRs = await MedicalRepresentative.countDocuments({
      marketingManagerId: marketingManager._id
    });

    console.log(`✅ Marketing manager now has ${totalMRs} MRs assigned\n`);

    process.exit(0);
  } catch (error) {
    logger.error('Failed to assign MRs to marketing manager', { error });
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
assignMRsToMarketingManager();
