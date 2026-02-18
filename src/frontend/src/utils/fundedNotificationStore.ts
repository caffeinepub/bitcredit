/**
 * Per-principal localStorage-backed store for tracking which withdrawal request IDs
 * have already been announced as PAID to prevent duplicate notifications.
 */

const STORAGE_KEY_PREFIX = 'fundedNotifications_';

interface NotificationState {
  notifiedIds: string[]; // Array of withdrawal request IDs already announced
  lastUpdated: number;
}

/**
 * Get the storage key for a specific principal
 */
function getStorageKey(principalId: string): string {
  return `${STORAGE_KEY_PREFIX}${principalId}`;
}

/**
 * Load the notification state for a principal
 */
export function loadNotificationState(principalId: string): NotificationState {
  try {
    const key = getStorageKey(principalId);
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load notification state:', error);
  }
  return { notifiedIds: [], lastUpdated: Date.now() };
}

/**
 * Save the notification state for a principal
 */
export function saveNotificationState(principalId: string, state: NotificationState): void {
  try {
    const key = getStorageKey(principalId);
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save notification state:', error);
  }
}

/**
 * Check if a withdrawal request ID has already been notified
 */
export function isAlreadyNotified(principalId: string, requestId: string): boolean {
  const state = loadNotificationState(principalId);
  return state.notifiedIds.includes(requestId);
}

/**
 * Mark a withdrawal request ID as notified
 */
export function markAsNotified(principalId: string, requestId: string): void {
  const state = loadNotificationState(principalId);
  if (!state.notifiedIds.includes(requestId)) {
    state.notifiedIds.push(requestId);
    state.lastUpdated = Date.now();
    saveNotificationState(principalId, state);
  }
}

/**
 * Initialize the baseline for a principal with currently PAID requests
 * (to prevent historical PAID requests from generating notifications on first load)
 */
export function initializeBaseline(principalId: string, paidRequestIds: string[]): void {
  const state = loadNotificationState(principalId);
  
  // Only initialize if this is the first time (empty notifiedIds)
  if (state.notifiedIds.length === 0) {
    state.notifiedIds = [...paidRequestIds];
    state.lastUpdated = Date.now();
    saveNotificationState(principalId, state);
  }
}

/**
 * Clear notification state for a principal (useful on logout)
 */
export function clearNotificationState(principalId: string): void {
  try {
    const key = getStorageKey(principalId);
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear notification state:', error);
  }
}
