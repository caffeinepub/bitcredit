import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { toast } from 'sonner';
import { isAlreadyNotified, markAsNotified, initializeBaseline } from '../utils/fundedNotificationStore';

export function useFundedWithdrawalNotifications() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  const principalId = identity?.getPrincipal().toString();

  const { data: withdrawalRequests } = useQuery({
    queryKey: ['callerWithdrawalRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCallerWithdrawalRequests();
    },
    enabled: !!actor && !isFetching && !!principalId,
    refetchInterval: 30000, // Poll every 30 seconds
  });

  useEffect(() => {
    if (!withdrawalRequests || !principalId) return;

    // Initialize baseline on first load to prevent historical notifications
    const paidRequestIds = withdrawalRequests
      .filter(r => r.status === 'PAID')
      .map(r => r.id.toString());
    
    initializeBaseline(principalId, paidRequestIds);

    // Check for newly paid requests
    withdrawalRequests.forEach(request => {
      if (request.status === 'PAID') {
        const requestId = request.id.toString();
        if (!isAlreadyNotified(principalId, requestId)) {
          // Show notification
          toast.success(
            `Withdrawal Request #${requestId} has been paid!`,
            {
              description: `Amount: ₿ ${(Number(request.amount) / 100_000_000).toFixed(8)}`,
              duration: 10000,
            }
          );
          
          // Mark as notified
          markAsNotified(principalId, requestId);
        }
      }
    });
  }, [withdrawalRequests, principalId]);
}
