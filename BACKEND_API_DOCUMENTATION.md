# 🚀 Backend API Documentation

## 📋 **Overview**

This document provides a comprehensive list of all available APIs in your MR Communication Tool backend. All APIs are RESTful and require authentication via JWT tokens.

**Base URL**: `http://localhost:5000/api` (or your configured domain)

## 🔐 **Authentication**

### **Headers Required**
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### **Error Responses**
```json
{
  "error": "Error message",
  "details": ["Validation errors if any"]
}
```

---

## 🔑 **Authentication APIs**

### **1. User Registration**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

**Response (201)**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

### **2. User Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200)**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  },
  "token": "jwt_token_here"
}
```

### **3. Get Current User**
```http
GET /api/auth/me
Authorization: Bearer <JWT_TOKEN>
```

**Response (200)**
```json
{
  "message": "User retrieved successfully",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

### **4. Refresh Token**
```http
POST /api/auth/refresh
Authorization: Bearer <JWT_TOKEN>
```

**Response (200)**
```json
{
  "message": "Token refreshed successfully",
  "token": "new_jwt_token_here"
}
```

---

## 👥 **Medical Representatives (MRs) APIs**

### **1. Create MR**
```http
POST /api/mrs
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "mrId": "MR001",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+919876543210",
  "email": "john.doe@example.com",
  "groupId": "group_id_here",
  "comments": "Senior MR with 5 years experience"
}
```

**Response (201)**
```json
{
  "message": "MR created successfully",
  "mr": {
    "id": "mr_id",
    "mrId": "MR001",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+919876543210",
    "email": "john.doe@example.com",
    "groupId": "group_id_here",
    "comments": "Senior MR with 5 years experience",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### **2. Bulk Upload MRs**
```http
POST /api/mrs/bulk-upload
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

file: excel_file.xlsx
```

**Response (200)**
```json
{
  "message": "Bulk upload completed",
  "created": 25,
  "errors": [],
  "totalProcessed": 25
}
```

### **3. Get All MRs**
```http
GET /api/mrs?groupId=group_id&search=john&limit=50&offset=0
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `groupId` (optional): Filter by group
- `search` (optional): Search in name, MR ID, or phone
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response (200)**
```json
{
  "message": "MRs retrieved successfully",
  "data": [
    {
      "id": "mr_id",
      "mrId": "MR001",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+919876543210",
      "email": "john.doe@example.com",
      "groupId": {
        "id": "group_id",
        "groupName": "North Zone"
      },
      "comments": "Senior MR",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2,
    "hasMore": true
  }
}
```

### **4. Update MR**
```http
PUT /api/mrs/:id
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "firstName": "Johnny",
  "phone": "+919876543211",
  "comments": "Updated comments"
}
```

**Response (200)**
```json
{
  "message": "MR updated successfully"
}
```

### **5. Delete MR**
```http
DELETE /api/mrs/:id
Authorization: Bearer <JWT_TOKEN>
```

**Response (200)**
```json
{
  "message": "MR deleted successfully"
}
```

### **6. Download Template**
```http
GET /api/mrs/template
Authorization: Bearer <JWT_TOKEN>
```

**Response**: Excel file download

---

## 🏷️ **Groups APIs**

### **1. Create Group**
```http
POST /api/groups
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "groupName": "North Zone",
  "description": "Medical Representatives in North Zone"
}
```

**Response (201)**
```json
{
  "message": "Group created successfully",
  "group": {
    "id": "group_id",
    "groupName": "North Zone",
    "description": "Medical Representatives in North Zone",
    "createdBy": "user_id",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### **2. Get All Groups**
```http
GET /api/groups
Authorization: Bearer <JWT_TOKEN>
```

**Response (200)**
```json
{
  "message": "Groups retrieved successfully",
  "data": [
    {
      "id": "group_id",
      "groupName": "North Zone",
      "description": "Medical Representatives in North Zone",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "_count": {
        "medicalRepresentatives": 25
      }
    }
  ],
  "total": 5
}
```

### **3. Get Group by ID**
```http
GET /api/groups/:id
Authorization: Bearer <JWT_TOKEN>
```

**Response (200)**
```json
{
  "message": "Group retrieved successfully",
  "group": {
    "id": "group_id",
    "groupName": "North Zone",
    "description": "Medical Representatives in North Zone",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "medicalRepresentatives": [
      {
        "id": "mr_id",
        "mrId": "MR001",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+919876543210",
        "email": "john.doe@example.com",
        "comments": "Senior MR",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### **4. Update Group**
```http
PUT /api/groups/:id
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "groupName": "North Zone Updated",
  "description": "Updated description"
}
```

**Response (200)**
```json
{
  "message": "Group updated successfully",
  "updatedCount": 1
}
```

### **5. Delete Group**
```http
DELETE /api/groups/:id
Authorization: Bearer <JWT_TOKEN>
```

**Response (200)**
```json
{
  "message": "Group deleted successfully",
  "deletedCount": 1
}
```

### **6. Get Group Statistics**
```http
GET /api/groups/:id/stats
Authorization: Bearer <JWT_TOKEN>
```

**Response (200)**
```json
{
  "message": "Group statistics retrieved successfully",
  "stats": {
    "id": "group_id",
    "groupName": "North Zone",
    "totalMRs": 25,
    "activeMRs": 20,
    "inactiveMRs": 5,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### **7. Get MRs in Group**
```http
GET /api/groups/:id/mrs?page=1&limit=50&search=john
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50)
- `search` (optional): Search term

**Response (200)**
```json
{
  "message": "Group Medical Representatives retrieved successfully",
  "data": [
    {
      "id": "mr_id",
      "mrId": "MR001",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+919876543210",
      "email": "john.doe@example.com",
      "comments": "Senior MR",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 25,
    "totalPages": 1,
    "hasMore": false
  }
}
```

### **8. Move MRs Between Groups**
```http
POST /api/groups/:id/mrs/move
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "mrIds": ["mr_id_1", "mr_id_2"],
  "sourceGroupId": "old_group_id"
}
```

**Response (200)**
```json
{
  "message": "Medical Representatives moved successfully",
  "movedCount": 2,
  "errors": [],
  "totalRequested": 2
}
```

### **9. Export Group Data**
```http
GET /api/groups/:id/export?format=csv
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `format` (optional): Export format - 'json' or 'csv' (default: 'json')

**Response**: JSON data or CSV file download

### **10. Get Group Activity**
```http
GET /api/groups/:id/activity?page=1&limit=20&dateFrom=2024-01-01&dateTo=2024-01-31
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)
- `dateFrom` (optional): Start date filter
- `dateTo` (optional): End date filter

**Response (200)**
```json
{
  "message": "Group activity retrieved successfully",
  "data": {
    "activities": [],
    "total": 0
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0,
    "hasMore": false
  }
}
```

### **11. Bulk Delete Groups**
```http
DELETE /api/groups/bulk
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "groupIds": ["group_id_1", "group_id_2"]
}
```

**Response (200)**
```json
{
  "message": "Bulk group deletion completed",
  "deletedCount": 2,
  "errors": [],
  "totalRequested": 2
}
```

---

## 💬 **Messaging APIs**

### **1. Send Message**
```http
POST /api/messages/send
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "content": "Hello! This is an important update.",
  "targetGroups": ["group_id_1", "group_id_2"],
  "imageUrl": "https://example.com/image.jpg",
  "scheduledAt": "2024-01-01T10:00:00.000Z"
}
```

**Response (200)**
```json
{
  "message": "Message sent successfully",
  "campaignId": "campaign_id",
  "messageId": "message_id",
  "totalRecipients": 50,
  "status": "queued"
}
```

### **2. Upload Image**
```http
POST /api/messages/upload-image
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data

image: image_file.jpg
```

**Response (200)**
```json
{
  "message": "Image uploaded successfully",
  "imageUrl": "/uploads/image_filename.jpg"
}
```

### **3. Get All Campaigns**
```http
GET /api/messages/campaigns?search=update&status=completed&dateFrom=2024-01-01&dateTo=2024-01-31&limit=50&offset=0
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `search` (optional): Search in message content or status
- `status` (optional): Filter by campaign status
- `dateFrom` (optional): Start date filter
- `dateTo` (optional): End date filter
- `limit` (optional): Results per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response (200)**
```json
{
  "message": "Campaigns retrieved successfully",
  "data": [
    {
      "id": "campaign_id",
      "messageId": {
        "id": "message_id",
        "content": "Hello! This is an important update.",
        "imageUrl": "https://example.com/image.jpg",
        "type": "image",
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      "createdBy": {
        "name": "John Doe"
      },
      "scheduledAt": "2024-01-01T10:00:00.000Z",
      "status": "completed",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "_count": {
        "messageLogs": 50
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 10,
    "totalPages": 1,
    "hasMore": false
  }
}
```

### **4. Get Campaign Statistics**
```http
GET /api/messages/campaigns/stats
Authorization: Bearer <JWT_TOKEN>
```

**Response (200)**
```json
{
  "message": "Campaign statistics retrieved successfully",
  "stats": {
    "campaigns": 10,
    "total": 500,
    "sent": 450,
    "successRate": "90.0"
  }
}
```

### **5. Get Campaign Report**
```http
GET /api/messages/campaign/:campaignId/report
Authorization: Bearer <JWT_TOKEN>
```

**Response (200)**
```json
{
  "message": "Campaign report retrieved successfully",
  "report": {
    "campaign": {
      "id": "campaign_id",
      "messageId": {
        "id": "message_id",
        "content": "Hello! This is an important update.",
        "imageUrl": "https://example.com/image.jpg",
        "type": "image",
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      "createdBy": {
        "name": "John Doe"
      },
      "scheduledAt": "2024-01-01T10:00:00.000Z",
      "status": "completed",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "stats": {
      "total": 50,
      "sent": 45,
      "failed": 3,
      "pending": 2
    },
    "messageLogs": [
      {
        "id": "log_id",
        "campaignId": "campaign_id",
        "mrId": {
          "id": "mr_id",
          "mrId": "MR001",
          "firstName": "John",
          "lastName": "Doe",
          "group": {
            "id": "group_id",
            "groupName": "North Zone"
          }
        },
        "phoneNumber": "+919876543210",
        "status": "sent",
        "sentAt": "2024-01-01T10:01:00.000Z",
        "deliveredAt": "2024-01-01T10:01:30.000Z",
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

## 📊 **Reports APIs**

### **1. Get Dashboard Statistics**
```http
GET /api/reports/dashboard
Authorization: Bearer <JWT_TOKEN>
```

**Response (200)**
```json
{
  "message": "Dashboard statistics retrieved successfully",
  "stats": {
    "totalMRs": 100,
    "totalGroups": 5,
    "totalCampaigns": 25,
    "totalMessagesSent": 2500,
    "successRate": "92.5",
    "pendingMessages": 50,
    "recentActivity": {
      "campaigns": 5,
      "messagesSent": 250,
      "messagesReceived": 50
    }
  }
}
```

### **2. Get Detailed Campaign Report**
```http
GET /api/reports/campaign/:campaignId
Authorization: Bearer <JWT_TOKEN>
```

**Response (200)**
```json
{
  "message": "Detailed campaign report retrieved successfully",
  "report": {
    "campaign": {
      "id": "campaign_id",
      "messageId": {
        "id": "message_id",
        "content": "Hello! This is an important update.",
        "imageUrl": "https://example.com/image.jpg",
        "type": "image",
        "createdAt": "2024-01-01T00:00:00.000Z"
      },
      "createdBy": {
        "name": "John Doe"
      },
      "scheduledAt": "2024-01-01T10:00:00.000Z",
      "status": "completed",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "stats": {
      "total": 50,
      "sent": 45,
      "failed": 3,
      "pending": 2
    },
    "groupStats": {
      "North Zone": {
        "total": 25,
        "sent": 23,
        "failed": 1,
        "pending": 1
      },
      "South Zone": {
        "total": 25,
        "sent": 22,
        "failed": 2,
        "pending": 1
      }
    },
    "timeline": [
      {
        "time": "2024-01-01T10:01:00.000Z",
        "status": "sent",
        "mrName": "John Doe",
        "groupName": "North Zone"
      }
    ]
  }
}
```

### **3. Export Campaign Report**
```http
GET /api/reports/campaign/:campaignId/export
Authorization: Bearer <JWT_TOKEN>
```

**Response**: CSV or Excel file download

---

## 🌐 **System APIs**

### **1. Health Check**
```http
GET /api/health
```

**Response (200)**
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```

### **2. API Documentation**
```http
GET /api
```

**Response (200)**
```json
{
  "message": "MR Communication Tool API",
  "version": "1.0.0",
  "endpoints": {
    "auth": "/api/auth",
    "mrs": "/api/mrs",
    "groups": "/api/groups",
    "messages": "/api/messages",
    "reports": "/api/reports",
    "health": "/api/health"
  }
}
```

### **3. WhatsApp Webhook (Verification)**
```http
GET /api/webhook?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=challenge_string
```

**Response (200)**: Challenge string if verification successful

### **4. WhatsApp Webhook (Events)**
```http
POST /api/webhook
Content-Type: application/json

{
  "object": "whatsapp_business_account",
  "entry": [...]
}
```

**Response (200)**: "OK"

---

## 📝 **Data Models & Types**

### **Contact/MR Fields**
- `mrId`: Unique identifier for the MR
- `firstName`: First name
- `lastName`: Last name
- `phone`: Phone number (with country code)
- `email`: Email address (optional)
- `groupId`: Associated group ID
- `comments`: Additional notes (optional)

### **Group Fields**
- `groupName`: Name of the group
- `description`: Group description
- `createdBy`: User ID who created the group

### **Message Fields**
- `content`: Message text content
- `targetGroups`: Array of group IDs to send to
- `imageUrl`: Optional image URL
- `scheduledAt`: Optional scheduling time

### **Campaign Status Values**
- `queued`: Message queued for sending
- `processing`: Currently being processed
- `completed`: All messages sent
- `failed`: Campaign failed

### **Message Log Status Values**
- `queued`: Message queued
- `sent`: Message sent successfully
- `delivered`: Message delivered to recipient
- `failed`: Message failed to send
- `pending`: Message pending

---

## ⚠️ **Error Handling**

### **Common HTTP Status Codes**
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `409`: Conflict (duplicate data)
- `413`: Payload Too Large (file size limit)
- `500`: Internal Server Error

### **Validation Error Response**
```json
{
  "error": "Validation failed",
  "details": [
    "Email is required",
    "Phone number must be valid",
    "Group ID is required"
  ]
}
```

---

## 🔒 **Security Features**

### **Rate Limiting**
- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **File Uploads**: Size limits enforced

### **Authentication**
- JWT tokens with configurable expiration
- Token refresh mechanism
- Role-based access control

### **Input Validation**
- Request schema validation
- File type and size validation
- SQL injection prevention
- XSS protection

---

## 📱 **WhatsApp Integration**

### **Webhook Setup**
1. Configure webhook URL in WhatsApp Business API
2. Verify webhook with challenge response
3. Receive delivery status updates
4. Process incoming messages

### **Message Sending**
- Text messages with optional images
- Bulk sending to multiple groups
- Scheduled message delivery
- Delivery status tracking

---

## 🚀 **Usage Examples**

### **Complete Workflow Example**

1. **Create Group**
```bash
curl -X POST http://localhost:5000/api/groups \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"groupName": "North Zone", "description": "North region MRs"}'
```

2. **Add MR to Group**
```bash
curl -X POST http://localhost:5000/api/mrs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mrId": "MR001", "firstName": "John", "lastName": "Doe", "phone": "+919876543210", "groupId": "GROUP_ID_HERE"}'
```

3. **Send Message to Group**
```bash
curl -X POST http://localhost:5000/api/messages/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello team! Important update.", "targetGroups": ["GROUP_ID_HERE"]}'
```

4. **Get Campaign Report**
```bash
curl -X GET http://localhost:5000/api/reports/campaign/CAMPAIGN_ID_HERE \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📚 **Additional Resources**

- **Swagger Documentation**: Available at `/api/docs` (if configured)
- **Postman Collection**: Import-ready API collection
- **SDK Libraries**: Available for Node.js, Python, PHP
- **Webhook Testing**: Use ngrok for local development

---

## 🔧 **Configuration**

### **Environment Variables**
```bash
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/mr_tool
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
REDIS_HOST=localhost
REDIS_PORT=6379
WHATSAPP_VERIFY_TOKEN=your_webhook_token
```

### **Database Setup**
- MongoDB connection with Mongoose
- Redis for message queuing
- Prisma ORM for advanced queries

---

This API documentation provides a comprehensive overview of all available endpoints, request/response formats, and usage examples for your MR Communication Tool backend.


