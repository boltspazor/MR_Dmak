# Waguru WhatsApp Integration Setup

## Overview

This implementation uses the [Waguru WhatsApp API](https://documenter.getpostman.com/view/17404097/2sA35D4hpx) which provides a simple and reliable way to send WhatsApp messages without complex verification processes.

## Key Benefits

✅ **No Sandbox Restrictions** - Send messages to any WhatsApp number  
✅ **No Recipient Initiation** - Recipients don't need to join anything  
✅ **Easy Setup** - Simple API key configuration  
✅ **Reliable Delivery** - High message delivery rates  
✅ **Template Support** - Full WhatsApp template message support  

## Configuration

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Waguru WhatsApp API Configuration
WAGURU_API_URL=https://waguru.me/api
WAGURU_ACCESS_TOKEN=pcGiOSFNbQsjCVglhM0d6lGqqJ5F3idx3s3RPWLPgZ2pDgtv96JbBvMKTo50eqgf
WAGURU_VENDOR_UID=e555ce6e-1c3c-4dca-b06b-4f2cbedde6c1
WAGURU_FROM_PHONE_NUMBER_ID=  # Optional: your default phone number ID
WHATSAPP_VERIFY_TOKEN=token1234
```

### API Credentials

Your Waguru API credentials:
- **API Base URL**: `https://waguru.me/api`
- **Access Token**: `pcGiOSFNbQsjCVglhM0d6lGqqJ5F3idx3s3RPWLPgZ2pDgtv96JbBvMKTo50eqgf`
- **Vendor UID**: `e555ce6e-1c3c-4dca-b06b-4f2cbedde6c1`

## API Endpoints

### 1. Test Connection
```bash
curl -X GET "http://localhost:5000/api/whatsapp/test-connection"
```

### 2. Send Single Message
```bash
curl -X POST "http://localhost:5000/api/whatsapp/send" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+919704991147",
    "message": "Hello! This is a test message.",
    "type": "text"
  }'
```

### 3. Send Template Message
```bash
curl -X POST "http://localhost:5000/api/whatsapp/test-template" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+919704991147",
    "templateName": "hello_world",
    "languageCode": "en_US"
  }'
```

### 4. Send Bulk Messages
```bash
curl -X POST "http://localhost:5000/api/whatsapp/send-bulk" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "to": "+919704991147",
        "message": "Bulk message 1",
        "type": "text"
      },
      {
        "to": "+919704991147",
        "message": "Bulk message 2",
        "type": "text"
      }
    ]
  }'
```

### 5. Send to All Recipients
```bash
curl -X POST "http://localhost:5000/api/whatsapp/send-to-all" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Message to all recipients",
    "type": "text"
  }'
```

## Testing

### Quick Test Script
```bash
# Run the Node.js test script
node test-waguru-whatsapp.js

# Or run the curl test script
./test-waguru-curl.sh
```

### Manual Testing
1. Start your backend server: `npm run dev`
2. Test the connection: `curl -X GET "http://localhost:5000/api/whatsapp/test-connection"`
3. Send a test message to your WhatsApp number
4. Check your WhatsApp for the message

## Message Types Supported

### 1. Text Messages
- Simple text content
- Uses `field_1` parameter in Waguru API

### 2. Template Messages
- WhatsApp approved templates
- Dynamic parameter support
- Multi-language support

### 3. Image Messages
- Image URLs with captions
- Uses `header_image` parameter

### 4. Document Messages
- Document URLs with names
- Uses `header_document` parameter

## Dynamic Parameters

The Waguru API supports dynamic parameters that get replaced with contact information:

- `{first_name}` - Contact's first name
- `{last_name}` - Contact's last name
- `{full_name}` - Contact's full name
- `{phone_number}` - Contact's phone number
- `{email}` - Contact's email
- `{country}` - Contact's country
- `{language_code}` - Contact's language code

## Error Handling

The service includes comprehensive error handling for:
- Invalid phone numbers
- Rate limiting
- Template not found errors
- Network connectivity issues
- API authentication errors

## Campaign Integration

The Waguru integration works seamlessly with your existing campaign system:
- Single message sending
- Bulk message campaigns
- Template-based campaigns
- Group messaging via campaigns

## Security

- API credentials are stored in environment variables
- No hardcoded secrets in the codebase
- Secure token-based authentication
- Rate limiting to prevent abuse

## Support

For Waguru API support and documentation:
- [Waguru API Documentation](https://documenter.getpostman.com/view/17404097/2sA35D4hpx)
- Contact Waguru support for API issues
- Check your account dashboard for usage statistics
