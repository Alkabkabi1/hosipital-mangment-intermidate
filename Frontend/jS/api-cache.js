// API Caching System
// Provides intelligent caching for API responses to improve performance

class APICacheManager {
  constructor() {
    this.cache = new Map();
    this.cacheConfig = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
    this.maxCacheSize = 100; // Maximum number of cached items
    this.init();
  }

  init() {
    this.setupDefaultCacheConfig();
    this.startCleanupInterval();
    console.log('✅ API Cache Manager initialized');
  }

  setupDefaultCacheConfig() {
    // Configure cache TTL for different endpoints
    this.cacheConfig.set('/api/auth/me', { ttl: 10 * 60 * 1000, priority: 'high' }); // 10 minutes
    this.cacheConfig.set('/api/clearance', { ttl: 2 * 60 * 1000, priority: 'medium' }); // 2 minutes
    this.cacheConfig.set('/api/delegation', { ttl: 2 * 60 * 1000, priority: 'medium' }); // 2 minutes
    this.cacheConfig.set('/api/onboarding', { ttl: 2 * 60 * 1000, priority: 'medium' }); // 2 minutes
    this.cacheConfig.set('/api/profile', { ttl: 5 * 60 * 1000, priority: 'high' }); // 5 minutes
    this.cacheConfig.set('/api/departments', { ttl: 30 * 60 * 1000, priority: 'high' }); // 30 minutes
    this.cacheConfig.set('/api/employees', { ttl: 10 * 60 * 1000, priority: 'medium' }); // 10 minutes
    this.cacheConfig.set('/api/health', { ttl: 30 * 1000, priority: 'low' }); // 30 seconds
  }

  generateCacheKey(url, method = 'GET', body = null) {
    const key = `${method}:${url}`;
    if (body && method !== 'GET') {
      // Include a hash of the body for POST/PUT requests that might be cacheable
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
      return `${key}:${this.simpleHash(bodyStr)}`;
    }
    return key;
  }

  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  isCacheable(url, method) {
    // Only cache GET requests by default
    if (method !== 'GET') return false;
    
    // Don't cache authentication requests (except /me)
    if (url.includes('/login') || url.includes('/register') || url.includes('/logout')) {
      return false;
    }
    
    // Don't cache requests with query parameters that indicate real-time data
    if (url.includes('timestamp=') || url.includes('_t=')) {
      return false;
    }
    
    return true;
  }

  getCacheConfig(url) {
    // Find the most specific cache config
    for (const [pattern, config] of this.cacheConfig) {
      if (url.startsWith(pattern) || url.includes(pattern)) {
        return config;
      }
    }
    return { ttl: this.defaultTTL, priority: 'medium' };
  }

  set(url, method, body, response) {
    if (!this.isCacheable(url, method)) return;

    const key = this.generateCacheKey(url, method, body);
    const config = this.getCacheConfig(url);
    
    const cacheItem = {
      data: this.cloneResponse(response),
      timestamp: Date.now(),
      ttl: config.ttl,
      priority: config.priority,
      hits: 0,
      url: url
    };

    // Check cache size and evict if necessary
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastUsed();
    }

