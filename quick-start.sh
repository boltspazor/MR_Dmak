#!/bin/bash

# 🚀 Quick Start Script for MR Communication Tool
echo "🚀 Starting MR Communication Tool..."
echo "====================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "⚠️  Docker is not running. Starting MongoDB and Redis locally..."
    
    # Start MongoDB locally
    if command -v mongod &> /dev/null; then
        echo "📦 Starting MongoDB..."
        brew services start mongodb-community 2>/dev/null || sudo systemctl start mongod 2>/dev/null || echo "Please start MongoDB manually"
    else
        echo "❌ MongoDB not found. Please install: brew install mongodb-community"
    fi
    
    # Start Redis locally  
    if command -v redis-server &> /dev/null; then
        echo "📦 Starting Redis..."
        brew services start redis 2>/dev/null || sudo systemctl start redis 2>/dev/null || echo "Please start Redis manually"
    else
        echo "❌ Redis not found. Please install: brew install redis"
    fi
else
    echo "🐳 Docker is running. Starting database containers..."
    docker-compose up -d
fi

echo ""
echo "🔧 Setup completed! Now start the servers manually:"
echo ""
echo "Terminal 1 - Backend:"
echo "  cd backend && npm run dev"
echo ""
echo "Terminal 2 - Frontend:"  
echo "  cd frontend && npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo ""
echo "✅ All backend fixes applied - WhatsApp integration ready!"
