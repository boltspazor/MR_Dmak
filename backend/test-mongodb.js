const mongoose = require('mongoose');

async function testConnection() {
  try {
    const mongoURI = 'mongodb://localhost:27017/test';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    
    console.log('✅ Successfully connected to MongoDB!');
    
    // List all databases to verify connection
    const adminDb = mongoose.connection.db.admin();
    const dbList = await adminDb.listDatabases();
    console.log('✅ Available databases:', dbList.databases.map(db => db.name));
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

testConnection();
