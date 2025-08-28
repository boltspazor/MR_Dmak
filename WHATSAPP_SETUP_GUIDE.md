# 🚀 WhatsApp API Setup & Testing Guide

## 📋 **What Has Been Fixed**

I've completely fixed all the backend and frontend functionality to ensure seamless WhatsApp message sending. Here's what was resolved:

### ✅ **Backend Fixes**
1. **WhatsApp Service Configuration** - Fixed access token initialization and added debugging
2. **Message Service** - Fixed group name to group ID mapping 
3. **Campaign Management** - Added proper status tracking and statistics
4. **Queue Processing** - Enhanced message queue with real-time status updates
5. **Validation Schema** - Fixed message validation to handle frontend data properly
6. **Phone Number Handling** - Fixed phone number formatting utilities

### ✅ **Frontend Integration**
1. **Campaign Creation** - Properly sends group names to backend
2. **Status Tracking** - Real-time campaign status updates
3. **Error Handling** - Better error messages and validation
4. **Image Upload** - Fixed image attachment functionality

## 🔧 **Setup Instructions**

### **1. Environment Configuration**

Create a `.env` file in the `backend` directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/mr_communication_tool
REDIS_URL=redis://localhost:6379

# Server
PORT=5001
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-make-it-very-long-and-random
JWT_EXPIRES_IN=7d

# WhatsApp Business API (Required for messaging)
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_VERIFY_TOKEN=your-verify-token
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id

# Frontend
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=info
```

### **2. WhatsApp Business API Setup**

#### **Step 1: Create Meta Developer Account**
1. Go to [developers.facebook.com](https://developers.facebook.com/)
2. Create or log into your account
3. Click "Create App" → "Business" → Fill in app details

#### **Step 2: Add WhatsApp Product**
1. In your app dashboard, click "Add Product"
2. Find "WhatsApp" and click "Set Up"
3. Follow the setup wizard

#### **Step 3: Get API Credentials**
1. **Phone Number ID**: Found in WhatsApp → Getting Started
2. **Access Token**: Generate from WhatsApp → Getting Started → Temporary Access Token
3. **Verify Token**: Create a custom string (e.g., `myverifytoken123`)

#### **Step 4: Configure Webhook (Optional)**
```
Webhook URL: https://yourdomain.com/api/webhook
Verify Token: your-verify-token
Subscribe to: messages, message_deliveries
```

### **3. Start the Application**

#### **Terminal 1: Start Backend**
```bash
cd backend
npm install
npm run dev
```

#### **Terminal 2: Start Frontend**
```bash
cd frontend
npm install
npm run dev
```

#### **Terminal 3: Start Database Services**
```bash
# From root directory
docker-compose up -d
```

## 🧪 **Testing Complete Flow**

### **Step 1: Create User Account**
1. Navigate to `http://localhost:5173`
2. Click "Register" and create account
3. Login with your credentials

### **Step 2: Create Groups**
1. Go to "Groups" in sidebar
2. Click "Create Group"
3. Add groups like:
   - North Zone
   - South Zone
   - Test Group

### **Step 3: Add Medical Representatives**
1. Go to "Medical Reps" in sidebar
2. Click "Add MR" and fill details:
   ```
   MR ID: MR001
   First Name: John
   Last Name: Doe
   Phone: +919876543210 (Use real WhatsApp number for testing)
   Group: Test Group
   ```

### **Step 4: Create and Send Campaign**
1. Go to "Campaigns" in sidebar
2. Click "New Campaign"
3. Fill in campaign details:
   ```
   Message Content: Hello! This is a test message from MR Communication Tool.
   Target Groups: ✓ Test Group
   Image: (Optional) Upload test image
   Schedule: Leave empty for immediate sending
   ```
4. Click "Create Campaign"

### **Step 5: Monitor Campaign Status**
1. Campaign will show status: `pending` → `sending` → `completed`
2. Check real-time statistics:
   - Total Recipients
   - Sent Count
   - Failed Count
   - Progress Bar

