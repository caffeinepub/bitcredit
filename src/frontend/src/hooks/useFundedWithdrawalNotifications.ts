import { useEffect, useRef } from 'react';
import { useInternetIdentity } from './useInternetIdentity';
import type { WithdrawalRequest } from '../backend';
import { toast } from 'sonner';
import { 
  loadNotificationState, 
  markAsNotified, 
  initializeBaseline 
} from '../utils/fundedNotificationStore';

/**
 * Hook that monitors withdrawal requests and shows a toast notification
 * when a request transitions from PENDING to PAID.
 * 
 * Notifications are shown at most once per request ID per principal.
 */
export function useFundedWithdrawalNotifications(requests: WithdrawalRequest[] | undefined) {
  const { identity } = useInternetIdentity();
  const previousRequestsRef = useRef<Map<string, string>>(new Map()); // requestId -> status
  const initializedRef = useRef(false);
  
  const principalId = identity?.getPrincipal().toString();

  useEffect(() => {
    // Reset state when principal changes
    if (principalId) {
      previousRequestsRef.current = new Map();
      initializedRef.current = false;
    }
  }, [principalId]);

  useEffect(() => {
    if (!principalId || !requests || requests.length === 0) {
      return;
    }

    // Initialize baseline on first load to prevent historical PAID requests from notifying
    if (!initializedRef.current) {
      const currentlyPaidIds = requests
        .filter(req => req.status === 'PAID')
        .map(req => req.id.toString());
      
      initializeBaseline(principalId, currentlyPaidIds);
      
      // Populate previousRequestsRef with current state
      requests.forEach(req => {
        previousRequestsRef.current.set(req.id.toString(), req.status);
      });
      
      initializedRef.current = true;
      return;
    }

    // Check for status transitions to PAID
    const notificationState = loadNotificationState(principalId);
    
    requests.forEach(req => {
      const requestId = req.id.toString();
      const currentStatus = req.status;
      const previousStatus = previousRequestsRef.current.get(requestId);

      // Detect transition to PAID
      if (currentStatus === 'PAID' && previousStatus && previousStatus !== 'PAID') {
        // Check if we've already notified about this request
        if (!notificationState.notifiedIds.includes(requestId)) {
          // Show toast notification
          toast.success(`Payout funded: Request #${requestId} was marked Paid.`, {
            duration: 5000,
          });
          
          // Mark as notified
          markAsNotified(principalId, requestId);
        }
      }

      // Update previous status
      previousRequestsRef.current.set(requestId, currentStatus);
    });
  }, [requests, principalId]);
}
