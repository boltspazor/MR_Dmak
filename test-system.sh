#!/bin/bash

# 🚀 MR Communication Tool - Complete System Test Script
# Run this script to test all functionality

echo "🚀 Starting MR Communication Tool System Test..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if services are running
check_service() {
    local service_name=$1
    local port=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        print_success "$service_name is running on port $port"
        return 0
    else
        print_error "$service_name is not running on port $port"
        return 1
    fi
}

# Test API endpoint
test_endpoint() {
    local endpoint=$1
    local expected_status=$2
    local description=$3
    
    print_status "Testing: $description"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint")
    
    if [ "$response" -eq "$expected_status" ]; then
        print_success "✅ $description - Status: $response"
        return 0
    else
        print_error "❌ $description - Expected: $expected_status, Got: $response"
        return 1
    fi
}

echo ""
print_status "Step 1: Checking Database Services"
echo "-----------------------------------"

# Check if Docker services are running
if docker ps | grep -q "mr_mongodb"; then
    print_success "✅ MongoDB container is running"
else
    print_warning "⚠️  MongoDB container not found. Starting services..."
    docker-compose up -d
    sleep 5
fi

if docker ps | grep -q "mr_redis"; then
    print_success "✅ Redis container is running"
else
    print_warning "⚠️  Redis container not found. Starting services..."
    docker-compose up -d
    sleep 5
fi

echo ""
print_status "Step 2: Checking Backend Server"
echo "-------------------------------"

if check_service "Backend Server" 5001; then
    print_success "✅ Backend is already running"
else
    print_warning "⚠️  Backend not running. Please start it manually:"
    echo "    cd backend && npm run dev"
    echo ""
fi

echo ""
print_status "Step 3: Checking Frontend Server"
echo "--------------------------------"

if check_service "Frontend Server" 5173; then
    print_success "✅ Frontend is already running"
else
    print_warning "⚠️  Frontend not running. Please start it manually:"
    echo "    cd frontend && npm run dev"
    echo ""
fi

echo ""
print_status "Step 4: Testing API Endpoints"
echo "-----------------------------"

# Test basic endpoints
test_endpoint "http://localhost:5001/api/health" 200 "Health Check"
test_endpoint "http://localhost:5001/api" 200 "API Documentation"

echo ""
print_status "Step 5: Testing Frontend Application"
echo "-----------------------------------"

test_endpoint "http://localhost:5173" 200 "Frontend Application"

echo ""
print_status "Step 6: Environment Check"
echo "-------------------------"

# Check backend .env file
if [ -f "backend/.env" ]; then
    print_success "✅ Backend .env file exists"
    
    # Check for required variables
    if grep -q "WHATSAPP_ACCESS_TOKEN" backend/.env; then
        print_success "✅ WHATSAPP_ACCESS_TOKEN is configured"
    else
        print_error "❌ WHATSAPP_ACCESS_TOKEN is missing"
    fi
    
    if grep -q "WHATSAPP_PHONE_NUMBER_ID" backend/.env; then
        print_success "✅ WHATSAPP_PHONE_NUMBER_ID is configured"
    else
        print_error "❌ WHATSAPP_PHONE_NUMBER_ID is missing"
    fi
    
    if grep -q "JWT_SECRET" backend/.env; then
        print_success "✅ JWT_SECRET is configured"
    else
        print_error "❌ JWT_SECRET is missing"
    fi
else
    print_error "❌ Backend .env file is missing"
fi

# Check if frontend .env exists
if [ -f "frontend/.env" ]; then
    print_success "✅ Frontend .env file exists"
else
    print_warning "⚠️  Frontend .env file missing. Creating it now..."
    echo "VITE_API_BASE_URL=http://localhost:5001/api" > frontend/.env
    print_success "✅ Created frontend/.env file"
fi

echo ""
print_status "Step 7: Database Connection Test"
echo "--------------------------------"

# Test MongoDB connection
if docker exec mr_mongodb mongosh --eval "db.runCommand('ping')" > /dev/null 2>&1; then
    print_success "✅ MongoDB connection working"
else
    print_error "❌ MongoDB connection failed"
fi

# Test Redis connection
if docker exec mr_redis redis-cli ping > /dev/null 2>&1; then
    print_success "✅ Redis connection working"
else
    print_error "❌ Redis connection failed"
fi

echo ""
echo "=================================================="
print_status "🎯 TESTING SUMMARY"
echo "=================================================="

echo ""
print_status "✅ MANUAL TESTING STEPS:"
echo ""
echo "1. 📱 Open browser: http://localhost:5173"
echo "2. 👤 Register new account"
echo "3. 🏷️  Create a test group (e.g., 'Test Group')"
echo "4. 👨‍⚕️ Add Medical Rep with your WhatsApp number"
echo "5. 💬 Create campaign targeting the test group"
echo "6. 📊 Monitor real-time campaign status"
echo "7. 📱 Check your WhatsApp for received message"

echo ""
print_status "🔧 DEBUGGING COMMANDS:"
echo ""
echo "# Backend logs:"
echo "tail -f backend/logs/combined.log"
echo ""
echo "# Database inspection:"
echo "mongosh 'mongodb://localhost:27017/mr_communication_tool'"
echo ""
echo "# Test WhatsApp API:"
echo "curl -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "  'https://graph.facebook.com/v18.0/me'"

echo ""
print_status "🚀 Your MR Communication Tool is ready!"
print_success "All systems checked. You can now test the complete functionality!"

echo ""
echo "=================================================="
