/**
 * Per-principal admin status cache utility
 * Stores admin verification results in localStorage with TTL
 * Uses in-memory session tracking to ensure fresh checks on new app loads
 */

interface CachedAdminStatus {
  isAdmin: boolean;
  timestamp: number;
  principal: string;
}

const CACHE_KEY_PREFIX = 'admin_status_';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// In-memory tracking of principals verified in this page load
const verifiedInCurrentLoad = new Set<string>();

export const adminStatusCache = {
  /**
   * Get cached admin status for a principal
   * Only returns cached value if principal was verified in current page load
   */
  get(principal: string): boolean | null {
    // Only use cache if this principal was verified in the current page load
    if (!verifiedInCurrentLoad.has(principal)) {
      return null;
    }

    try {
      const key = CACHE_KEY_PREFIX + principal;
      const cached = localStorage.getItem(key);
      
      if (!cached) return null;
      
      const data: CachedAdminStatus = JSON.parse(cached);
      
      // Check if cache is still valid
      const age = Date.now() - data.timestamp;
      if (age > CACHE_TTL_MS) {
        // Cache expired
        localStorage.removeItem(key);
        return null;
      }
      
      return data.isAdmin;
    } catch (error) {
      console.error('[Admin Cache] Error reading cache:', error);
      return null;
    }
  },

  /**
   * Set cached admin status for a principal
   * Marks principal as verified in current page load
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
      verifiedInCurrentLoad.add(principal);
    } catch (error) {
      console.error('[Admin Cache] Error writing cache:', error);
    }
  },

  /**
   * Clear cached admin status for a specific principal
   */
  clear(principal: string): void {
    try {
      const key = CACHE_KEY_PREFIX + principal;
      localStorage.removeItem(key);
      verifiedInCurrentLoad.delete(principal);
    } catch (error) {
      console.error('[Admin Cache] Error clearing cache:', error);
    }
  },

  /**
   * Clear all cached admin statuses (used on logout)
   */
  clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      verifiedInCurrentLoad.clear();
    } catch (error) {
      console.error('[Admin Cache] Error clearing all caches:', error);
    }
  },

  /**
   * Check if a principal has been verified in the current page load
   */
  isVerifiedInCurrentLoad(principal: string): boolean {
    return verifiedInCurrentLoad.has(principal);
  },

  /**
   * Mark a principal as verified in the current page load
   */
  markVerifiedInCurrentLoad(principal: string): void {
    verifiedInCurrentLoad.add(principal);
  },
};
