# 🚀 Production Deployment Guide

This guide covers deploying the MR Project to Railway with the correct production URLs.

## 📋 Production URLs

- **Frontend**: https://mrfrontend-production.up.railway.app
- **Backend**: https://mrbackend-production-2ce3.up.railway.app

## 🔧 Environment Variables

### Backend Environment Variables (Railway)

Set these in your Railway backend service:

```bash
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://admin:password@mongodb:27017/mr_communication?authSource=admin
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key-production

# WhatsApp API Configuration
WHATSAPP_ACCESS_TOKEN=qt3yb4Lgty5SjeJeflqEYvdWJy9id8IzpC3Ha4C1M5jtaBomySZFJ4aXQIRN4uN4
WHATSAPP_PHONE_NUMBER_ID=778806801982541
WHATSAPP_VERIFY_TOKEN=token1234
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
```

### Frontend Environment Variables (Railway)

Set these in your Railway frontend service:

```bash
VITE_API_URL=https://mrbackend-production-2ce3.up.railway.app/api
VITE_API_BASE_URL=https://mrbackend-production-2ce3.up.railway.app/api
```

## 🏗️ Deployment Steps

### 1. Backend Deployment

1. Connect your GitHub repository to Railway
2. Create a new service for the backend
3. Set the root directory to `backend`
4. Add all backend environment variables
5. Deploy

### 2. Frontend Deployment

1. Create a new service for the frontend
2. Set the root directory to `frontend`
3. Add all frontend environment variables
4. Deploy

### 3. Database Setup

1. Add MongoDB service to Railway
2. Update the `MONGODB_URI` in backend environment variables
3. Add Redis service to Railway
4. Update the `REDIS_HOST` and `REDIS_PORT` in backend environment variables

## 🔍 Verification

### Test Backend Health
```bash
curl https://mrbackend-production-2ce3.up.railway.app/api/health
```

### Test Frontend
Visit: https://mrfrontend-production.up.railway.app

### Test API Endpoints
```bash
# Test cache API
curl https://mrbackend-production-2ce3.up.railway.app/api/cache/stats

# Test WhatsApp API
curl https://mrbackend-production-2ce3.up.railway.app/api/whatsapp/test-connection
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure frontend URL is in backend CORS origins
   - Check that credentials are properly configured

2. **API Connection Issues**
   - Verify environment variables are set correctly
   - Check that backend is running and accessible

3. **Database Connection Issues**
   - Verify MongoDB URI is correct
   - Check Redis connection settings

4. **WhatsApp API Issues**
   - Verify access token is valid
   - Check phone number ID is correct

### Debug Commands

```bash
# Check backend logs
railway logs --service backend

# Check frontend logs
railway logs --service frontend

# Check database logs
railway logs --service mongodb
```

## 📊 Monitoring

### Health Endpoints

- **Backend Health**: `GET /api/health`
- **Webhook Status**: `GET /api/webhook/status`
- **Cache Stats**: `GET /api/cache/stats`

### Logs

Monitor logs in Railway dashboard or via CLI:
```bash
railway logs --follow
```

## 🔒 Security Considerations

1. **Environment Variables**
   - Use strong, unique JWT secrets
   - Rotate access tokens regularly
   - Never commit secrets to version control

2. **CORS Configuration**
   - Only allow necessary origins
   - Use HTTPS in production

3. **Rate Limiting**
   - Configure appropriate rate limits
   - Monitor for abuse

## 📈 Performance Optimization

1. **Redis Caching**
   - Monitor cache hit rates
   - Adjust TTL values as needed

2. **Database Optimization**
   - Index frequently queried fields
   - Monitor query performance

3. **CDN**
   - Consider using a CDN for static assets
   - Enable gzip compression

## 🆘 Support

If you encounter issues:

1. Check the logs in Railway dashboard
2. Verify all environment variables are set
3. Test individual services separately
4. Check the troubleshooting section above

---

**Happy Deploying! 🎉**
