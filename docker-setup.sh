#!/bin/bash

# MR Project Docker Setup Script
# This script sets up the complete MR Project with Redis caching

set -e

echo "🚀 Starting MR Project Docker Setup..."

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

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

print_status "Docker and Docker Compose are available"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p backend/uploads backend/logs
mkdir -p frontend/dist

# Set proper permissions
chmod 755 backend/uploads backend/logs

# Build and start services
print_status "Building and starting services..."

# Stop any existing containers
print_status "Stopping existing containers..."
docker-compose down --remove-orphans

# Build and start services
print_status "Building images..."
docker-compose build --no-cache

print_status "Starting services..."
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Check service health
print_status "Checking service health..."

# Check MongoDB
if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    print_success "MongoDB is ready"
else
    print_warning "MongoDB is not ready yet, waiting..."
    sleep 5
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is ready"
else
    print_warning "Redis is not ready yet, waiting..."
    sleep 5
fi

# Check Backend
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    print_success "Backend is ready"
else
    print_warning "Backend is not ready yet, waiting..."
    sleep 10
fi

# Check Frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_success "Frontend is ready"
else
    print_warning "Frontend is not ready yet, waiting..."
    sleep 5
fi

# Display service information
echo ""
print_success "🎉 MR Project is now running with Redis caching!"
echo ""
echo "📋 Service Information:"
echo "  • Frontend: http://localhost:3000"
echo "  • Backend API: http://localhost:5000/api"
echo "  • MongoDB: localhost:27017"
echo "  • Redis: localhost:6379"
echo ""
echo "🔧 Cache Management:"
echo "  • Redis Cache API: http://localhost:5000/api/cache"
echo "  • Cache Stats: http://localhost:5000/api/cache/stats"
echo ""
echo "📊 Useful Commands:"
echo "  • View logs: docker-compose logs -f"
echo "  • Stop services: docker-compose down"
echo "  • Restart services: docker-compose restart"
echo "  • Rebuild: docker-compose up --build"
echo "  • Access Redis CLI: docker-compose exec redis redis-cli"
echo "  • Access MongoDB: docker-compose exec mongodb mongosh"
echo ""

# Test Redis connection
print_status "Testing Redis connection..."
if docker-compose exec -T redis redis-cli set test "Hello Redis" > /dev/null 2>&1; then
    if docker-compose exec -T redis redis-cli get test | grep -q "Hello Redis"; then
        print_success "Redis is working correctly"
        docker-compose exec -T redis redis-cli del test > /dev/null 2>&1
    else
        print_warning "Redis test failed"
    fi
else
    print_warning "Could not test Redis connection"
fi

# Test cache API
print_status "Testing cache API..."
if curl -f http://localhost:5000/api/cache/stats > /dev/null 2>&1; then
    print_success "Cache API is accessible"
else
    print_warning "Cache API is not accessible yet"
fi

echo ""
print_success "Setup complete! Your MR Project is running with Redis caching support."
echo ""
print_status "You can now:"
echo "  1. Open http://localhost:3000 in your browser"
echo "  2. Test the cache functionality"
echo "  3. Monitor Redis with: docker-compose exec redis redis-cli monitor"
echo "  4. View cache statistics at: http://localhost:5000/api/cache/stats"
