# 📋 Backend API List - Copy & Paste Ready

## 🔐 **Authentication APIs**
```
POST /api/auth/register - User registration
POST /api/auth/login - User login  
GET /api/auth/me - Get current user
POST /api/auth/refresh - Refresh JWT token
```

## 👥 **Medical Representatives (MRs) APIs**
```
POST /api/mrs - Create new MR
POST /api/mrs/bulk-upload - Bulk upload MRs from Excel
GET /api/mrs - Get all MRs (with filters & pagination)
PUT /api/mrs/:id - Update MR
DELETE /api/mrs/:id - Delete MR
GET /api/mrs/template - Download Excel template
```

## 🏷️ **Groups APIs**
```
POST /api/groups - Create new group
GET /api/groups - Get all groups
GET /api/groups/:id - Get group by ID
PUT /api/groups/:id - Update group
DELETE /api/groups/:id - Delete group
GET /api/groups/:id/stats - Get group statistics
GET /api/groups/:id/mrs - Get MRs in group
POST /api/groups/:id/mrs/move - Move MRs between groups
GET /api/groups/:id/export - Export group data
GET /api/groups/:id/activity - Get group activity
DELETE /api/groups/bulk - Bulk delete groups
```

## 💬 **Messaging APIs**
```
POST /api/messages/send - Send message to groups
POST /api/messages/upload-image - Upload image for messages
GET /api/messages/campaigns - Get all campaigns
GET /api/messages/campaigns/stats - Get campaign statistics
GET /api/messages/campaign/:campaignId/report - Get campaign report
```

## 📊 **Reports APIs**
```
GET /api/reports/dashboard - Get dashboard statistics
GET /api/reports/campaign/:campaignId - Get detailed campaign report
GET /api/reports/campaign/:campaignId/export - Export campaign report
```

## 🌐 **System APIs**
```
GET /api/health - Health check
GET /api - API documentation
GET /api/webhook - WhatsApp webhook verification
POST /api/webhook - WhatsApp webhook events
```

---

## 📝 **Quick Reference - Request Headers**
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

## 📝 **Quick Reference - Base URL**
```
http://localhost:5000/api
```

## 📝 **Quick Reference - Common Query Parameters**
```
?page=1&limit=50&search=term&dateFrom=2024-01-01&dateTo=2024-01-31
```

## 📝 **Quick Reference - File Upload**
```
Content-Type: multipart/form-data
file: your_file.xlsx
```

---

## 🚀 **Most Used APIs (Priority Order)**

### **1. Authentication (Start Here)**
```
POST /api/auth/login
POST /api/auth/register
```

### **2. Core Operations**
```
POST /api/groups - Create group first
POST /api/mrs - Add MRs to groups
POST /api/messages/send - Send messages
```

### **3. Data Retrieval**
```
GET /api/mrs - View all MRs
GET /api/groups - View all groups
GET /api/messages/campaigns - View campaigns
```

### **4. Reporting**
```
GET /api/reports/dashboard - Dashboard stats
GET /api/reports/campaign/:id - Campaign details
```

---

## 📋 **API Categories Summary**

| Category | Count | Description |
|----------|-------|-------------|
| **Authentication** | 4 | User login, registration, token management |
| **MRs** | 6 | Medical Representatives CRUD operations |
| **Groups** | 11 | Group management and operations |
| **Messaging** | 5 | Message sending and campaign management |
| **Reports** | 3 | Analytics and reporting |
| **System** | 4 | Health checks and webhooks |
| **Total** | **33** | Complete API ecosystem |

---

## 🔗 **Integration Examples**

### **Frontend Integration**
```javascript
const API_BASE = 'http://localhost:5000/api';

// Login
const login = async (email, password) => {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return response.json();
};

// Get MRs
const getMRs = async (token) => {
  const response = await fetch(`${API_BASE}/mrs`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### **Mobile App Integration**
```dart
class ApiService {
  static const String baseUrl = 'http://localhost:5000/api';
  
  static Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    return jsonDecode(response.body);
  }
}
```

### **Postman Collection Import**
```json
{
  "info": {
    "name": "MR Communication Tool API",
    "description": "Complete API collection for MR Communication Tool",
    "version": "1.0.0"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Login",
          "request": {
            "method": "POST",
            "header": [{"key": "Content-Type", "value": "application/json"}],
            "url": {"raw": "{{baseUrl}}/auth/login"},
            "body": {"raw": "{\n  \"email\": \"user@example.com\",\n  \"password\": \"password123\"\n}"}
          }
        }
      ]
    }
  ],
  "variable": [
    {"key": "baseUrl", "value": "http://localhost:5000/api"}
  ]
}
```

---

## 📞 **Support & Documentation**

- **Full Documentation**: See `BACKEND_API_DOCUMENTATION.md`
- **Code Examples**: Available in documentation
- **Error Codes**: Standard HTTP status codes
- **Rate Limits**: 100 req/15min (general), 5 req/15min (auth)

---

**Copy this entire document for easy reference and integration!** 📋✨


