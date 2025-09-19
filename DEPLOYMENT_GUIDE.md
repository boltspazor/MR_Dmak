# 🚀 MR Project Deployment Guide

This guide covers deploying the MR Project with Redis caching using Docker.

## 📋 Prerequisites

- Docker (20.10+)
- Docker Compose (2.0+)
- Git

## 🚀 Quick Deployment

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd MR_Project
```

### 2. Run Complete Setup
```bash
# Make setup script executable
chmod +x docker-setup.sh

# Run automated setup
./docker-setup.sh
```

### 3. Manual Setup (Alternative)
```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

## 🔧 Service Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# Database
MONGODB_URI=mongodb://admin:password@mongodb:27017/mr_communication?authSource=admin

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-jwt-key

# WhatsApp API
WHATSAPP_ACCESS_TOKEN=qt3yb4Lgty5SjeJeflqEYvdWJy9id8IzpC3Ha4C1M5jtaBomySZFJ4aXQIRN4uN4
WHATSAPP_PHONE_NUMBER_ID=778806801982541
WHATSAPP_VERIFY_TOKEN=token1234

# Environment
NODE_ENV=production
```

## 🌐 Service URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Cache API**: http://localhost:5000/api/cache
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

## 📊 Monitoring

### Check Service Health
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f redis
docker-compose logs -f mongodb

# Check service status
docker-compose ps
```

### Test Redis Connection
```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# Test connection
docker-compose exec redis redis-cli ping

# Monitor Redis commands
docker-compose exec redis redis-cli monitor
```

### Test Cache API
```bash
# Get cache statistics
curl http://localhost:5000/api/cache/stats

# Test cache operations
curl -X POST http://localhost:5000/api/cache/set \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"key": "test", "value": "Hello Redis", "ttl": 60}'
```

## 🔄 Common Operations

### Restart Services
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Update Services
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up --build -d
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## 🐛 Troubleshooting

### Frontend Build Issues
```bash
# Check frontend build locally
cd frontend
npm run build

# Check Docker build
docker-compose build frontend
```

### Backend Issues
```bash
# Check backend build
cd backend
npm run build

# Check TypeScript compilation
cd backend
npx tsc --noEmit
```

### Redis Connection Issues
```bash
# Check Redis container
docker-compose exec redis redis-cli ping

# Check Redis logs
docker-compose logs redis

# Restart Redis
docker-compose restart redis
```

### Database Issues
```bash
# Check MongoDB connection
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Check MongoDB logs
docker-compose logs mongodb
```

## 📈 Performance Optimization

### Redis Configuration
- Memory limit: 256MB
- Eviction policy: allkeys-lru
- Persistence: AOF enabled

### Frontend Optimization
- Nginx with gzip compression
- Static asset caching
- Security headers

### Backend Optimization
- Production dependencies only
- Health checks enabled
- Non-root user for security

## 🔒 Security Considerations

1. **Change default passwords** in production
2. **Use strong JWT secrets**
3. **Enable Redis authentication** in production
4. **Use HTTPS** in production
5. **Regular security updates**

## 📝 Production Deployment

### 1. Environment Setup
```bash
# Create production environment file
cp .env.example .env.production

# Update with production values
nano .env.production
```

### 2. Docker Compose Override
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    environment:
      NODE_ENV: production
      REDIS_HOST: your-redis-host
      MONGODB_URI: your-mongodb-uri
  frontend:
    environment:
      VITE_API_URL: https://your-api-domain.com/api
```

### 3. Deploy
```bash
# Deploy with production config
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🆘 Support

If you encounter issues:

1. Check the logs: `docker-compose logs -f`
2. Verify service health: `docker-compose ps`
3. Test individual components
4. Check the [Caching Guide](./CACHING_GUIDE.md)
5. Review the troubleshooting section above

---

**Happy Deploying! 🎉**
