// import { useState, useEffect, useCallback } from 'react';
// import { localCache, sessionCache } from '../services/cache.service';

// interface UseCacheOptions {
//   ttl?: number; // Time to live in seconds
//   useSessionStorage?: boolean; // Use sessionStorage instead of localStorage
//   autoRefresh?: boolean; // Automatically refresh when TTL is about to expire
//   refreshThreshold?: number; // Refresh when TTL is below this percentage (0-1)
// }

// interface CacheState<T> {
//   data: T | null;
//   loading: boolean;
//   error: string | null;
//   fromCache: boolean;
//   ttl: number;
// }

// export function useCache<T>(
//   key: string,
//   fetcher: () => Promise<T>,
//   options: UseCacheOptions = {}
// ) {
//   const {
//     ttl = 3600,
//     useSessionStorage = false,
//     autoRefresh = false,
//     refreshThreshold = 0.1
//   } = options;

//   const cache = useSessionStorage ? sessionCache : localCache;
  
//   const [state, setState] = useState<CacheState<T>>({
//     data: null,
//     loading: false,
//     error: null,
//     fromCache: false,
//     ttl: 0
//   });

//   // Check if data needs refresh
//   const needsRefresh = useCallback(() => {
//     if (!state.data) return true;
    
//     const remainingTTL = cache.getTTL(key);
//     const totalTTL = ttl;
//     const threshold = totalTTL * refreshThreshold;
    
//     return remainingTTL <= threshold;
//   }, [key, state.data, ttl, refreshThreshold, cache]);

//   // Fetch data from API
//   const fetchData = useCallback(async (useCache: boolean = true) => {
//     setState(prev => ({ ...prev, loading: true, error: null }));

//     try {
//       // Try to get from cache first
//       if (useCache) {
//         const cachedData = cache.get<T>(key);
//         if (cachedData) {
//           setState(prev => ({
//             ...prev,
//             data: cachedData,
//             loading: false,
//             fromCache: true,
//             ttl: cache.getTTL(key)
//           }));
//           return;
//         }
//       }

//       // Fetch from API
//       const data = await fetcher();
      
//       // Cache the result
//       cache.set(key, data, ttl);
      
//       setState(prev => ({
//         ...prev,
//         data,
//         loading: false,
//         fromCache: false,
//         ttl: cache.getTTL(key)
//       }));
//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//       setState(prev => ({
//         ...prev,
//         loading: false,
//         error: errorMessage
//       }));
//     }
//   }, [key, fetcher, ttl, cache]);

//   // Refresh data (force fetch from API)
//   const refresh = useCallback(() => {
//     fetchData(false);
//   }, [fetchData]);

//   // Invalidate cache
//   const invalidate = useCallback(() => {
//     cache.delete(key);
//     setState(prev => ({
//       ...prev,
//       data: null,
//       fromCache: false,
//       ttl: 0
//     }));
//   }, [key, cache]);

//   // Auto-refresh effect
//   useEffect(() => {
//     if (!autoRefresh || !state.data) return;

//     const checkRefresh = () => {
//       if (needsRefresh()) {
//         fetchData(false);
//       }
//     };

//     // Check every minute
//     const interval = setInterval(checkRefresh, 60000);
//     return () => clearInterval(interval);
//   }, [autoRefresh, state.data, needsRefresh, fetchData]);

//   // Initial load
//   useEffect(() => {
//     fetchData();
//   }, [fetchData]);

//   return {
//     ...state,
//     refresh,
//     invalidate,
//     needsRefresh: needsRefresh()
//   };
// }

// // Hook for simple cache operations
// export function useCacheOperations() {
//   const setCache = useCallback(<T>(key: string, data: T, ttl: number = 3600, useSessionStorage: boolean = false) => {
//     const cache = useSessionStorage ? sessionCache : localCache;
//     return cache.set(key, data, ttl);
//   }, []);

//   const getCache = useCallback(<T>(key: string, useSessionStorage: boolean = false): T | null => {
//     const cache = useSessionStorage ? sessionCache : localCache;
//     return cache.get<T>(key);
//   }, []);

//   const deleteCache = useCallback((key: string, useSessionStorage: boolean = false) => {
//     const cache = useSessionStorage ? sessionCache : localCache;
//     return cache.delete(key);
//   }, []);

//   const clearCache = useCallback((useSessionStorage: boolean = false) => {
//     const cache = useSessionStorage ? sessionCache : localCache;
//     return cache.clear();
//   }, []);

//   const getCacheStats = useCallback((useSessionStorage: boolean = false) => {
//     const cache = useSessionStorage ? sessionCache : localCache;
//     return cache.getStats();
//   }, []);

//   return {
//     setCache,
//     getCache,
//     deleteCache,
//     clearCache,
//     getCacheStats
//   };
// }

// // Hook for caching API responses
// export function useApiCache<T>(
//   apiCall: () => Promise<T>,
//   cacheKey: string,
//   options: UseCacheOptions = {}
// ) {
//   return useCache(cacheKey, apiCall, options);
// }

// export default useCache;