    this.cache.set(key, cacheItem);
    console.log(`📦 Cached response for ${method} ${url}`);
  }

  get(url, method = 'GET', body = null) {
    if (!this.isCacheable(url, method)) return null;

    const key = this.generateCacheKey(url, method, body);
    const cacheItem = this.cache.get(key);

    if (!cacheItem) return null;

    // Check if cache item has expired
    if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {
      this.cache.delete(key);
      console.log(`⏰ Cache expired for ${method} ${url}`);
      return null;
    }

    // Update hit count
    cacheItem.hits++;
    console.log(`🎯 Cache hit for ${method} ${url} (${cacheItem.hits} hits)`);
    
    return this.cloneResponse(cacheItem.data);
  }

  cloneResponse(response) {
    try {
      return JSON.parse(JSON.stringify(response));
    } catch (error) {
      console.warn('Failed to clone response for caching:', error);
      return response;
    }
  }

  evictLeastUsed() {
    let leastUsedKey = null;
    let leastUsedItem = null;
    let minScore = Infinity;

    for (const [key, item] of this.cache) {
      // Calculate score based on hits, age, and priority
      const age = Date.now() - item.timestamp;
      const priorityMultiplier = item.priority === 'high' ? 3 : item.priority === 'medium' ? 2 : 1;
      const score = (item.hits * priorityMultiplier) / (age / 1000); // hits per second with priority

      if (score < minScore) {
        minScore = score;
        leastUsedKey = key;
        leastUsedItem = item;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
      console.log(`🗑️ Evicted cache item: ${leastUsedItem.url}`);
    }
  }

  invalidate(pattern) {
    const keysToDelete = [];
    for (const [key, item] of this.cache) {
      if (item.url.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    if (keysToDelete.length > 0) {
      console.log(`🔄 Invalidated ${keysToDelete.length} cache entries matching: ${pattern}`);
    }
  }

  invalidateAll() {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🧹 Cleared all cache entries (${size} items)`);
  }

  startCleanupInterval() {
    // Clean up expired cache items every 2 minutes
    setInterval(() => {
      this.cleanupExpired();
    }, 2 * 60 * 1000);
  }

  cleanupExpired() {
    const keysToDelete = [];
    const now = Date.now();

    for (const [key, item] of this.cache) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    if (keysToDelete.length > 0) {
      console.log(`🧹 Cleaned up ${keysToDelete.length} expired cache entries`);
    }
  }

  getStats() {
    const stats = {
      totalItems: this.cache.size,
      totalHits: 0,
      byPriority: { high: 0, medium: 0, low: 0 },
      oldestItem: null,
      newestItem: null,
      mostUsedItem: null
    };

    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;
    let maxHits = 0;

    for (const [key, item] of this.cache) {
      stats.totalHits += item.hits;
      stats.byPriority[item.priority]++;

      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
        stats.oldestItem = { url: item.url, age: Date.now() - item.timestamp };
      }

      if (item.timestamp > newestTimestamp) {
        newestTimestamp = item.timestamp;
        stats.newestItem = { url: item.url, age: Date.now() - item.timestamp };
      }

      if (item.hits > maxHits) {
        maxHits = item.hits;
        stats.mostUsedItem = { url: item.url, hits: item.hits };
      }
    }

    return stats;
  }

  // Smart cache warming - preload frequently accessed data
  async warmCache() {
    console.log('🔥 Warming up cache...');
    
    const warmupEndpoints = [
      '/api/health',
      '/api/auth/me'
    ];

    const promises = warmupEndpoints.map(async (endpoint) => {
      try {
        if (window.apiClient) {
          await window.apiClient.makeRequest(endpoint);
        }
      } catch (error) {
        console.warn(`Failed to warm cache for ${endpoint}:`, error);
      }
    });

    await Promise.allSettled(promises);
    console.log('✅ Cache warmup completed');
  }
}

// Enhanced API Client with Caching
class CachedAPIClient {
  constructor(originalClient, cacheManager) {
    this.originalClient = originalClient;
    this.cache = cacheManager;
    this.requestsInFlight = new Map(); // Prevent duplicate requests
  }

  async makeRequest(endpoint, options = {}) {
    const method = options.method || 'GET';
    const body = options.body;
    
    // Check cache first
    const cachedResponse = this.cache.get(endpoint, method, body);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Check if request is already in flight
    const requestKey = this.cache.generateCacheKey(endpoint, method, body);
    if (this.requestsInFlight.has(requestKey)) {
      return await this.requestsInFlight.get(requestKey);
    }

    // Make the request
    const requestPromise = this.originalClient.makeRequest(endpoint, options);
    this.requestsInFlight.set(requestKey, requestPromise);

    try {
      const response = await requestPromise;
      
      // Cache successful responses
      if (response && !response.error) {
        this.cache.set(endpoint, method, body, response);
      }

      return response;
    } catch (error) {
      // Don't cache errors
      throw error;
    } finally {
      this.requestsInFlight.delete(requestKey);
    }
  }

  // Proxy all other methods to original client
  getCurrentUser() {
    return this.originalClient.getCurrentUser();
  }

  setToken(token) {
    return this.originalClient.setToken(token);
  }

  clearToken() {
    // Clear cache when token is cleared
    this.cache.invalidateAll();
    return this.originalClient.clearToken();
  }

  // Proxy all API methods
  async login(email, password) {
    const result = await this.originalClient.login(email, password);
    // Invalidate cache on login
    this.cache.invalidateAll();
    return result;
  }

  async createClearance(data) {
    const result = await this.originalClient.createClearance(data);
    // Invalidate clearance cache
    this.cache.invalidate('/api/clearance');
    return result;
  }

  async createDelegation(data) {
    const result = await this.originalClient.createDelegation(data);
    // Invalidate delegation cache
    this.cache.invalidate('/api/delegation');
    return result;
  }

  async createOnboarding(data) {
    const result = await this.originalClient.createOnboarding(data);
    // Invalidate onboarding cache
    this.cache.invalidate('/api/onboarding');
    return result;
  }

  // Add other methods as needed...
}

// Initialize global cache manager
window.apiCacheManager = new APICacheManager();

// Replace global apiClient with cached version if it exists
if (window.apiClient) {
  const originalClient = window.apiClient;
  window.apiClient = new CachedAPIClient(originalClient, window.apiCacheManager);
  console.log('✅ API Client enhanced with caching');
}

// Provide global cache functions
window.invalidateCache = (pattern) => window.apiCacheManager.invalidate(pattern);
window.clearCache = () => window.apiCacheManager.invalidateAll();
window.getCacheStats = () => window.apiCacheManager.getStats();

// Warm cache when page loads
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    if (window.apiCacheManager) {
      window.apiCacheManager.warmCache();
    }
  }, 1000);
});

console.log('✅ API Caching System initialized');
