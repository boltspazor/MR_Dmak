# WhatsApp API Integration Guide

## Overview

This guide covers the complete WhatsApp Business API integration for your MR Communication Tool, including message sending, recipient management, and webhook handling.

## 🔑 Configuration

### Access Token
Your WhatsApp access token has been updated:
```
qt3yb4Lgty5SjeJeflqEYvdWJy9id8IzpC3Ha4C1M5jtaBomySZFJ4aXQIRN4uN4
```

### Environment Variables
```env
WHATSAPP_ACCESS_TOKEN=qt3yb4Lgty5SjeJeflqEYvdWJy9id8IzpC3Ha4C1M5jtaBomySZFJ4aXQIRN4uN4
WHATSAPP_PHONE_NUMBER_ID=778806801982541
WHATSAPP_VERIFY_TOKEN=token1234
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
```

## 📡 API Endpoints

### Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### 1. Connection Testing

#### Test Connection
```http
GET /api/whatsapp/test-connection
```

**Response:**
```json
{
  "success": true,
  "message": "WhatsApp connection is working",
  "recipientsCount": 5
}
```

### 2. Recipient Management

#### Get Allowed Recipients
```http
GET /api/whatsapp/allowed-recipients
```

**Response:**
```json
{
  "success": true,
  "recipients": [
    {
      "phoneNumber": "1234567890",
      "formatted": "+1234567890",
      "addedDate": "2024-01-15T10:30:00.000Z",
      "addedBy": "John Doe"
    }
  ],
  "count": 1
}
```

#### Add Single Recipient
```http
POST /api/whatsapp/allowed-recipients/add
Content-Type: application/json

{
  "phoneNumber": "1234567890"
}
```

#### Add Multiple Recipients
```http
POST /api/whatsapp/allowed-recipients/add-multiple
Content-Type: application/json

{
  "phoneNumbers": ["1234567890", "0987654321"]
}
```

#### Remove Recipients
```http
POST /api/whatsapp/allowed-recipients/remove
Content-Type: application/json

{
  "phoneNumber": "1234567890"
}
```

### 3. Message Sending

#### Send Single Message
```http
POST /api/whatsapp/send-message
Content-Type: application/json

{
  "to": "1234567890",
  "message": "Hello! This is a test message.",
  "type": "text"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "messageId": "wamid.xxx",
  "to": "1234567890"
}
```

#### Send Bulk Messages
```http
POST /api/whatsapp/send-bulk-messages
Content-Type: application/json

{
  "messages": [
    {
      "to": "1234567890",
      "message": "Message 1",
      "type": "text"
    },
    {
      "to": "0987654321",
      "message": "Message 2",
      "type": "text"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk messages processed: 2 sent, 0 failed",
  "results": [
    {
      "to": "1234567890",
      "success": true,
      "messageId": "wamid.xxx"
    },
    {
      "to": "0987654321",
      "success": true,
      "messageId": "wamid.yyy"
    }
  ],
  "summary": {
    "total": 2,
    "success": 2,
    "failed": 0
  }
}
```

#### Send to All Recipients
```http
POST /api/whatsapp/send-to-all
Content-Type: application/json

{
  "message": "Hello all! This is a broadcast message.",
  "type": "text"
}
```

### 4. Webhook Endpoints

#### Webhook Verification
```http
GET /api/webhook?hub.mode=subscribe&hub.verify_token=token1234&hub.challenge=test123
```

#### Webhook Event Processing
```http
POST /api/webhook
Content-Type: application/json

{
  "object": "whatsapp_business_account",
  "entry": [...]
}
```

#### Webhook Status
```http
GET /api/webhook/status
```

## 🧪 Testing

### Test Scripts

#### Test WhatsApp API
```bash
# Interactive testing
node test-whatsapp-api.js

# Run all tests
node test-whatsapp-api.js --all

# Test specific functionality
node test-whatsapp-api.js --connection
node test-whatsapp-api.js --recipients
node test-whatsapp-api.js --send
node test-whatsapp-api.js --webhook
```

#### Test Webhook
```bash
# Test webhook verification
node test-webhook.js --verification

# Test all webhook functionality
node test-webhook.js --all
```

### Example API Calls

#### Using curl
```bash
# Test connection
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:5000/api/whatsapp/test-connection

# Send message
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"to":"1234567890","message":"Hello!","type":"text"}' \
     http://localhost:5000/api/whatsapp/send-message
```

#### Using JavaScript/Node.js
```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  }
});

// Send message
const response = await api.post('/whatsapp/send-message', {
  to: '1234567890',
  message: 'Hello from API!',
  type: 'text'
});

console.log(response.data);
```

## 📱 Message Types

### Text Messages
```json
{
  "to": "1234567890",
  "message": "Hello! This is a text message.",
  "type": "text"
}
```

### Image Messages
```json
{
  "to": "1234567890",
  "message": "https://example.com/image.jpg",
  "type": "image"
}
```

## 🔒 Security

### Authentication
- All API endpoints require JWT authentication
- Webhook endpoints use verify token authentication
- Rate limiting is applied to prevent abuse

### Best Practices
1. **Secure Token Storage**: Store access tokens in environment variables
2. **Input Validation**: All inputs are validated before processing
3. **Rate Limiting**: Built-in rate limiting for API endpoints
4. **Logging**: Comprehensive logging for monitoring and debugging

## 📊 Monitoring

### Health Checks
- `GET /api/health` - Basic health check
- `GET /api/webhook/status` - Webhook configuration status
- `GET /api/whatsapp/test-connection` - WhatsApp API connection test

### Logs
- Application logs: `logs/combined.log`
- Error logs: `logs/error.log`
- Webhook events are logged with detailed information

## 🚀 Deployment

### Production Setup
1. Set environment variables
2. Deploy to Railway or your preferred platform
3. Configure webhook URL in Meta Developer Dashboard
4. Test all endpoints

### Environment Variables for Production
```env
NODE_ENV=production
WHATSAPP_ACCESS_TOKEN=qt3yb4Lgty5SjeJeflqEYvdWJy9id8IzpC3Ha4C1M5jtaBomySZFJ4aXQIRN4uN4
WHATSAPP_PHONE_NUMBER_ID=778806801982541
WHATSAPP_VERIFY_TOKEN=your_secure_verify_token
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

## 🆘 Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check JWT token is valid
   - Ensure token is in Authorization header
   - Verify token hasn't expired

2. **Message Sending Failed**
   - Check phone number format
   - Verify recipient is in allowed list
   - Check WhatsApp API credentials

3. **Webhook Not Working**
   - Verify webhook URL is accessible
   - Check verify token matches
   - Ensure HTTPS is enabled

### Debug Steps
1. Check server logs
2. Test individual endpoints
3. Verify environment variables
4. Check Meta Developer Dashboard configuration

## 📞 Support

### Resources
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Meta for Developers](https://developers.facebook.com/)
- [Railway Documentation](https://docs.railway.app/)

### Testing Tools
- `test-whatsapp-api.js` - API testing utility
- `test-webhook.js` - Webhook testing utility
- Built-in health check endpoints

## 🎉 Ready to Use!

Your WhatsApp API integration is fully configured and ready for production use. The new access token is active and all endpoints are functional.

### Quick Start
1. **Test Connection**: `node test-whatsapp-api.js --connection`
2. **Add Recipients**: Use the API to add phone numbers
3. **Send Messages**: Use the API to send individual or bulk messages
4. **Monitor**: Check logs and health endpoints

Your MR Communication Tool is now ready to send WhatsApp messages to your users! 🚀
