import React, { useState, useEffect } from 'react';
import { useCache, useCacheOperations } from '../hooks/useCache';
import { localCache, sessionCache } from '../services/cache.service';

interface MR {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

const CacheDemo: React.FC = () => {
  const [mrs, setMrs] = useState<MR[]>([]);
  const [loading, setLoading] = useState(false);
  const [cacheStats, setCacheStats] = useState<any>(null);
  const { setCache, getCache, deleteCache, clearCache, getCacheStats } = useCacheOperations();

  // Example: Using useCache hook for automatic caching
  const { data: cachedMRs, loading: cacheLoading, refresh, invalidate } = useCache<MR[]>(
    'mrs-demo',
    async () => {
      // Simulate API call
      const response = await fetch('/api/mrs');
      const data = await response.json();
      return data.data || [];
    },
    {
      ttl: 300, // 5 minutes
      useSessionStorage: false,
      autoRefresh: true,
      refreshThreshold: 0.2 // Refresh when 20% of TTL remains
    }
  );

  // Load cache statistics
  useEffect(() => {
    const stats = getCacheStats();
    setCacheStats(stats);
  }, []);

  // Manual cache operations
  const handleSetCache = async () => {
    const testData = { message: 'Hello from cache!', timestamp: Date.now() };
    const success = setCache('test-key', testData, 60); // 1 minute TTL
    if (success) {
      alert('Data cached successfully!');
    }
  };

  const handleGetCache = () => {
    const data = getCache('test-key');
    if (data) {
      alert(`Cached data: ${JSON.stringify(data)}`);
    } else {
      alert('No cached data found');
    }
  };

  const handleDeleteCache = () => {
    const success = deleteCache('test-key');
    if (success) {
      alert('Cache deleted successfully!');
    }
  };

  const handleClearAllCache = () => {
    const success = clearCache();
    if (success) {
      alert('All cache cleared!');
      setCacheStats(getCacheStats());
    }
  };

  const handleRefreshMRs = () => {
    refresh();
  };

  const handleInvalidateMRs = () => {
    invalidate();
  };

  // Manual cache operations for MRs
  const handleCacheMRs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/mrs');
      const data = await response.json();
      
      if (data.success) {
        // Cache in localStorage
        localCache.cacheWithKey('mrs', 'manual', data.data, 300);
        
        // Also cache via API
        await fetch('/api/cache/mrs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ mrs: data.data, ttl: 300 })
        });
        
        alert('MRs cached successfully!');
        setCacheStats(getCacheStats());
      }
    } catch (error) {
      alert('Failed to cache MRs');
    } finally {
      setLoading(false);
    }
  };

  const handleGetCachedMRs = async () => {
    try {
      // Try localStorage first
      const localData = localCache.getCachedData<MR[]>('mrs', 'manual');
      if (localData) {
        setMrs(localData);
        alert('MRs loaded from localStorage cache!');
        return;
      }

      // Try API cache
      const response = await fetch('/api/cache/mrs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success && data.found) {
        setMrs(data.data);
        alert('MRs loaded from Redis cache!');
      } else {
        alert('No cached MRs found');
      }
    } catch (error) {
      alert('Failed to get cached MRs');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Cache Management Demo</h2>
      
      {/* Cache Statistics */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-2">Cache Statistics</h3>
        {cacheStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <span className="font-medium">Storage:</span> {cacheStats.storage}
            </div>
            <div>
              <span className="font-medium">Keys:</span> {cacheStats.keys}
            </div>
            <div>
              <span className="font-medium">Size:</span> {Math.round(cacheStats.size / 1024)} KB
            </div>
            <div>
              <span className="font-medium">Mode:</span> {cacheStats.mode || 'N/A'}
            </div>
          </div>
        )}
      </div>

      {/* Manual Cache Operations */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">Manual Cache Operations</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button
            onClick={handleSetCache}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Set Cache
          </button>
          <button
            onClick={handleGetCache}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Get Cache
          </button>
          <button
            onClick={handleDeleteCache}
            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            Delete Cache
          </button>
          <button
            onClick={handleClearAllCache}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Automatic Cache with useCache Hook */}
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">Automatic Cache (useCache Hook)</h3>
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleRefreshMRs}
            disabled={cacheLoading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {cacheLoading ? 'Loading...' : 'Refresh MRs'}
          </button>
          <button
            onClick={handleInvalidateMRs}
            className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
          >
            Invalidate Cache
          </button>
        </div>
        
        {cachedMRs && (
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Cached MRs ({cachedMRs.length} items)
            </p>
            <div className="max-h-40 overflow-y-auto">
              {cachedMRs.map((mr) => (
                <div key={mr._id} className="text-sm p-2 bg-white rounded mb-1">
                  {mr.name} - {mr.email}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MRs Cache Operations */}
      <div className="bg-purple-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">MRs Cache Operations</h3>
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleCacheMRs}
            disabled={loading}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
          >
            {loading ? 'Caching...' : 'Cache MRs'}
          </button>
          <button
            onClick={handleGetCachedMRs}
            className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
          >
            Get Cached MRs
          </button>
        </div>
        
        {mrs.length > 0 && (
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Loaded MRs ({mrs.length} items)
            </p>
            <div className="max-h-40 overflow-y-auto">
              {mrs.map((mr) => (
                <div key={mr._id} className="text-sm p-2 bg-white rounded mb-1">
                  {mr.name} - {mr.email}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cache Performance Tips */}
      <div className="bg-yellow-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Cache Performance Tips</h3>
        <ul className="text-sm space-y-1">
          <li>• Use localStorage for persistent data that survives browser restarts</li>
          <li>• Use sessionStorage for temporary data that should be cleared when tab closes</li>
          <li>• Set appropriate TTL values based on data freshness requirements</li>
          <li>• Use Redis for server-side caching to reduce database load</li>
          <li>• Implement cache invalidation strategies for data consistency</li>
        </ul>
      </div>
    </div>
  );
};

export default CacheDemo;
