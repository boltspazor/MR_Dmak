# 🔐 Super Admin Setup Guide

## **Permanent Super Admin Credentials**

The MR Communication Tool has been configured with a permanent super admin account:

- **Email**: `sprabhjeet037@gmail.com`
- **Password**: `admin1234`
- **Name**: `Super Admin`
- **Role**: `super_admin`
- **Marketing Manager**: `true`

## **🚀 Quick Setup Commands**

### **1. Create/Update Super Admin**
```bash
cd backend
npm run create-permanent-super-admin
```

### **2. Start Backend Server**
```bash
cd backend
npm run dev
```

### **3. Start Frontend Server**
```bash
cd frontend
npm run dev
```

## **🔧 Backend Configuration**

### **Database Configuration**
The system is configured to use MongoDB with the following settings:
- **URI**: `mongodb://admin:admin123@localhost:27017/mr_communication_tool?authSource=admin`
- **Database**: `mr_communication_tool`
- **Authentication**: Enabled with admin user

### **Environment Variables**
Make sure your `.env` file contains:
```env
MONGODB_URI=mongodb://admin:admin123@localhost:27017/mr_communication_tool?authSource=admin
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
PORT=5001
```

## **📡 API Endpoints**

### **Authentication**
- `POST /api/auth/login` - Login with super admin credentials
- `POST /api/auth/register` - Register new users
- `GET /api/auth/me` - Get current user info

### **Super Admin Management**
- `POST /api/super-admin/create` - Create/update super admin
- `GET /api/super-admin/info` - Get super admin information
- `POST /api/super-admin/reset-password` - Reset super admin password
- `GET /api/super-admin/credentials` - Get super admin credentials

### **Core Features**
- `GET /api/mrs` - List medical representatives
- `POST /api/mrs/bulk-upload` - Upload CSV/Excel files
- `GET /api/groups` - List groups
- `POST /api/messages/send` - Send messages
- `GET /api/reports/dashboard` - Dashboard statistics

## **🧪 Testing the Setup**

### **1. Test Super Admin Login**
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "sprabhjeet037@gmail.com", "password": "admin1234"}'
```

### **2. Test Super Admin Info**
```bash
curl -X GET http://localhost:5001/api/super-admin/info
```

### **3. Test Health Check**
```bash
curl -X GET http://localhost:5001/api/health
```

## **🎯 Access the Application**

1. **Backend API**: http://localhost:5001
2. **Frontend App**: http://localhost:5173
3. **Login with**: 
   - Email: `sprabhjeet037@gmail.com`
   - Password: `admin1234`

## **🔒 Security Features**

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt with salt rounds
- **Role-based Access**: Super admin has full system access
- **Input Validation**: Joi schemas for all inputs
- **Rate Limiting**: Protection against brute force attacks

## **📊 Super Admin Capabilities**

As a super admin, you have access to:

1. **User Management**
   - Create and manage marketing managers
   - View all users in the system
   - Assign roles and permissions

2. **Medical Representatives**
   - Create, edit, and delete MRs
   - Bulk upload via CSV/Excel
   - Assign MRs to groups

3. **Group Management**
   - Create and manage MR groups
   - View group statistics
   - Export group data

4. **Message Campaigns**
   - Create and send message campaigns
   - Schedule messages
   - Track delivery status

5. **Reports & Analytics**
   - View comprehensive dashboards
   - Export reports
   - Monitor system performance

## **🛠️ Troubleshooting**

### **Common Issues**

1. **MongoDB Connection Failed**
   ```bash
   # Start MongoDB with Docker
   docker run -d --name mongodb-mr -p 27017:27017 \
     -e MONGO_INITDB_ROOT_USERNAME=admin \
     -e MONGO_INITDB_ROOT_PASSWORD=admin123 \
     mongo:latest
   ```

2. **Super Admin Login Failed**
   ```bash
   # Recreate super admin
   cd backend
   npm run create-permanent-super-admin
   ```

3. **Port Already in Use**
   ```bash
   # Kill existing processes
   pkill -f "ts-node-dev"
   pkill -f "vite"
   ```

## **📝 Next Steps**

1. **Login to the application** using the super admin credentials
2. **Create groups** for organizing medical representatives
3. **Upload MR data** using CSV/Excel bulk upload
4. **Create message campaigns** for communication
5. **Monitor reports** and analytics

## **🔄 Future Super Admin Management**

To add more super admins in the future:

1. **Via API** (requires existing super admin login):
   ```bash
   curl -X POST http://localhost:5001/api/super-admin/create \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"email": "new-admin@example.com", "password": "newpassword"}'
   ```

2. **Via Database** (direct MongoDB access):
   ```javascript
   // Connect to MongoDB and create user with role: 'super_admin'
   ```

---

**🎉 Your MR Communication Tool is now ready with permanent super admin access!**
