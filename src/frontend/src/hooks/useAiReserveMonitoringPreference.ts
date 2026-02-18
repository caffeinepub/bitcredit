import { useState, useEffect } from 'react';

const STORAGE_KEY = 'aiReserveMonitoringEnabled';

/**
 * Hook to manage AI reserve monitoring preference in localStorage.
 * Returns a boolean state and setter for the Reserve tab toggle.
 * Defaults to true (monitoring enabled) if no preference is stored.
 */
export function useAiReserveMonitoringPreference(): [boolean, (enabled: boolean) => void] {
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === null) {
        return true; // Default to enabled
      }
      return stored === 'true';
    } catch (error) {
      console.error('Failed to read AI reserve monitoring preference:', error);
      return true; // Default to enabled on error
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, isEnabled.toString());
    } catch (error) {
      console.error('Failed to save AI reserve monitoring preference:', error);
    }
  }, [isEnabled]);

  return [isEnabled, setIsEnabled];
}
