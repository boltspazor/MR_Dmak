# 🚀 Complete System Startup Guide

## ✅ **Environment Verified**
Your WhatsApp credentials are properly configured in `backend/.env`:
- ✅ WHATSAPP_ACCESS_TOKEN 
- ✅ WHATSAPP_PHONE_NUMBER_ID
- ✅ JWT_SECRET

## 🔧 **Step-by-Step Startup Commands**

### **Option A: With Docker (Recommended)**

#### **1. Start Docker Desktop**
```bash
# Start Docker Desktop application on Mac
# Or install Docker if not available: https://www.docker.com/products/docker-desktop/
```

#### **2. Start Database Services**
```bash
cd /Users/prabhjeet/Documents/SpazorLabs/MR_Project
docker-compose up -d

# Verify services are running
docker ps
```

#### **3. Start Backend Server**
```bash
# Terminal 1 - Backend
cd backend
npm run dev
```

#### **4. Start Frontend Server** 
```bash
# Terminal 2 - Frontend
cd frontend
npm run dev
```

### **Option B: Without Docker (Local MongoDB/Redis)**

#### **1. Install & Start MongoDB Locally**
```bash
# Install MongoDB (if not installed)
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb/brew/mongodb-community

# Verify MongoDB is running
mongosh --eval "db.runCommand('ping')"
```

#### **2. Install & Start Redis Locally**
```bash
# Install Redis (if not installed)
brew install redis

# Start Redis
brew services start redis

# Verify Redis is running
redis-cli ping
```

#### **3. Start Backend Server**
```bash
# Terminal 1 - Backend
cd backend
npm run dev
```

#### **4. Start Frontend Server**
```bash
# Terminal 2 - Frontend  
cd frontend
npm run dev
```

## 📱 **Complete Testing Flow**

### **Step 1: Access Application**
1. Open browser: `http://localhost:5173`
2. You should see the login/register page

### **Step 2: Register & Login**
```
1. Click "Register"
2. Fill in:
   - Email: test@example.com
   - Password: password123
   - Name: Test User
3. Click "Register"
4. You'll be automatically logged in
```

### **Step 3: Create Test Group**
```
1. Go to "Groups" in sidebar
2. Click "Create Group"
3. Fill in:
   - Group Name: Test Group
   - Description: Test group for WhatsApp
4. Click "Create Group"
```

### **Step 4: Add Medical Representative**
```
1. Go to "Medical Reps" in sidebar  
2. Click "Add MR"
3. Fill in:
   - MR ID: MR001
   - First Name: Test
   - Last Name: Rep
   - Phone: +919876543210 (USE YOUR REAL WHATSAPP NUMBER)
   - Group: Test Group
   - Comments: Test MR for WhatsApp
4. Click "Add MR"
```

### **Step 5: Create & Send Campaign**
```
1. Go to "Campaigns" in sidebar
2. Click "New Campaign"  
3. Fill in:
   - Message Content: "Hello! This is a test message from MR Communication Tool 📱"
   - Target Groups: ✓ Test Group (check the box)
   - Image: (Optional) Upload any image
   - Schedule: (Leave empty for immediate sending)
4. Click "Create Campaign"
```

### **Step 6: Monitor Campaign**
```
1. Campaign status will change: pending → sending → completed
2. Watch the progress bar fill up
3. Check statistics update in real-time:
   - Total Recipients: 1
   - Sent Count: 1  
   - Failed Count: 0
4. Check your WhatsApp - you should receive the message!
```

## 🧪 **API Testing Commands**

### **Test Backend Health**
```bash
# Basic health check
curl http://localhost:5001/api/health

# API documentation
curl http://localhost:5001/api
```

### **Test Authentication**
```bash
# Register user
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123", 
    "name": "Test User"
  }'

# Login user
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### **Test WhatsApp Integration**
```bash
# Set your JWT token (get from login response)
export TOKEN="your_jwt_token_here"

