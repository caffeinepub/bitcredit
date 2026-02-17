/**
 * Per-principal admin status cache utility
 * Stores admin verification results in localStorage with TTL
 */

interface CachedAdminStatus {
  isAdmin: boolean;
  timestamp: number;
  principal: string;
}

const CACHE_KEY_PREFIX = 'admin_status_';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const adminStatusCache = {
  /**
   * Get cached admin status for a principal
   */
  get(principal: string): boolean | null {
    try {
      const key = CACHE_KEY_PREFIX + principal;
      const cached = localStorage.getItem(key);
      
      if (!cached) return null;
      
      const data: CachedAdminStatus = JSON.parse(cached);
      
      // Check if cache is still valid
      const age = Date.now() - data.timestamp;
      if (age > CACHE_TTL_MS) {
        localStorage.removeItem(key);
        return null;
      }
      
      return data.isAdmin;
    } catch (error) {
      console.error('Error reading admin status cache:', error);
      return null;
    }
  },

  /**
   * Set cached admin status for a principal
   */
  set(principal: string, isAdmin: boolean): void {
    try {
      const key = CACHE_KEY_PREFIX + principal;
      const data: CachedAdminStatus = {
        isAdmin,
        timestamp: Date.now(),
        principal,
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error writing admin status cache:', error);
    }
  },

  /**
   * Clear cached admin status for a specific principal
   */
  clear(principal: string): void {
    try {
      const key = CACHE_KEY_PREFIX + principal;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing admin status cache:', error);
    }
  },

  /**
   * Clear all cached admin statuses (for logout)
   */
  clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing all admin status caches:', error);
    }
  },
};
