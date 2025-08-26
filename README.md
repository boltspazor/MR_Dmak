# 🚀 MR Communication Tool

A comprehensive web application for managing Medical Representatives (MRs), groups, and communication campaigns with WhatsApp integration. This tool provides both a full-featured backend system and a simplified frontend tool for immediate use.

## ✨ **Project Overview**

The MR Communication Tool consists of two main components:
1. **Full Backend System** - Complete CRUD operations, database management, and API endpoints
2. **Simplified Frontend Tool** - Browser-based tool using local storage for immediate use

## 🏗️ **Architecture**

### **Backend Stack**
- **Node.js** with **Express.js** framework
- **TypeScript** for type safety and better development experience
- **MongoDB** with **Mongoose** ODM for database operations
- **Redis** for caching and session management
- **JWT** for authentication and authorization
- **BullMQ** for job processing and queue management
- **WhatsApp Business API** integration for automated messaging

### **Frontend Stack**
- **React 18** with **TypeScript**
- **Vite** for fast development and building
- **Tailwind CSS** for modern, responsive styling
- **React Router** for navigation and routing
- **Local Storage** for simplified tool data persistence

## 🎯 **Core Features**

### **1. User Management & Authentication**
- User registration and login system
- JWT-based authentication
- Role-based access control (User/Admin)
- Secure password handling with bcrypt

### **2. Group Management**
- Create, edit, and delete MR groups
- Group statistics and analytics
- Export group data (JSON/CSV)
- Group activity tracking and history
- Bulk operations for multiple groups

### **3. Medical Representatives (MRs)**
- Complete CRUD operations for MRs
- Bulk upload via Excel/CSV files
- Download Excel templates
- Advanced search and filtering
- Group assignment and management
- Contact information management

### **4. Message Campaigns**
- Create and manage messaging campaigns
- Target specific groups or individual MRs
- Image attachment support
- Message scheduling and automation
- Campaign status tracking
- Delivery status monitoring

### **5. WhatsApp Integration**
- WhatsApp Business API integration
- Automated message sending
- Delivery status webhooks
- Message templates support
- Bulk messaging capabilities

### **6. Reports & Analytics**
- Comprehensive dashboard with key metrics
- Campaign performance reports
- Group statistics and analytics
- Export reports in multiple formats (JSON/CSV)
- Real-time statistics and monitoring

### **7. Simplified Tool (Local Storage)**
- Browser-based tool for immediate use
- No server setup required
- Local data persistence
- CSV import/export functionality
- WhatsApp Web integration (manual process)

## 🚀 **Quick Start Guide**

