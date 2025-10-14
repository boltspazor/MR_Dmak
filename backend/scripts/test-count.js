const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { ObjectId } = require('mongodb');

dotenv.config();

async function run() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/mr_communication_tool?authSource=admin';
  console.log('Connecting to', mongoURI.replace(/\/\/.*@/, '//***:***@'));
  await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  // Load Campaign model from compiled dist if available, otherwise try src
  let Campaign;
  try {
    Campaign = require('../dist/models/Campaign').default;
    console.log('Loaded Campaign model from dist');
  } catch (e) {
    try {
      Campaign = require('../src/models/Campaign').default;
      console.log('Loaded Campaign model from src');
    } catch (err) {
      console.error('Failed to load Campaign model:', err);
      process.exit(1);
    }
  }

  const testUserId = new ObjectId();
  console.log('Test user id:', testUserId.toString());

  // Create test campaigns
  const docs = [
    { campaignId: `TEST-${Date.now()}-1`, name: 'Test Campaign 1', templateId: new ObjectId(), createdBy: testUserId, status: 'pending', totalRecipients: 1, sentCount: 0, failedCount: 0, pendingCount: 1, isActive: true },
    { campaignId: `TEST-${Date.now()}-2`, name: 'Test Campaign 2', templateId: new ObjectId(), createdBy: testUserId, status: 'pending', totalRecipients: 2, sentCount: 0, failedCount: 0, pendingCount: 2, isActive: true },
    { campaignId: `TEST-${Date.now()}-3`, name: 'Other User Campaign', templateId: new ObjectId(), createdBy: new ObjectId(), status: 'pending', totalRecipients: 1, sentCount: 0, failedCount: 0, pendingCount: 1, isActive: true },
    { campaignId: `TEST-${Date.now()}-4`, name: 'Inactive Campaign', templateId: new ObjectId(), createdBy: testUserId, status: 'pending', totalRecipients: 1, sentCount: 0, failedCount: 0, pendingCount: 1, isActive: false }
  ];

  const created = await Campaign.insertMany(docs);
  console.log('Inserted docs count:', created.length);

  // Count using the same query as the endpoint
  const total = await Campaign.countDocuments({ createdBy: testUserId, isActive: true });
  console.log(`Count for user ${testUserId.toString()} (isActive: true) =`, total);

  // Clean up inserted docs
  const ids = created.map(d => d._id);
  await Campaign.deleteMany({ _id: { $in: ids } });
  console.log('Cleaned up test documents');

  await mongoose.disconnect();
  console.log('Disconnected');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
