#!/bin/bash

# Run Backend with Docker Redis
# This script runs the backend locally while connecting to Docker Redis

echo "🚀 Starting MR Project Backend with Docker Redis..."

# Set environment variables for local development with Docker Redis
export NODE_ENV=development
export PORT=5001
export MONGODB_URI=mongodb://admin:password@localhost:27017/mr_communication?authSource=admin
export REDIS_HOST=localhost
export REDIS_PORT=6379
export JWT_SECRET=your-super-secret-jwt-key-development
export WHATSAPP_ACCESS_TOKEN=qt3yb4Lgty5SjeJeflqEYvdWJy9id8IzpC3Ha4C1M5jtaBomySZFJ4aXQIRN4uN4
export WHATSAPP_PHONE_NUMBER_ID=778806801982541
export WHATSAPP_VERIFY_TOKEN=token1234
export WHATSAPP_API_URL=https://graph.facebook.com/v19.0

echo "📋 Environment Configuration:"
echo "  • NODE_ENV: $NODE_ENV"
echo "  • PORT: $PORT"
echo "  • REDIS_HOST: $REDIS_HOST"
echo "  • REDIS_PORT: $REDIS_PORT"
echo "  • MONGODB_URI: $MONGODB_URI"
echo ""

# Check if Redis is running
echo "🔍 Checking Redis connection..."
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is running and accessible"
else
    echo "❌ Redis is not accessible. Make sure Docker services are running:"
    echo "   docker-compose up -d redis mongodb"
    exit 1
fi

# Check if MongoDB is running
echo "🔍 Checking MongoDB connection..."
if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "✅ MongoDB is running and accessible"
else
    echo "❌ MongoDB is not accessible. Make sure Docker services are running:"
    echo "   docker-compose up -d redis mongodb"
    exit 1
fi

echo ""
echo "🏗️ Building backend..."
cd backend
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Backend built successfully"
    echo ""
    echo "🚀 Starting backend server..."
    echo "   • Backend will be available at: http://localhost:5001"
    echo "   • API endpoints at: http://localhost:5001/api"
    echo "   • Health check: http://localhost:5001/api/health"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    npm start
else
    echo "❌ Backend build failed"
    exit 1
fi
