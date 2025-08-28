# 🚀 Complete Testing Guide - MR Communication Tool

## 📋 **Prerequisites Verification**

Make sure you have completed these steps:

### ✅ **Environment Setup**
```bash
# 1. WhatsApp API credentials in backend/.env
WHATSAPP_ACCESS_TOKEN=your_actual_token_here
WHATSAPP_PHONE_NUMBER_ID=your_actual_phone_id_here
WHATSAPP_VERIFY_TOKEN=your_verify_token
MONGODB_URI=mongodb://localhost:27017/mr_communication_tool
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
PORT=5001
```

### ✅ **Frontend Environment**
```bash
# Create frontend/.env
VITE_API_BASE_URL=http://localhost:5001/api
```

## 🔧 **Complete Testing Commands**

### **Step 1: Start Database Services**
```bash
# From root directory
cd /Users/prabhjeet/Documents/SpazorLabs/MR_Project
docker-compose up -d

# Verify services are running
docker ps
```

### **Step 2: Start Backend Server**
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev

# Should see:
# 🚀 Server running on port 5001
# 📱 Environment: development  
# 🔗 API: http://localhost:5001/api
```

### **Step 3: Start Frontend Server**
```bash
# Terminal 2 - Frontend  
cd frontend
npm install
npm run dev

# Should see:
# VITE ready in XX ms
# ➜ Local: http://localhost:5173/
```

### **Step 4: API Health Check**
```bash
# Terminal 3 - Testing
curl http://localhost:5001/api/health
# Expected: {"status":"OK","timestamp":"...","version":"1.0.0","environment":"development"}

curl http://localhost:5001/api
# Expected: API documentation JSON
```

## 🧪 **Complete Functionality Testing**

### **Test 1: User Registration & Authentication**
```bash
# Register new user
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# Expected Response:
# {"message":"User registered successfully","user":{...}}

# Login user  
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com", 
    "password": "password123"
  }'

# Expected Response:
# {"message":"Login successful","user":{...},"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}

# Save the token for next tests
export TOKEN="your_jwt_token_here"
```

### **Test 2: Group Management**
```bash
# Create test group
curl -X POST http://localhost:5001/api/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "groupName": "Test Group",
    "description": "Test group for WhatsApp messaging"
  }'

# Expected Response:
# {"message":"Group created successfully","group":{...}}

# Get all groups
curl -X GET http://localhost:5001/api/groups \
  -H "Authorization: Bearer $TOKEN"

# Expected: Array of groups
```

### **Test 3: Medical Representatives**
```bash
# Add test MR (Use your real WhatsApp number for testing)
curl -X POST http://localhost:5001/api/mrs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "mrId": "MR001",
    "firstName": "Test",
    "lastName": "MR",
    "phone": "+919876543210",
    "groupId": "GROUP_ID_FROM_STEP_2",
    "comments": "Test medical representative"
  }'

# Get all MRs
curl -X GET http://localhost:5001/api/mrs \
  -H "Authorization: Bearer $TOKEN"
```

### **Test 4: WhatsApp Message Campaign**
```bash
# Send test campaign
curl -X POST http://localhost:5001/api/messages/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "Hello! This is a test message from MR Communication Tool. 📱",
    "targetGroups": ["Test Group"]
  }'

# Expected Response:
# {"message":"Message campaign created successfully","campaignId":"...","totalRecipients":1,"status":"pending"}

# Check campaign status
curl -X GET http://localhost:5001/api/messages/campaigns \
  -H "Authorization: Bearer $TOKEN"

# Monitor campaign progress (run multiple times)
curl -X GET "http://localhost:5001/api/messages/campaigns?limit=1" \
  -H "Authorization: Bearer $TOKEN"
```

## 🖥️ **Frontend Testing Guide**

### **Step 1: Access Application**
1. Open browser: `http://localhost:5173`
2. You should see the login page

### **Step 2: Complete User Flow**
```
1. REGISTER → Click "Register" → Fill form → Submit
2. LOGIN → Use credentials → Dashboard should load
3. GROUPS → Create "Test Group" 
4. MEDICAL REPS → Add MR with your WhatsApp number
5. CAMPAIGNS → Create campaign targeting "Test Group"
6. MONITOR → Watch real-time status updates
```

### **Step 3: Verify WhatsApp Integration**
1. **Campaign Status Flow**: `pending` → `sending` → `completed`
2. **Check Your Phone**: Should receive WhatsApp message
3. **View Statistics**: Sent count should increase
4. **Check Logs**: Backend logs show WhatsApp API calls

