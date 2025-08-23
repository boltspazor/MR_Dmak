// MongoDB initialization script
db = db.getSiblingDB('mr_communication_tool');

// Create collections
db.createCollection('users');
db.createCollection('groups');
db.createCollection('medical_representatives');
db.createCollection('messages');
db.createCollection('message_campaigns');
db.createCollection('message_logs');
db.createCollection('group_activities');

// Create indexes
db.users.createIndex({ "email": 1 }, { unique: true });
db.medical_representatives.createIndex({ "mrId": 1 }, { unique: true });
db.medical_representatives.createIndex({ "phone": 1 });
db.groups.createIndex({ "groupName": 1 });
db.message_logs.createIndex({ "campaignId": 1 });
db.message_logs.createIndex({ "mrId": 1 });
db.message_logs.createIndex({ "status": 1 });
db.message_campaigns.createIndex({ "status": 1 });
db.message_campaigns.createIndex({ "createdBy": 1 });

// Grant permissions to the database
db.grantRolesToUser("", [
  { role: "readWrite", db: "mr_communication_tool" }
]);

print('MongoDB initialization completed successfully!');
