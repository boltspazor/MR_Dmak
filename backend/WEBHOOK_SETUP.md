# WhatsApp Webhook Setup Guide

## Overview

This guide explains how to set up and configure the WhatsApp webhook for your MR Communication Tool.

## Webhook Endpoints

### 1. Verification Endpoint (GET)
```
GET /api/webhook
```

**Purpose**: Handles Meta's webhook verification challenge
**Parameters**:
- `hub.mode` - Always "subscribe" for verification
- `hub.verify_token` - Your secret verify token
- `hub.challenge` - Random string from Meta

**Response**: Returns the challenge string if verification succeeds

### 2. Event Processing Endpoint (POST)
```
POST /api/webhook
```

**Purpose**: Receives and processes WhatsApp events
**Content-Type**: `application/json`
**Body**: WhatsApp webhook payload

## Configuration

### Environment Variables

Make sure these are set in your `.env` file:

```env
# WhatsApp Configuration
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=your_verify_token_here
```

### Current Configuration
- **API URL**: `https://graph.facebook.com/v18.0`
- **Phone Number ID**: `778806801982541`
- **Verify Token**: `token1234`

## Meta Developer Dashboard Setup

### Step 1: Register Webhook URL

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Select your WhatsApp app
3. Navigate to **WhatsApp > Configuration > Webhooks**
4. Click **Edit Callback URL**
5. Enter your webhook URL: `https://yourdomain.com/api/webhook`
6. Enter your verify token: `token1234`
7. Click **Verify and Save**

### Step 2: Subscribe to Webhook Fields

Subscribe to these webhook fields:
- `messages` - Incoming messages
- `message_deliveries` - Delivery receipts
- `message_reads` - Read receipts
- `message_reactions` - Message reactions

## Testing Your Webhook

### 1. Verification Test

Test the verification endpoint:
```bash
curl "https://yourdomain.com/api/webhook?hub.mode=subscribe&hub.verify_token=token1234&hub.challenge=test_challenge"
```

Expected response: `test_challenge`

### 2. Event Processing Test

Send a test webhook event:
```bash
curl -X POST https://yourdomain.com/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "PHONE_NUMBER",
            "phone_number_id": "PHONE_NUMBER_ID"
          },
          "statuses": [{
            "id": "wamid.xxx",
            "status": "delivered",
            "timestamp": "1234567890",
            "recipient_id": "PHONE_NUMBER"
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

## Security Considerations

### 1. Verify Token
- Use a strong, random verify token
- Keep it secret and don't commit it to version control
- Consider rotating it periodically

### 2. HTTPS Required
- Meta only sends webhooks to HTTPS endpoints
- Ensure your server has a valid SSL certificate

### 3. Rate Limiting
- Your webhook endpoint is protected by rate limiting
- Consider additional rate limiting for webhook-specific endpoints

## Monitoring and Logging

### Logs Location
- Combined logs: `logs/combined.log`
- Error logs: `logs/error.log`

### Key Log Events
- Webhook verification attempts
- Message status updates
- Error conditions

## Troubleshooting

### Common Issues

1. **Verification Fails**
   - Check verify token matches exactly
   - Ensure endpoint is accessible via HTTPS
   - Check server logs for detailed error messages

2. **Events Not Received**
   - Verify webhook is subscribed to correct fields
   - Check if webhook URL is accessible
   - Ensure phone number is properly configured

3. **SSL Certificate Issues**
   - Use a valid SSL certificate
   - Check certificate chain is complete
   - Consider using Let's Encrypt for free certificates

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## Production Deployment

### Railway Deployment
Your app is configured for Railway deployment with:
- Trust proxy settings for proper IP detection
- Environment-specific rate limiting
- Graceful shutdown handling

### Environment Variables for Production
```env
NODE_ENV=production
WHATSAPP_ACCESS_TOKEN=your_production_token
WHATSAPP_VERIFY_TOKEN=your_production_verify_token
```

## Support

For issues with webhook setup:
1. Check server logs first
2. Verify Meta Developer Dashboard configuration
3. Test with curl commands
4. Contact support with specific error messages
