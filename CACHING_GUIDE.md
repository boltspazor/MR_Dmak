# 🚀 MR Project Caching System Guide

This guide explains how to use the comprehensive caching system implemented in the MR Project, which includes both Redis (server-side) and browser storage (client-side) caching.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Redis Caching (Backend)](#redis-caching-backend)
- [Browser Caching (Frontend)](#browser-caching-frontend)
- [Docker Setup](#docker-setup)
- [API Endpoints](#api-endpoints)
- [Usage Examples](#usage-examples)
- [Performance Tips](#performance-tips)
- [Troubleshooting](#troubleshooting)

## 🏗️ Architecture Overview

The caching system uses a multi-layer approach:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Redis         │
│   (Browser)     │    │   (Node.js)     │    │   (Docker)      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • localStorage  │◄──►│ • Cache Service │◄──►│ • Key-Value     │
│ • sessionStorage│    │ • API Endpoints │    │ • TTL Support   │
│ • useCache Hook │    │ • Auto-fallback │    │ • Persistence   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔴 Redis Caching (Backend)

### Features
- **Automatic Fallback**: Gracefully handles Redis unavailability
- **TTL Support**: Time-to-live for automatic expiration
- **Pattern Matching**: Delete multiple keys with patterns
- **Health Monitoring**: Connection status and statistics
- **Memory Management**: Configurable memory limits and eviction policies

### Configuration

Environment variables:
```bash
REDIS_HOST=redis          # Redis host (use 'redis' for Docker)
REDIS_PORT=6379           # Redis port
```

### Usage in Backend

```typescript
import cacheService from './services/cache.service';

// Set cache with TTL (1 hour)
await cacheService.set('user:123', userData, 3600);

// Get cached data
const userData = await cacheService.get('user:123');

// Cache with automatic key generation
await cacheService.cacheWithKey('mrs', 'all', mrsData, 1800);

// Get cached data with automatic key
const mrsData = await cacheService.getCachedData('mrs', 'all');

// Delete cache
await cacheService.delete('user:123');

// Delete by pattern
await cacheService.deletePattern('user:*');

// Get cache statistics
const stats = await cacheService.getStats();
```

## 🌐 Browser Caching (Frontend)

### Features
- **Dual Storage**: localStorage and sessionStorage support
- **Automatic Expiration**: TTL-based cache invalidation
- **React Hooks**: Easy integration with React components
- **Type Safety**: Full TypeScript support
- **Performance**: Optimized for browser storage limits

### Usage in Frontend

#### 1. Direct Cache Service

```typescript
import { localCache, sessionCache } from './services/cache.service';

// Set cache (localStorage)
localCache.set('user-data', userData, 3600); // 1 hour

// Get cache
const userData = localCache.get('user-data');

// Set cache (sessionStorage)
sessionCache.set('temp-data', tempData, 300); // 5 minutes

// Cache with automatic key generation
localCache.cacheWithKey('mrs', 'list', mrsData, 1800);

// Get cached data
const mrsData = localCache.getCachedData('mrs', 'list');
```

#### 2. React Hook (Recommended)

```typescript
import { useCache } from './hooks/useCache';

function MyComponent() {
  const { data, loading, error, refresh, invalidate } = useCache(
    'mrs-list',
    async () => {
      const response = await fetch('/api/mrs');
      return response.json();
    },
    {
      ttl: 300,              // 5 minutes
      useSessionStorage: false,
      autoRefresh: true,     // Auto-refresh when TTL is low
      refreshThreshold: 0.2  // Refresh when 20% of TTL remains
    }
  );

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {data && <p>Data: {JSON.stringify(data)}</p>}
      <button onClick={refresh}>Refresh</button>
      <button onClick={invalidate}>Clear Cache</button>
    </div>
  );
}
```

#### 3. Cache Operations Hook

```typescript
import { useCacheOperations } from './hooks/useCache';

function CacheManager() {
  const { setCache, getCache, deleteCache, clearCache, getCacheStats } = useCacheOperations();

  const handleSetCache = () => {
    setCache('my-key', { data: 'value' }, 3600);
  };

  const handleGetCache = () => {
    const data = getCache('my-key');
    console.log(data);
  };

  return (
    <div>
      <button onClick={handleSetCache}>Set Cache</button>
      <button onClick={handleGetCache}>Get Cache</button>
      <button onClick={() => deleteCache('my-key')}>Delete</button>
      <button onClick={clearCache}>Clear All</button>
    </div>
  );
}
```

## 🐳 Docker Setup

### Quick Start

```bash
# Run the setup script
./docker-setup.sh
```

### Manual Setup

```bash
# Build and start all services
docker-compose up --build -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Services

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

## 🔌 API Endpoints

### Cache Management

```bash
# Get cache statistics
GET /api/cache/stats

# Set cache value
POST /api/cache/set
{
  "key": "user:123",
  "value": { "name": "John" },
  "ttl": 3600
}

# Get cache value
GET /api/cache/get/:key

# Delete cache value
DELETE /api/cache/delete/:key

# Clear all cache
DELETE /api/cache/clear

# Invalidate by pattern
POST /api/cache/invalidate-pattern
{
  "pattern": "user:*"
}
```

### Data-Specific Caching

```bash
# Cache MRs
POST /api/cache/mrs
{
  "mrs": [...],
  "ttl": 1800
}

# Get cached MRs
GET /api/cache/mrs

# Cache campaigns
POST /api/cache/campaigns
{
  "campaigns": [...],
  "ttl": 1800
}

# Get cached campaigns
GET /api/cache/campaigns
```

## 💡 Usage Examples

### 1. Caching API Responses

```typescript
// Backend: Cache expensive database queries
const getMRs = async (req, res) => {
  const cacheKey = 'mrs:all';
  let mrs = await cacheService.get(cacheKey);
  
  if (!mrs) {
    mrs = await MR.find().populate('addedBy');
    await cacheService.set(cacheKey, mrs, 1800); // 30 minutes
  }
  
  res.json({ success: true, data: mrs });
};
```

### 2. Frontend Data Caching

```typescript
// Frontend: Cache user preferences
const { data: preferences } = useCache(
  'user-preferences',
  async () => {
    const response = await fetch('/api/user/preferences');
    return response.json();
  },
  { ttl: 3600, useSessionStorage: false }
);
```

### 3. Real-time Cache Invalidation

```typescript
// Backend: Invalidate cache when data changes
const updateMR = async (req, res) => {
  const updatedMR = await MR.findByIdAndUpdate(id, data);
  
  // Invalidate related caches
  await cacheService.deletePattern('mrs:*');
  await cacheService.deletePattern('dashboard:*');
  
  res.json({ success: true, data: updatedMR });
};
```

## ⚡ Performance Tips

### 1. TTL Strategy
- **Static Data**: 24 hours (86400 seconds)
- **User Data**: 1 hour (3600 seconds)
- **Real-time Data**: 5 minutes (300 seconds)
- **Temporary Data**: 1 minute (60 seconds)

### 2. Cache Keys
- Use consistent naming: `type:id` or `type:action:params`
- Include version numbers for breaking changes
- Use descriptive prefixes: `user:`, `mrs:`, `campaigns:`

### 3. Memory Management
- Set appropriate Redis memory limits
- Use LRU eviction policy for automatic cleanup
- Monitor cache hit rates and adjust TTL accordingly

### 4. Browser Storage
- Use localStorage for persistent data
- Use sessionStorage for temporary data
- Implement cache size monitoring
- Clean expired entries regularly

## 🔧 Troubleshooting

### Redis Connection Issues

```bash
# Check Redis status
docker-compose exec redis redis-cli ping

# View Redis logs
docker-compose logs redis

# Monitor Redis commands
docker-compose exec redis redis-cli monitor
```

### Cache Not Working

1. **Check Redis Connection**:
   ```bash
   curl http://localhost:5000/api/cache/stats
   ```

2. **Verify Environment Variables**:
   ```bash
   echo $REDIS_HOST
   echo $REDIS_PORT
   ```

3. **Check Browser Storage**:
   ```javascript
   console.log(localStorage.getItem('mr_app_cache:test-key'));
   ```

### Performance Issues

1. **Monitor Cache Hit Rate**:
   ```bash
   curl http://localhost:5000/api/cache/stats
   ```

2. **Check Memory Usage**:
   ```bash
   docker-compose exec redis redis-cli info memory
   ```

3. **Clear Cache if Needed**:
   ```bash
   curl -X DELETE http://localhost:5000/api/cache/clear
   ```

## 📊 Monitoring

### Cache Statistics

```typescript
// Get comprehensive cache stats
const stats = await cacheService.getStats();
console.log({
  connected: stats.connected,
  keys: stats.keys,
  memory: stats.memory
});
```

### Browser Storage Stats

```typescript
// Get browser cache stats
const stats = localCache.getStats();
console.log({
  storage: stats.storage,
  keys: stats.keys,
  size: stats.size
});
```

## 🚀 Production Considerations

1. **Redis Persistence**: Enable AOF for data durability
2. **Memory Limits**: Set appropriate Redis memory limits
3. **Monitoring**: Implement cache hit/miss monitoring
4. **Security**: Secure Redis with authentication
5. **Backup**: Regular Redis data backups
6. **Scaling**: Consider Redis Cluster for high availability

## 📝 Best Practices

1. **Always handle cache failures gracefully**
2. **Use appropriate TTL values for different data types**
3. **Implement cache warming for critical data**
4. **Monitor cache performance and adjust accordingly**
5. **Use cache invalidation strategies for data consistency**
6. **Test cache behavior in different scenarios**

---

For more information, see the [API Documentation](./backend/API_DOCS.md) or contact the development team.