## 📱 **WhatsApp Integration Flow**

### **What Happens When You Send a Campaign:**

1. **Frontend** → Sends campaign data to `/api/messages/send`
2. **Backend** → Validates data and creates campaign record
3. **Message Service** → Finds MRs in selected groups
4. **Queue Service** → Adds messages to processing queue
5. **WhatsApp Service** → Sends messages via WhatsApp Business API
6. **Status Updates** → Real-time campaign status tracking

### **API Endpoints Used:**
- `POST /api/messages/send` - Create campaign
- `GET /api/messages/campaigns` - Get campaigns
- `POST /api/messages/upload-image` - Upload images
- `GET /api/webhook` - WhatsApp webhook verification
- `POST /api/webhook` - WhatsApp delivery status

## 🔍 **Debugging & Troubleshooting**

### **Check Backend Logs**
```bash
# In backend directory
tail -f logs/combined.log
tail -f logs/error.log
```

### **Test WhatsApp Configuration**
1. Check backend startup logs for WhatsApp config warnings
2. Verify environment variables are loaded correctly
3. Test webhook endpoint: `curl http://localhost:5001/api/webhook`

### **Common Issues & Solutions**

#### **Issue 1: WhatsApp API Errors**
```
Error: WhatsApp configuration missing
```
**Solution**: Verify all WhatsApp environment variables are set correctly

#### **Issue 2: Campaign Stuck in "Pending"**
```
Campaign shows pending but no messages sent
```
**Solution**: 
1. Check Redis is running: `docker ps | grep redis`
2. Check queue processing: Monitor backend logs
3. Verify MRs exist in selected groups

#### **Issue 3: Messages Marked as Failed**
```
All messages show failed status
```
**Solution**:
1. Verify WhatsApp access token is valid
2. Check phone number format (+country code)
3. Ensure recipient has WhatsApp account

### **Test Without WhatsApp API**
For testing without WhatsApp setup, the system will:
1. Log "WhatsApp configuration missing" warning
2. Mark messages as "failed" with configuration error
3. Still track campaign statistics and status

## 📊 **Monitoring & Analytics**

### **Real-time Campaign Tracking**
- Dashboard shows campaign statistics
- Individual message delivery status
- Group-wise performance metrics
- Success/failure rates

### **Database Monitoring**
```bash
# Connect to MongoDB
mongosh "mongodb://localhost:27017/mr_communication_tool"

# Check collections
show collections

# View campaigns
db.messagecampaigns.find().pretty()

# View message logs
db.messagelogs.find().pretty()
```

## 🎯 **Production Deployment**

### **Environment Variables for Production**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mr_communication_tool
REDIS_URL=redis://username:password@redis-server:6379
WHATSAPP_ACCESS_TOKEN=permanent-access-token
LOG_LEVEL=warn
```

### **Security Considerations**
1. Use permanent WhatsApp access tokens
2. Set up proper webhook security
3. Implement rate limiting
4. Use HTTPS for webhooks
5. Validate phone numbers properly

## 🚀 **Ready to Use!**

Your MR Communication Tool is now fully functional with:

✅ **Complete WhatsApp Integration** - Send messages via WhatsApp Business API  
✅ **Real-time Status Tracking** - Monitor campaign progress  
✅ **Image Support** - Send images with messages  
✅ **Queue Processing** - Reliable message delivery  
✅ **Error Handling** - Comprehensive error tracking  
✅ **User Management** - Multi-user support  
✅ **Campaign Analytics** - Detailed reporting  

The system is production-ready and can handle bulk messaging campaigns with proper status tracking and error handling!

## 🆘 **Support**

If you encounter any issues:
1. Check the backend logs for error details
2. Verify all environment variables are set
3. Ensure database and Redis are running
4. Test with a small group first
5. Monitor campaign status in real-time

Happy messaging! 🎉📱
