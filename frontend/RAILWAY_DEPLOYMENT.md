# Railway Deployment Configuration

## Frontend Environment Variables

Set these environment variables in your Railway frontend service:

```
VITE_API_BASE_URL=http://mr_backend.railway.internal:5000/api
VITE_DEV_MODE=false
VITE_DEBUG_LEVEL=info
```

## Backend Environment Variables

Set these environment variables in your Railway backend service:

```
MONGODB_URI=mongodb://admin:password@mongodb:27017/mr_communication?authSource=admin
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
PORT=5000
```

## Railway Service Names

Make sure your Railway services are named:
- Frontend service: `frontend` (or any name)
- Backend service: `mr_backend` (this is important for internal communication)

**IMPORTANT**: The service name must NOT contain spaces. Use underscores or hyphens only.

## Internal Communication

The frontend will automatically detect Railway deployment and connect to the backend using:
- URL: `http://mr_backend.railway.internal:5000/api`
- This uses Railway's internal networking for service-to-service communication

## Troubleshooting

### Common Issues:

1. **405 Method Not Allowed**: Usually means the service name has a space
   - Solution: Rename your backend service to `mr_backend` (no spaces)

2. **URL Construction Error**: If you see URLs like `https://frontend.railway.app/mr backend.railway.internal/...`
   - Solution: Check that your service name doesn't contain spaces

3. **Connection Refused**: Backend service not running
   - Solution: Check Railway logs for backend service

### Debug Information:

The frontend will log API configuration details to the browser console:
- Hostname detection
- Service URL being used
- Environment variables

## Testing

After deployment, you can test the connection using:
```bash
node test-api.js
```

This will test the API connection using the Railway internal URL.