# Create group
curl -X POST http://localhost:5001/api/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"groupName": "API Test Group", "description": "Test via API"}'

# Add MR (replace with your WhatsApp number)
curl -X POST http://localhost:5001/api/mrs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "mrId": "API001",
    "firstName": "API",
    "lastName": "Test", 
    "phone": "+919876543210",
    "groupId": "GROUP_ID_FROM_ABOVE",
    "comments": "API test MR"
  }'

# Send campaign  
curl -X POST http://localhost:5001/api/messages/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "content": "API Test: Hello from MR Communication Tool! 🚀",
    "targetGroups": ["API Test Group"]
  }'

# Check campaign status
curl -X GET http://localhost:5001/api/messages/campaigns \
  -H "Authorization: Bearer $TOKEN"
```

## 📊 **Real-time Monitoring**

### **Backend Logs**
```bash
# Combined logs
tail -f backend/logs/combined.log

# Error logs only
tail -f backend/logs/error.log

# Filter WhatsApp logs
tail -f backend/logs/combined.log | grep -i whatsapp
```

### **Database Inspection**
```bash
# Connect to MongoDB
mongosh "mongodb://localhost:27017/mr_communication_tool"

# View collections
show collections

# Check campaigns (real-time status)
db.messagecampaigns.find().sort({createdAt: -1}).limit(5).pretty()

# Check message logs (delivery status)
db.messagelogs.find().sort({createdAt: -1}).limit(10).pretty()

# Check MRs
db.medicalrepresentatives.find().pretty()

# Exit MongoDB
exit
```

### **Queue Status (if using Redis)**
```bash
# Connect to Redis
redis-cli

# Check queue status
LLEN bull:message-queue:waiting
LLEN bull:message-queue:active
LLEN bull:message-queue:completed
LLEN bull:message-queue:failed

# Exit Redis
exit
```

## 🔍 **Troubleshooting**

### **Backend Won't Start**
```bash
cd backend

# Install dependencies
npm install

# Check for syntax errors
npm run build

# Start with detailed logs
npm run dev
```

### **Frontend Won't Start**
```bash
cd frontend

# Install dependencies  
npm install

# Clear cache
rm -rf node_modules/.vite
rm -rf dist

# Start frontend
npm run dev
```

### **WhatsApp Messages Not Sending**
```bash
# Check environment variables
cd backend
cat .env | grep WHATSAPP

# Test WhatsApp API directly
curl -H "Authorization: Bearer YOUR_WHATSAPP_TOKEN" \
  "https://graph.facebook.com/v18.0/me"

# Check phone number format
# Should be: +countrycode + number (e.g., +919876543210)
```

### **Database Connection Issues**
```bash
# If using Docker
docker-compose restart
docker-compose logs mongodb
docker-compose logs redis

# If using local services
brew services restart mongodb-community
brew services restart redis
```

## ✅ **Success Indicators**

### **Backend Success:**
```
🚀 Server running on port 5001
📱 Environment: development
🔗 API: http://localhost:5001/api
📊 Health: http://localhost:5001/api/health
```

### **Frontend Success:**
```
VITE v5.4.8 ready in XX ms
➜ Local: http://localhost:5173/
```

### **WhatsApp Success:**
```
WhatsApp message sent successfully
Message status: sent
Campaign status: completed
```

## 🎯 **Final Verification**

Your system is fully working when:

✅ **Backend server starts without errors**  
✅ **Frontend loads at http://localhost:5173**  
✅ **User can register and login**  
✅ **Groups can be created**  
✅ **MRs can be added**  
✅ **Campaigns can be created**  
✅ **WhatsApp messages are actually sent and received**  
✅ **Campaign status updates in real-time**  
✅ **Statistics track correctly**  

## 🎉 **You're All Set!**

Once you complete these steps, your **MR Communication Tool will be fully functional** with complete WhatsApp integration! 

**All the backend fixes have been applied and the system is ready for production use!** 🚀📱💬
