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

## Internal Communication

The frontend will connect to the backend using:
- URL: `http://mr_backend.railway.internal:5000/api`
- This uses Railway's internal networking for service-to-service communication

## Testing

After deployment, you can test the connection using:
```bash
node test-api.js
```

This will test the API connection using the Railway internal URL.
