require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    // Use the updated connection string
    const mongoURI = 'mongodb+srv://boltspazorlabs:parthprabhjeet@cluster0.dnbrvwm.mongodb.net/';
    
    console.log('Connecting to MongoDB Atlas...');
    console.log('URI:', mongoURI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials in logs
    
    await mongoose.connect(mongoURI);
    console.log('✅ Successfully connected to MongoDB Atlas');
    
    // Test creating a simple document
    const TestModel = mongoose.model('Test', new mongoose.Schema({ name: String }));
    const testDoc = await TestModel.create({ name: 'test' });
    console.log('✅ Successfully created test document:', testDoc);
    
    // Clean up
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('✅ Successfully deleted test document');
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB Atlas');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    // Provide helpful debugging information
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Check if the MongoDB Atlas cluster is accessible');
      console.log('2. Verify the connection string format');
      console.log('3. Ensure network connectivity to MongoDB Atlas');
      console.log('4. Check if the cluster name and credentials are correct');
    } else if (error.message.includes('bad auth')) {
      console.log('\n💡 Authentication failed. Please check:');
      console.log('1. Username and password are correct');
      console.log('2. User has proper permissions on the database');
      console.log('3. Network access is allowed from your IP address');
    }
    
    process.exit(1);
  }
}

testConnection();