## 📊 **Backend Monitoring Commands**

### **Real-time Logs**
```bash
# Backend logs
cd backend
tail -f logs/combined.log

# Error logs only
tail -f logs/error.log

# MongoDB logs
docker logs mr_mongodb -f

# Redis logs  
docker logs mr_redis -f
```

### **Database Inspection**
```bash
# Connect to MongoDB
mongosh "mongodb://localhost:27017/mr_communication_tool"

# View collections
show collections

# Check users
db.users.find().pretty()

# Check groups
db.groups.find().pretty()

# Check medical representatives
db.medicalrepresentatives.find().pretty()

# Check campaigns
db.messagecampaigns.find().pretty()

# Check message logs (real-time status)
db.messagelogs.find().sort({createdAt: -1}).limit(5).pretty()
```

### **Queue Monitoring**
```bash
# Redis queue inspection
redis-cli

# List all keys
KEYS *

# Check queue status
LLEN bull:message-queue:waiting
LLEN bull:message-queue:active
LLEN bull:message-queue:completed
LLEN bull:message-queue:failed

# Exit Redis
exit
```

## 🔍 **Debugging Commands**

### **WhatsApp API Testing**
```bash
# Test WhatsApp API directly
curl -X POST "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "919876543210",
    "type": "text",
    "text": {"body": "Test message from API"}
  }'
```

### **Backend Health Checks**
```bash
# Check all endpoints
curl http://localhost:5001/api/health
curl http://localhost:5001/api
curl -H "Authorization: Bearer $TOKEN" http://localhost:5001/api/groups
curl -H "Authorization: Bearer $TOKEN" http://localhost:5001/api/mrs
curl -H "Authorization: Bearer $TOKEN" http://localhost:5001/api/messages/campaigns
```

### **Error Diagnosis**
```bash
# Backend not starting?
cd backend && npm run dev

# Frontend not starting? 
cd frontend && npm run dev

# Database connection issues?
docker-compose ps
docker-compose logs mongodb

# WhatsApp API issues?
grep -i "whatsapp" backend/logs/combined.log
grep -i "error" backend/logs/error.log
```

## ✅ **Expected Test Results**

### **Successful Test Indicators:**

1. **✅ Backend Startup**
   ```
   🚀 Server running on port 5001
   📱 Environment: development
   🔗 API: http://localhost:5001/api
   📊 Health: http://localhost:5001/api/health
   ```

2. **✅ Frontend Startup**
   ```
   VITE v5.4.8 ready in 234 ms
   ➜ Local: http://localhost:5173/
   ```

3. **✅ Database Connection**
   ```
   MongoDB connected successfully
   Redis connected successfully
   ```

4. **✅ WhatsApp Integration**
   ```
   WhatsApp message sent successfully
   Message status: sent
   Campaign status: completed
   ```

5. **✅ Frontend-Backend Communication**
   ```
   API calls successful (200 status)
   Real-time status updates working
   Campaign progress visible
   ```

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **Port Already in Use**
   ```bash
   # Kill process on port 5001
   lsof -ti:5001 | xargs kill -9
   
   # Kill process on port 5173
   lsof -ti:5173 | xargs kill -9
   ```

2. **MongoDB Connection Failed**
   ```bash
   # Restart MongoDB
   docker-compose restart mongodb
   docker-compose logs mongodb
   ```

3. **WhatsApp API Errors**
   ```bash
   # Check environment variables
   cd backend && cat .env | grep WHATSAPP
   
   # Verify token is valid
   curl -H "Authorization: Bearer YOUR_TOKEN" \
     "https://graph.facebook.com/v18.0/me"
   ```

4. **JWT Token Issues**
   ```bash
   # Clear browser storage
   # Or generate new JWT secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

## 🎯 **Success Criteria**

Your system is fully working when:

✅ **Backend server starts without errors**  
✅ **Frontend loads successfully**  
✅ **User can register and login**  
✅ **Groups can be created**  
✅ **MRs can be added**  
✅ **Campaigns can be created**  
✅ **WhatsApp messages are sent**  
✅ **Campaign status updates in real-time**  
✅ **Statistics are tracked correctly**  

## 🎉 **You're Ready!**

Once all tests pass, your MR Communication Tool is fully functional and ready for production use! 

**The complete WhatsApp integration is working and all functionalities are verified!** 🚀📱💬