### **Prerequisites**
- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
- **MongoDB 6.0+** - Download from [mongodb.com](https://www.mongodb.com/try/download/community) or use MongoDB Atlas
- **Redis 6.0+** - Download from [redis.io](https://redis.io/download) or use Docker
- **npm or yarn** - Comes with Node.js, or install yarn: `npm install -g yarn`
- **Git** - Download from [git-scm.com](https://git-scm.com/)
- **Docker & Docker Compose** - Download from [docker.com](https://www.docker.com/products/docker-desktop/)

### **System Requirements**
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 10GB free space
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### **1. Clone the Repository**
```bash
git clone <your-repository-url>
cd MR_Project
```

### **2. Backend Setup**

#### **Install Dependencies**
```bash
cd backend
npm install
```

#### **Environment Configuration**
Create a `.env` file in the backend directory with the following detailed configuration:

```env
# ========================================
# DATABASE CONFIGURATION
# ========================================
# Local MongoDB (Default)
MONGODB_URI=mongodb://localhost:27017/mr_communication_tool

# MongoDB Atlas (Cloud Database)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mr_communication_tool

# MongoDB with Authentication
# MONGODB_URI=mongodb://username:password@localhost:27017/mr_communication_tool?authSource=admin

# ========================================
# REDIS CONFIGURATION
# ========================================
# Local Redis
REDIS_URL=redis://localhost:6379

# Redis with Authentication
# REDIS_URL=redis://username:password@localhost:6379

# Redis with Database Selection
# REDIS_URL=redis://localhost:6379/0

# ========================================
# JWT CONFIGURATION
# ========================================
# Generate a strong secret: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-super-secret-jwt-key-here-make-it-very-long-and-random
JWT_EXPIRES_IN=7d

# ========================================
# SERVER CONFIGURATION
# ========================================
PORT=5001
NODE_ENV=development
HOST=0.0.0.0

# ========================================
# WHATSAPP BUSINESS API (OPTIONAL)
# ========================================
# Get these from Meta Developer Console
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_VERIFY_TOKEN=your-verify-token
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id

# ========================================
# FRONTEND CONFIGURATION
# ========================================
FRONTEND_URL=http://localhost:5173

# ========================================
# SECURITY CONFIGURATION
# ========================================
# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS settings
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# ========================================
# LOGGING CONFIGURATION
# ========================================
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log
```

#### **Start MongoDB and Redis**

##### **Option 1: Docker Compose (Recommended)**
```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f mongodb
docker-compose logs -f redis

# Stop services
docker-compose down
```

##### **Option 2: Manual Installation**

**MongoDB Setup:**
```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community

# Ubuntu/Debian
sudo apt update
sudo apt install -y mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Windows
# Download and install from mongodb.com
# Start MongoDB service from Services app

# Verify MongoDB is running
mongosh --eval "db.runCommand('ping')"
```

**Redis Setup:**
```bash
# macOS (using Homebrew)
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt update
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Windows
# Download and install from redis.io
# Start Redis service from Services app

# Verify Redis is running
redis-cli ping
```

##### **Option 3: MongoDB Atlas (Cloud)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Set up database access (username/password)
5. Set up network access (IP whitelist)
6. Get connection string
7. Update your `.env` file with the connection string

**Example Atlas connection string:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/mr_communication_tool?retryWrites=true&w=majority
```

#### **Start the Backend**
```bash
# Install dependencies (if not done already)
npm install

# Development mode with hot reload
npm run dev

# Production build
npm run build
npm start

# Check for any missing dependencies
npm audit
npm audit fix
```

#### **Verify Backend is Running**
```bash
# Test health endpoint
curl http://localhost:5001/api/health

# Test API documentation
curl http://localhost:5001/api

# Check if MongoDB is connected
curl http://localhost:5001/api/groups

# Monitor backend logs
# The terminal should show:
# 🚀 Server running on port 5001
# 📱 Environment: development
# 🔗 API: http://localhost:5001/api
# 📊 Health: http://localhost:5001/api/health
```

#### **Backend Directory Structure**
```
backend/
├── src/
│   ├── controllers/     # API endpoint handlers
│   ├── services/        # Business logic
│   ├── models/          # Database models
│   ├── routes/          # API route definitions
│   ├── middleware/      # Authentication & validation
│   ├── utils/           # Helper functions
│   ├── config/          # Configuration files
│   └── app.ts           # Main application file
├── prisma/              # Database schema (if using Prisma)
├── uploads/             # File upload directory
├── logs/                # Application logs
├── package.json         # Dependencies and scripts
└── .env                 # Environment variables
```

### **3. Frontend Setup**

#### **Install Dependencies**
```bash
cd frontend
npm install

# If you encounter any issues, try:
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### **Environment Configuration**
Create a `.env` file in the frontend directory:
```env
# API Configuration
VITE_API_URL=http://localhost:5001/api

# Development Configuration
VITE_DEV_MODE=true
VITE_DEBUG_LEVEL=info

# Feature Flags
VITE_ENABLE_WHATSAPP=true
VITE_ENABLE_FILE_UPLOAD=true
VITE_ENABLE_EXPORT=true

# External Services (Optional)
VITE_GOOGLE_ANALYTICS_ID=your-ga-id
VITE_SENTRY_DSN=your-sentry-dsn
```

#### **Start the Frontend**
```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Check for build issues
npm run build --verbose
```

#### **Verify Frontend is Running**
```bash
# Check if frontend is accessible
curl http://localhost:5173

# Monitor frontend logs
# The terminal should show:
# VITE v5.4.8 ready in XX ms
# ➜ Local: http://localhost:5173/
# ➜ Network: use --host to expose
```

#### **Frontend Directory Structure**
```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── auth/         # Authentication components
│   │   ├── layout/       # Layout components
│   │   └── ui/           # Basic UI components
│   ├── pages/            # Page components
│   ├── contexts/         # React contexts
│   ├── lib/              # Utility libraries
│   ├── types/            # TypeScript type definitions
│   ├── App.tsx           # Main app component
│   └── main.tsx          # Entry point
├── public/               # Static assets
├── index.html            # HTML template
├── package.json          # Dependencies and scripts
├── tailwind.config.js    # Tailwind CSS configuration
├── vite.config.ts        # Vite configuration
└── .env                  # Environment variables
```

### **4. Access the Application**
- **Backend API**: http://localhost:5001
- **Frontend App**: http://localhost:5173
- **API Documentation**: http://localhost:5001/api
- **Health Check**: http://localhost:5001/api/health

## 📱 **How to Use the Application**

### **1. Getting Started**

#### **Step 1: First Time Setup**
1. **Start the Application**:
   ```bash
   # Terminal 1: Start Backend
   cd backend
   npm run dev
   
   # Terminal 2: Start Frontend
   cd frontend
   npm run dev
   ```

2. **Access the Application**:
   - Open browser and go to: `http://localhost:5173`
   - You should see the login/register page

#### **Step 2: Create Your Account**
1. **Click "Register"** on the login page
2. **Fill in the form**:
   - **Email**: `your-email@example.com`
   - **Password**: `your-secure-password`
   - **Name**: `Your Full Name`
3. **Click "Register"** to create account
4. **You'll be automatically logged in**

#### **Step 3: Explore the Dashboard**
1. **Dashboard Overview**:
   - View total MRs, groups, and campaigns
   - See recent activity and statistics
   - Quick access to all features

2. **Navigation Menu**:
   - **Dashboard**: Overview and statistics
   - **Groups**: Manage MR groups
   - **Medical Reps**: Manage individual MRs
   - **Campaigns**: Create and manage campaigns
   - **Reports**: View analytics and reports

### **2. Group Management**

#### **Step 1: Create Your First Group**
1. **Go to Groups**: Click "Groups" in the sidebar
2. **Click "Create Group"** button
3. **Fill in Group Details**:
   - **Group Name**: `North Zone`
   - **Description**: `Medical representatives in the northern region`
4. **Click "Create Group"**

#### **Step 2: Create Additional Groups**
```bash
# Recommended group structure:
- North Zone
- South Zone  
- East Zone
- West Zone
- Central Zone
- Specialists
- New Hires
```

#### **Step 3: Manage Groups**
1. **Edit Group**: Click edit icon on any group
2. **Delete Group**: Click delete icon (only if no MRs assigned)
3. **View Group Stats**: Click on group name to see details
4. **Export Group Data**: Use export button for CSV download

### **3. Medical Representatives**

#### **Step 1: Add Individual MRs**
1. **Go to Medical Reps**: Click "Medical Reps" in sidebar
2. **Click "Add MR"** button
3. **Fill in MR Details**:
   - **MR ID**: `MR001`
   - **First Name**: `John`
   - **Last Name**: `Doe`
   - **Phone**: `+919876543210`
   - **Email**: `john.doe@company.com`
   - **Group**: Select from dropdown
   - **Comments**: `Senior MR with 5 years experience`
4. **Click "Add MR"**

#### **Step 2: Bulk Upload MRs**
1. **Download Template**: Click "Download Template"
2. **Fill Excel File**:
   ```csv
   MR ID,First Name,Last Name,Phone,Group,Comments
   MR001,John,Doe,+919876543210,North Zone,Senior MR
   MR002,Jane,Smith,+919876543211,South Zone,New hire
   MR003,Mike,Johnson,+919876543212,East Zone,Specialist
   ```
3. **Upload File**: Drag & drop or click "Choose File"
4. **Review Data**: Check for any validation errors
5. **Click "Upload"** to create all MRs

#### **Step 3: Manage MRs**
1. **Search & Filter**: Use search bar to find specific MRs
2. **Edit MR**: Click edit icon to modify details
3. **Delete MR**: Click delete icon (with confirmation)
4. **Move Between Groups**: Use bulk actions to reassign MRs
5. **Export Data**: Download all MRs as CSV

### **4. Message Campaigns**

#### **Step 1: Create Your First Campaign**
1. **Go to Campaigns**: Click "Campaigns" in sidebar
2. **Click "New Campaign"** button
3. **Fill in Campaign Details**:
   - **Message Content**: `Hello team! We have an important update about our new product launch. Please review the attached materials and let us know if you have any questions.`
   - **Target Groups**: Select one or more groups
   - **Image (Optional)**: Upload product image or document
   - **Schedule (Optional)**: Set future delivery time
4. **Click "Create Campaign"**

#### **Step 2: Monitor Campaign Progress**
1. **Campaign Status**:
   - **Pending**: Campaign created, waiting to send
   - **Sending**: Messages being delivered
   - **Completed**: All messages sent successfully
   - **Failed**: Some messages failed to send

2. **Real-time Updates**:
   - View delivery status for each MR
   - See success/failure rates
   - Monitor delivery timestamps

#### **Step 3: Campaign Management**
1. **Edit Campaign**: Modify message content before sending
2. **Cancel Campaign**: Stop pending campaigns
3. **Resend Failed**: Retry failed message deliveries
4. **View Reports**: Detailed analytics and delivery logs

### **5. WhatsApp Integration**

#### **Step 1: Setup WhatsApp Business API**
1. **Meta Developer Account**:
   - Go to [developers.facebook.com](https://developers.facebook.com/)
   - Create new app or use existing
   - Add WhatsApp product

2. **Configure WhatsApp**:
   - Get Phone Number ID
   - Generate Access Token
   - Set Verify Token

3. **Update Environment**:
   ```env
   WHATSAPP_ACCESS_TOKEN=your-token
   WHATSAPP_PHONE_NUMBER_ID=your-phone-id
   WHATSAPP_VERIFY_TOKEN=your-verify-token
   ```

#### **Step 2: Send Messages via WhatsApp**
1. **Create Campaign**: Use the campaign creation process
2. **Select Groups**: Choose target MR groups
3. **Write Message**: Compose your message content
4. **Send Campaign**: Click send to deliver via WhatsApp
5. **Monitor Delivery**: Real-time status updates

#### **Step 3: WhatsApp Templates**
1. **Create Templates**:
   - Go to WhatsApp → Message Templates
   - Choose category (Marketing, Utility, etc.)
   - Write template text
   - Submit for approval

2. **Use Templates**:
   - Select approved template in campaigns
   - Customize variables
   - Send to target groups

### **6. Simplified Tool (Local Storage)**

#### **Step 1: Access the Tool**
1. **Navigate to**: `http://localhost:5173/simple-tool`
2. **Or use floating button**: Blue chat icon in bottom-right corner

#### **Step 2: Add Contacts**
1. **Manual Entry**:
   - Click "Add Contact" tab
   - Fill in MR details
   - Click "Add Contact"

2. **CSV Import**:
   - Download CSV template
   - Fill with your MR data
   - Upload via CSV import section

#### **Step 3: Organize Groups**
1. **Create Groups**: Use Groups tab to create regions
2. **Assign Contacts**: Move contacts between groups
3. **View Statistics**: See contact distribution

#### **Step 4: Send Messages**
1. **Select Groups**: Choose target groups
2. **Write Message**: Compose your message
3. **WhatsApp Integration**:
   - Click "Send to WhatsApp" → Opens WhatsApp Web
   - Use "Copy Phone Numbers" → Copies all numbers
   - Manually send message to each contact

### **7. Advanced Features**

#### **Reporting and Analytics**
1. **Dashboard Statistics**:
   - Total MRs, groups, and campaigns
   - Success rates and delivery metrics
   - Recent activity timeline

2. **Campaign Reports**:
   - Detailed delivery status
   - Group performance analysis
   - Export reports in CSV/JSON

3. **Group Analytics**:
   - MR distribution by group
   - Group performance metrics
   - Activity tracking

#### **Data Management**
1. **Export Options**:
   - Export MRs to CSV
   - Export groups to CSV
   - Export campaign reports

2. **Backup and Restore**:
   - Download data backups
   - Import data from backups
   - Data migration tools

#### **User Management**
1. **User Roles**:
   - **Admin**: Full access to all features
   - **User**: Limited access based on permissions

2. **Security Features**:
   - JWT authentication
   - Password hashing
   - Rate limiting
   - Input validation

### **2. Group Management**
1. **Create Groups**: Go to Groups → Create Group
   - Enter group name and description
   - Groups help organize MRs by regions, departments, etc.
2. **Manage Groups**: Edit, delete, or view group details
3. **Group Analytics**: View MR distribution and group statistics

### **3. Medical Representatives**
1. **Add MRs**: Go to Medical Reps → Add MR
   - Fill in MR ID, name, phone, email, and assign to group
   - Upload profile image (optional)
2. **Bulk Upload**: Use Excel/CSV import for multiple MRs
   - Download template from the interface
   - Fill in data and upload
3. **Manage MRs**: Search, filter, edit, or delete MRs
4. **Export Data**: Download MR data in CSV format

### **4. Message Campaigns**
1. **Create Campaign**: Go to Campaigns → New Campaign
   - Write your message content
   - Select target groups
   - Add images (optional)
   - Schedule delivery time
2. **Monitor Progress**: Track campaign status and delivery
3. **View Reports**: Analyze campaign performance

### **5. WhatsApp Integration**

#### **Step 1: Setup WhatsApp Business Account**
1. **Go to Meta Developer Console**:
   - Visit [developers.facebook.com](https://developers.facebook.com/)
   - Click "Get Started" or "Log In"
   - Create a new app or use existing one

2. **Add WhatsApp Product**:
   - In your app dashboard, click "Add Product"
   - Find "WhatsApp" and click "Set Up"
   - Follow the setup wizard

3. **Configure WhatsApp Business API**:
   - Go to WhatsApp → Getting Started
   - Note down your **Phone Number ID**
   - Generate an **Access Token**
   - Set a **Verify Token** (custom string)

#### **Step 2: Configure Webhooks**
1. **Set Webhook URL**:
   ```
   Webhook URL: https://yourdomain.com/api/webhook
   Verify Token: your-custom-verify-token
   ```

2. **Subscribe to Events**:
   - `messages` - Incoming messages
   - `message_deliveries` - Delivery confirmations
   - `message_reads` - Read receipts

#### **Step 3: Update Environment Variables**
```env
# WhatsApp Business API Configuration
WHATSAPP_ACCESS_TOKEN=your-access-token-here
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_VERIFY_TOKEN=your-verify-token
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id
```

#### **Step 4: Test WhatsApp Integration**
1. **Send Test Message**:
   - Go to Campaigns → New Campaign
   - Select a group with MRs
   - Write a test message
   - Click "Send Campaign"

2. **Monitor Delivery**:
   - Check campaign status in real-time
   - View delivery reports
   - Monitor webhook events

#### **Step 5: Troubleshooting WhatsApp Issues**
```bash
# Check webhook configuration
curl -X GET "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID?fields=webhook_url&access_token=YOUR_ACCESS_TOKEN"

# Test webhook endpoint
curl -X POST "https://yourdomain.com/api/webhook" \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'

# Verify access token
curl -X GET "https://graph.facebook.com/v18.0/me?access_token=YOUR_ACCESS_TOKEN"
```

#### **WhatsApp API Rate Limits**
- **Messages per second**: 1 message per second per phone number
- **Daily message limit**: 1000 messages per day per phone number
- **Template messages**: Unlimited (for approved templates)
- **Session messages**: 24-hour window after user's last message

#### **Message Templates**
1. **Create Template**:
   - Go to WhatsApp → Message Templates
   - Click "Create Template"
   - Choose category (Marketing, Utility, etc.)
   - Write template text
   - Submit for approval

2. **Use Template in Campaigns**:
   - Select approved template
   - Customize variables
   - Send to target groups

### **6. Simplified Tool (Local Storage)**
1. **Access**: Navigate to `/simple-tool` or click "Simple MR Tool"
2. **Add Contacts**: Manually add MRs or import CSV
3. **Create Groups**: Organize contacts by regions
4. **Send Messages**: 
   - Select target groups
   - Write message content
   - Click "Send to WhatsApp" to open WhatsApp Web
   - Copy phone numbers and send manually

## 🔧 **API Endpoints**

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### **Groups**
- `GET /api/groups` - List all groups
- `POST /api/groups` - Create group
- `GET /api/groups/:id` - Get group details
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group
- `GET /api/groups/:id/stats` - Group statistics
- `GET /api/groups/:id/export` - Export group data

### **Medical Representatives**
- `GET /api/mrs` - List all MRs
- `POST /api/mrs` - Create MR
- `PUT /api/mrs/:id` - Update MR
- `DELETE /api/mrs/:id` - Delete MR
- `POST /api/mrs/bulk-upload` - Bulk upload
- `GET /api/mrs/template` - Download template

### **Messages**
- `POST /api/messages/send` - Send message
- `POST /api/messages/upload-image` - Upload image
- `GET /api/messages/campaigns` - List campaigns
- `GET /api/messages/campaigns/stats` - Campaign statistics
- `GET /api/messages/campaign/:id/report` - Campaign report

### **Reports**
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/campaign/:id` - Detailed campaign report
- `GET /api/reports/campaign/:id/export` - Export campaign report

### **Webhooks**
- `GET /api/webhook` - WhatsApp verification
- `POST /api/webhook` - WhatsApp events

## 🗄️ **Database Schema**

### **Core Collections**
- **users** - User accounts and authentication
- **groups** - MR groups and organization
- **medical_representatives** - Individual MR records
- **messages** - Message content and templates
- **message_campaigns** - Campaign management
- **message_logs** - Message delivery tracking
- **group_activities** - Activity logging

### **Key Relationships**
- Users can create multiple groups
- Groups contain multiple MRs
- Messages are sent to groups
- Campaigns track message delivery
- Logs record delivery status

## 🔒 **Security Features**

- **JWT Authentication** with secure token handling
- **Password Hashing** using bcrypt
- **CORS Protection** for cross-origin requests
- **Rate Limiting** to prevent abuse
- **Input Validation** with Joi schemas
- **MongoDB Injection Protection** via Mongoose
- **XSS Protection** with proper encoding

## 📊 **Performance Features**

- **Redis Caching** for frequently accessed data
- **Database Indexing** for fast queries
- **Pagination** for large datasets
- **Lazy Loading** for images and content
- **Optimized Queries** with Mongoose
- **Background Job Processing** with BullMQ

## 🚨 **Troubleshooting**

### **Common Issues & Solutions**

#### **1. MongoDB Connection Issues**

**Problem**: `MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017`

**Solutions**:
```bash
# Check if MongoDB is running
docker ps | grep mongodb

# If using Docker Compose
docker-compose restart mongodb
docker-compose logs -f mongodb

# If using local MongoDB
sudo systemctl status mongodb
sudo systemctl start mongodb

# Check MongoDB port
netstat -tlnp | grep 27017
lsof -i :27017

# Test MongoDB connection
mongosh --eval "db.runCommand('ping')"
```

**MongoDB Atlas Issues**:
```bash
# Check network access (IP whitelist)
# Add your IP to MongoDB Atlas Network Access

# Check connection string format
# Ensure username/password are URL encoded
# Example: username%40domain.com for username@domain.com

# Test connection string
mongosh "mongodb+srv://username:password@cluster.mongodb.net/test"
```

#### **2. Redis Connection Issues**

**Problem**: `Redis connection failed`

**Solutions**:
```bash
# Check if Redis is running
docker ps | grep redis

# If using Docker Compose
docker-compose restart redis
docker-compose logs -f redis

# If using local Redis
sudo systemctl status redis-server
sudo systemctl start redis-server

# Check Redis port
netstat -tlnp | grep 6379
lsof -i :6379

# Test Redis connection
redis-cli ping
```

#### **3. Frontend Build Issues**

**Problem**: `Module not found` or build failures

**Solutions**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Clear Vite cache
rm -rf node_modules/.vite
rm -rf dist

# Check Node.js version
node --version
# Should be 18+ for this project

# Update dependencies
npm update
npm audit fix

# Check for TypeScript errors
npx tsc --noEmit
```

#### **4. Backend API Errors**

**Problem**: `500 Internal Server Error` or connection refused

**Solutions**:
```bash
# Check backend logs
cd backend
npm run dev

# Verify environment variables
cat .env

# Test API endpoints
curl http://localhost:5001/api/health
curl http://localhost:5001/api

# Check if port is in use
lsof -i :5001
netstat -tlnp | grep 5001

# Kill process using port (if needed)
sudo kill -9 $(lsof -t -i:5001)
```

#### **5. Authentication Issues**

**Problem**: `JWT token invalid` or `Unauthorized`

**Solutions**:
```bash
# Check JWT secret in .env
# Should be a long, random string

# Generate new JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Clear browser local storage
# Remove authToken from localStorage

# Check token expiration
# Default is 7 days, adjust in .env if needed

# Verify user exists in database
# Check MongoDB users collection
```

#### **6. File Upload Issues**

**Problem**: `File upload failed` or `File too large`

**Solutions**:
```bash
# Check upload directory permissions
ls -la backend/uploads/
chmod 755 backend/uploads/

# Check file size limits
# Default is 10MB, adjust in backend code

# Verify file types
# Only images are allowed by default

# Check disk space
df -h
du -sh backend/uploads/
```

#### **7. WhatsApp Integration Issues**

**Problem**: `WhatsApp API error` or webhook failures

**Solutions**:
```bash
# Verify API credentials
curl -X GET "https://graph.facebook.com/v18.0/me?access_token=YOUR_TOKEN"

# Check webhook configuration
curl -X GET "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID?fields=webhook_url&access_token=YOUR_TOKEN"

# Test webhook endpoint
curl -X POST "https://yourdomain.com/api/webhook" \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'

# Check webhook logs
# Monitor backend logs for webhook events

# Verify phone number format
# Should be international format: +1234567890
```

## 🔧 **Development Workflow**

### **Backend Development**

#### **Initial Setup**
```bash
cd backend

# Install dependencies
npm install

# Check for security vulnerabilities
npm audit
npm audit fix

# Verify TypeScript compilation
npx tsc --noEmit

# Check code quality
npm run lint
npm run lint:fix
```

#### **Development Commands**
```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Database operations (if using Prisma)
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema changes
npm run db:migrate     # Run migrations
npm run db:studio      # Open Prisma Studio

# Code quality tools
npm run lint           # ESLint check
npm run lint:fix       # ESLint auto-fix
npm run format         # Prettier formatting
```

#### **Backend Development Tips**
1. **Environment Management**:
   ```bash
   # Create different .env files
   cp .env .env.development
   cp .env .env.production
   cp .env .env.test
   
   # Use appropriate file for each environment
   NODE_ENV=development npm run dev
   NODE_ENV=production npm start
   ```

2. **Database Development**:
   ```bash
   # Connect to MongoDB shell
   mongosh
   use mr_communication_tool
   
   # View collections
   show collections
   
   # Query data
   db.groups.find()
   db.medical_representatives.find()
   ```

3. **API Testing**:
   ```bash
   # Test endpoints with curl
   curl -X POST http://localhost:5001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
   
   # Test with authentication
   curl -X GET http://localhost:5001/api/groups \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

4. **Logging and Debugging**:
   ```bash
   # Monitor logs in real-time
   tail -f logs/combined.log
   tail -f logs/error.log
   
   # Set debug level
   LOG_LEVEL=debug npm run dev
   ```

### **Frontend Development**

#### **Initial Setup**
```bash
cd frontend

# Install dependencies
npm install

# Check for security vulnerabilities
npm audit
npm audit fix

# Verify TypeScript compilation
npx tsc --noEmit

# Check code quality
npm run lint
npm run lint:fix
```

#### **Development Commands**
```bash
# Development mode with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Code quality tools
npm run lint           # ESLint check
npm run lint:fix       # ESLint auto-fix
npm run format         # Prettier formatting
```

#### **Frontend Development Tips**
1. **Component Development**:
   ```bash
   # Create new component
   mkdir -p src/components/new-feature
   touch src/components/new-feature/NewFeature.tsx
   touch src/components/new-feature/index.ts
   
   # Create new page
   touch src/pages/NewPage.tsx
   # Add route in App.tsx
   ```

2. **State Management**:
   ```bash
   # Use React DevTools for debugging
   # Install browser extension for React DevTools
   
   # Monitor local storage
   # Open DevTools → Application → Local Storage
   ```

3. **API Integration**:
   ```bash
   # Test API calls in browser console
   # Use Network tab in DevTools
   # Monitor API responses and errors
   ```

4. **Styling and UI**:
   ```bash
   # Tailwind CSS classes
   # Use Tailwind CSS IntelliSense extension
   # Customize in tailwind.config.js
   ```

### **Database Development**

#### **MongoDB Operations**
```bash
# Connect to MongoDB
mongosh "mongodb://localhost:27017/mr_communication_tool"

# Create collections
db.createCollection("users")
db.createCollection("groups")
db.createCollection("medical_representatives")

# Insert sample data
db.groups.insertOne({
  groupName: "North Zone",
  description: "North region medical representatives",
  userId: ObjectId("..."),
  createdAt: new Date()
})

# Query data
db.groups.find({ groupName: "North Zone" })
db.medical_representatives.find({ groupId: ObjectId("...") })

# Update data
db.groups.updateOne(
  { groupName: "North Zone" },
  { $set: { description: "Updated description" } }
)

# Delete data
db.groups.deleteOne({ groupName: "North Zone" })
```

#### **Redis Operations**
```bash
# Connect to Redis
redis-cli

# Set key-value pairs
SET user:123 "user data"
SET campaign:456 "campaign data"

# Get values
GET user:123
GET campaign:456

# Set expiration
EXPIRE user:123 3600  # Expires in 1 hour

# List keys
KEYS user:*
KEYS campaign:*

# Delete keys
DEL user:123
DEL campaign:456
```

### **Testing Strategy**

#### **Backend Testing**
```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "User Controller"

# Run tests with specific environment
NODE_ENV=test npm test
```

#### **Frontend Testing**
```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --grep "Dashboard"

# Run tests with specific environment
NODE_ENV=test npm test
```

### **Code Quality Tools**

#### **ESLint Configuration**
```bash
# Check for linting errors
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Check specific files
npx eslint src/**/*.ts src/**/*.tsx

# Generate linting report
npm run lint:report
```

#### **Prettier Configuration**
```bash
# Format all files
npm run format

# Check formatting
npm run format:check

# Format specific files
npx prettier --write src/**/*.ts src/**/*.tsx
```

### **Git Workflow**

#### **Branch Strategy**
```bash
# Create feature branch
git checkout -b feature/new-feature

# Create bugfix branch
git checkout -b bugfix/fix-issue

# Create hotfix branch
git checkout -b hotfix/critical-fix

# Push branch to remote
git push -u origin feature/new-feature
```

#### **Commit Guidelines**
```bash
# Conventional commits
git commit -m "feat: add user authentication"
git commit -m "fix: resolve MongoDB connection issue"
git commit -m "docs: update API documentation"
git commit -m "style: format code with prettier"
git commit -m "refactor: restructure user service"
git commit -m "test: add unit tests for auth controller"
```

#### **Pull Request Process**
1. **Create PR** from feature branch to main
2. **Add description** of changes
3. **Link issues** if applicable
4. **Request review** from team members
5. **Address feedback** and make changes
6. **Merge** after approval

#### **2. Redis Connection Issues**
```bash
# Check if Redis is running
docker ps | grep redis

# Restart Redis container
docker-compose restart redis

# Check Redis logs
docker logs mr_redis
```

#### **3. Frontend Build Issues**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

#### **4. Backend API Errors**
```bash
# Check backend logs
cd backend
npm run dev

# Verify environment variables
cat .env

# Test API endpoints
curl http://localhost:5001/api/health
```

### **WhatsApp Integration Issues**
1. **Verify API Credentials**: Check access token and phone number ID
2. **Webhook Configuration**: Ensure webhook endpoints are accessible
3. **Message Templates**: Verify message templates are approved
4. **Rate Limits**: Respect WhatsApp API rate limits

## 🧪 **Testing**

### **Backend Testing**
```bash
cd backend

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### **Frontend Testing**
```bash
cd frontend

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🚀 **Deployment & Production**

### **Production Environment Setup**

#### **1. Environment Configuration**
Create production `.env` files:

**Backend Production (.env.production)**:
```env
# ========================================
# PRODUCTION CONFIGURATION
# ========================================
NODE_ENV=production
PORT=5001
HOST=0.0.0.0

# Database (Use production MongoDB)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mr_communication_tool?retryWrites=true&w=majority

# Redis (Use production Redis)
REDIS_URL=redis://username:password@redis-server:6379

# JWT (Use strong secret)
JWT_SECRET=your-production-jwt-secret-here
JWT_EXPIRES_IN=7d

# Security
RATE_LIMIT_MAX_REQUESTS=50
LOG_LEVEL=warn

# WhatsApp (Production credentials)
WHATSAPP_ACCESS_TOKEN=your-production-token
WHATSAPP_PHONE_NUMBER_ID=your-production-phone-id
WHATSAPP_VERIFY_TOKEN=your-production-verify-token

# Frontend URL
FRONTEND_URL=https://yourdomain.com
```

**Frontend Production (.env.production)**:
```env
VITE_API_URL=https://yourdomain.com/api
VITE_DEV_MODE=false
VITE_DEBUG_LEVEL=error
```

#### **2. Production Build Process**

**Backend Build**:
```bash
cd backend

# Install production dependencies
npm ci --only=production

# Build the application
npm run build

# Test production build
npm start

# Create production directory
mkdir -p /var/www/mr-backend
cp -r dist/* /var/www/mr-backend/
cp package.json /var/www/mr-backend/
cp .env.production /var/www/mr-backend/.env
```

**Frontend Build**:
```bash
cd frontend

# Install dependencies
npm ci

# Build for production
npm run build

# Test production build
npm run preview

# Create production directory
mkdir -p /var/www/mr-frontend
cp -r dist/* /var/www/mr-frontend/
```

### **Server Deployment Options**

#### **Option 1: PM2 Process Manager (Recommended)**

**Install PM2**:
```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'mr-backend',
    script: './dist/app.js',
    cwd: '/var/www/mr-backend',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10
  }]
};
EOF
```

**Start with PM2**:
```bash
# Start the application
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup

# Monitor the application
pm2 monit
pm2 logs
```

#### **Option 2: Docker Deployment**

**Create Production Dockerfile**:
```dockerfile
# Backend Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5001

CMD ["npm", "start"]
```

**Docker Compose Production**:
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: mr_mongodb_prod
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: secure_password
    networks:
      - mr_network

  redis:
    image: redis:7.2-alpine
    container_name: mr_redis_prod
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --requirepass secure_redis_password
    networks:
      - mr_network

  backend:
    build: ./backend
    container_name: mr_backend_prod
    restart: unless-stopped
    ports:
      - "5001:5001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://admin:secure_password@mongodb:27017/mr_communication_tool?authSource=admin
      - REDIS_URL=redis://:secure_redis_password@redis:6379
    volumes:
      - ./backend/uploads:/app/uploads
      - ./backend/logs:/app/logs
    depends_on:
      - mongodb
      - redis
    networks:
      - mr_network

  frontend:
    build: ./frontend
    container_name: mr_frontend_prod
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./frontend/dist:/usr/share/nginx/html
    networks:
      - mr_network

volumes:
  mongodb_data:
  redis_data:

networks:
  mr_network:
    driver: bridge
```

**Deploy with Docker**:
```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### **Option 3: Nginx Reverse Proxy**

**Install Nginx**:
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

**Configure Nginx**:
```nginx
# /etc/nginx/sites-available/mr-communication-tool
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # Frontend
    location / {
        root /var/www/mr-frontend;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
        limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    }
    
    # File uploads
    location /uploads/ {
        alias /var/www/mr-backend/uploads/;
        expires 1d;
        add_header Cache-Control "public";
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

**Enable Site**:
```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/mr-communication-tool /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### **SSL Certificate Setup**

#### **Let's Encrypt (Free SSL)**:
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

### **Monitoring and Maintenance**

#### **Application Monitoring**:
```bash
# PM2 monitoring
pm2 monit
pm2 logs --lines 100

# System monitoring
htop
iotop
df -h

# Log monitoring
tail -f /var/www/mr-backend/logs/combined.log
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

#### **Database Maintenance**:
```bash
# MongoDB backup
mongodump --uri="mongodb://username:password@localhost:27017/mr_communication_tool" --out=/backup/$(date +%Y%m%d)

# Redis backup
redis-cli BGSAVE

# Regular cleanup
# Remove old logs
find /var/www/mr-backend/logs -name "*.log" -mtime +30 -delete

# Clean uploads (old files)
find /var/www/mr-backend/uploads -name "*" -mtime +90 -delete
```

#### **Performance Optimization**:
```bash
# Enable Gzip compression in Nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

# Enable caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### **Backup Strategy**

#### **Automated Backup Script**:
```bash
#!/bin/bash
# /usr/local/bin/backup-mr-tool.sh

BACKUP_DIR="/backup/mr-tool"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR/$DATE

# Backup MongoDB
mongodump --uri="mongodb://username:password@localhost:27017/mr_communication_tool" --out=$BACKUP_DIR/$DATE/mongodb

# Backup Redis
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb $BACKUP_DIR/$DATE/redis.rdb

# Backup application files
cp -r /var/www/mr-backend/uploads $BACKUP_DIR/$DATE/
cp -r /var/www/mr-backend/logs $BACKUP_DIR/$DATE/

# Backup configuration
cp /var/www/mr-backend/.env $BACKUP_DIR/$DATE/
cp /etc/nginx/sites-available/mr-communication-tool $BACKUP_DIR/$DATE/

# Compress backup
tar -czf $BACKUP_DIR/mr-tool-backup-$DATE.tar.gz -C $BACKUP_DIR $DATE

# Remove uncompressed backup
rm -rf $BACKUP_DIR/$DATE

# Keep only last 7 backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: mr-tool-backup-$DATE.tar.gz"
```

**Setup Cron Job**:
```bash
# Add to crontab
sudo crontab -e

# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-mr-tool.sh
```

### **Frontend Deployment**
1. Build the application: `npm run build`
2. Deploy `dist` folder to web server
3. Configure environment variables
4. Set up CDN for static assets

### **Docker Deployment**
```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Or build individual images
docker build -t mr-backend ./backend
docker build -t mr-frontend ./frontend
```

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📝 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints
- Check troubleshooting section

## 🔄 **Changelog**

### **v1.0.0**
- Initial release
- Core CRUD operations
- WhatsApp integration
- Dashboard and reporting
- User authentication
- Group management
- Message campaigns
- Simplified local storage tool

## 🙏 **Acknowledgments**

- Built with modern web technologies
- Inspired by real-world MR management needs
- Community contributions welcome
- WhatsApp Business API integration

---

**Made with ❤️ for the medical community**

## 📞 **Contact**

For questions, support, or collaboration:
- **Repository**: [GitHub Repository URL]
- **Issues**: [GitHub Issues URL]
- **Documentation**: [Documentation URL]

---

**Happy Messaging! 🚀📱**
