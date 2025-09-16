# WhatsApp Webhook Deployment Guide

## Overview

This guide covers deploying your WhatsApp webhook to production environments, specifically focusing on Railway deployment and Meta Developer Dashboard configuration.

## Prerequisites

- Railway account and CLI installed
- Meta Developer account with WhatsApp Business API access
- Domain with SSL certificate (for production)
- Environment variables configured

## Railway Deployment

### 1. Prepare for Deployment

Ensure your `package.json` includes the webhook testing script:

```json
{
  "scripts": {
    "test:webhook": "node test-webhook.js",
    "test:webhook:all": "node test-webhook.js --all"
  }
}
```

### 2. Environment Variables

Set these environment variables in Railway:

```bash
# Required for webhook
WHATSAPP_VERIFY_TOKEN=your_secure_verify_token_here
WHATSAPP_ACCESS_TOKEN=your_whatsapp_access_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_API_URL=https://graph.facebook.com/v18.0

# Database
MONGODB_URI=your_mongodb_connection_string

# Security
NODE_ENV=production
JWT_SECRET=your_jwt_secret

# Optional
PORT=5000
```

### 3. Deploy to Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project (if not already done)
railway init

# Deploy
railway up
```

### 4. Get Your Webhook URL

After deployment, Railway will provide a URL like:
```
https://your-app-name.railway.app
```

Your webhook endpoint will be:
```
https://your-app-name.railway.app/api/webhook
```

## Meta Developer Dashboard Configuration

### 1. Access Meta Developer Dashboard

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Select your WhatsApp Business app
3. Navigate to **WhatsApp > Configuration**

### 2. Configure Webhook

1. Click **Edit** next to "Webhook"
2. Enter your webhook URL: `https://your-app-name.railway.app/api/webhook`
3. Enter your verify token (same as `WHATSAPP_VERIFY_TOKEN`)
4. Click **Verify and Save**

### 3. Subscribe to Webhook Fields

Subscribe to these fields:
- ✅ `messages` - Incoming messages
- ✅ `message_deliveries` - Delivery receipts  
- ✅ `message_reads` - Read receipts
- ✅ `message_reactions` - Message reactions

### 4. Test Webhook

Use the test webhook utility:

```bash
# Test locally
node test-webhook.js --url https://your-app-name.railway.app --all

# Test verification only
node test-webhook.js --url https://your-app-name.railway.app --verification
```

## Production Checklist

### Security ✅

- [ ] Strong verify token (32+ characters, random)
- [ ] HTTPS enabled (Railway provides this automatically)
- [ ] Rate limiting configured
- [ ] Input validation on webhook endpoints
- [ ] Proper error handling and logging
- [ ] No sensitive data in logs

### Monitoring ✅

- [ ] Application logs enabled
- [ ] Error tracking configured
- [ ] Health check endpoint working
- [ ] Webhook event logging

### Performance ✅

- [ ] Asynchronous webhook processing
- [ ] Database connection pooling
- [ ] Proper timeout configurations
- [ ] Memory usage monitoring

## Testing Your Deployment

### 1. Health Check

```bash
curl https://your-app-name.railway.app/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

### 2. Webhook Verification

```bash
curl "https://your-app-name.railway.app/api/webhook?hub.mode=subscribe&hub.verify_token=your_verify_token&hub.challenge=test123"
```

Expected response: `test123`

### 3. Send Test Message

Use WhatsApp Business API to send a test message to your phone number and verify it's received.

## Troubleshooting

### Common Issues

1. **Webhook Verification Fails**
   - Check verify token matches exactly
   - Ensure webhook URL is accessible
   - Check Railway logs for errors

2. **Events Not Received**
   - Verify webhook is subscribed to correct fields
   - Check if phone number is verified
   - Ensure webhook URL is HTTPS

3. **Railway Deployment Issues**
   - Check environment variables are set
   - Verify build logs for errors
   - Ensure all dependencies are in package.json

### Debug Commands

```bash
# Check Railway logs
railway logs

# Check specific service logs
railway logs --service your-service-name

# Test webhook locally against production
node test-webhook.js --url https://your-app-name.railway.app --all
```

### Log Analysis

Check these log files for issues:
- `logs/combined.log` - All application logs
- `logs/error.log` - Error-specific logs
- Railway deployment logs

## Monitoring and Maintenance

### 1. Set Up Monitoring

Consider setting up:
- Uptime monitoring (UptimeRobot, Pingdom)
- Error tracking (Sentry, LogRocket)
- Performance monitoring (New Relic, DataDog)

### 2. Regular Maintenance

- Monitor webhook delivery success rates
- Check for failed message deliveries
- Review error logs weekly
- Update dependencies monthly

### 3. Backup Strategy

- Database backups (MongoDB Atlas provides automatic backups)
- Environment variable backup
- Code repository backup (Git)

## Security Best Practices

### 1. Environment Variables

- Never commit `.env` files
- Use strong, unique tokens
- Rotate tokens regularly
- Use different tokens for different environments

### 2. Webhook Security

- Validate all incoming webhook data
- Implement rate limiting
- Log all webhook events
- Monitor for suspicious activity

### 3. API Security

- Use HTTPS everywhere
- Implement proper authentication
- Validate all inputs
- Use CORS appropriately

## Support and Resources

### Documentation

- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Railway Documentation](https://docs.railway.app/)
- [Meta for Developers](https://developers.facebook.com/)

### Getting Help

1. Check Railway logs first
2. Test webhook endpoints
3. Verify Meta Developer Dashboard configuration
4. Contact support with specific error messages

### Emergency Contacts

- Railway Support: [Railway Discord](https://discord.gg/railway)
- Meta Developer Support: [Meta Developer Community](https://developers.facebook.com/community/)
