import { useState, useEffect } from 'react';
import { useInternetIdentity } from './useInternetIdentity';

const STORAGE_KEY_PREFIX = 'selfCustodyEducationAcknowledged_';

export function useSelfCustodyEducationAcknowledged() {
  const { identity } = useInternetIdentity();
  const [acknowledged, setAcknowledged] = useState(false);

  const principalId = identity?.getPrincipal().toString();
  const storageKey = principalId ? `${STORAGE_KEY_PREFIX}${principalId}` : null;

  useEffect(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      setAcknowledged(stored === 'true');
    } else {
      setAcknowledged(false);
    }
  }, [storageKey]);

  const markAsAcknowledged = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, 'true');
      setAcknowledged(true);
    }
  };

  return {
    acknowledged,
    markAsAcknowledged,
  };
}
