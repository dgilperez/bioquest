/**
 * Simple in-memory cache for location recommendations
 * TODO: Replace with Redis or similar for production
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class RecommendationsCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  /**
   * Generate cache key from user ID and coordinates
   */
  private getCacheKey(userId: string, coordinates: { lat: number; lng: number }): string {
    // Round coordinates to 2 decimal places to group nearby requests
    const lat = Math.round(coordinates.lat * 100) / 100;
    const lng = Math.round(coordinates.lng * 100) / 100;
    return `recommendations:${userId}:${lat}:${lng}`;
  }

  /**
   * Get cached recommendations
   */
  get<T>(userId: string, coordinates: { lat: number; lng: number }): T | null {
    const key = this.getCacheKey(userId, coordinates);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set cached recommendations
   */
  set<T>(
    userId: string,
    coordinates: { lat: number; lng: number },
    data: T,
    ttl: number = this.DEFAULT_TTL
  ): void {
    const key = this.getCacheKey(userId, coordinates);
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Clear cache for a specific user
   */
  clearUser(userId: string): void {
    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith(`recommendations:${userId}:`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all expired entries (garbage collection)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      totalEntries: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Singleton instance
export const recommendationsCache = new RecommendationsCache();

// Run cleanup every hour
setInterval(() => {
  recommendationsCache.cleanup();
}, 60 * 60 * 1000);
