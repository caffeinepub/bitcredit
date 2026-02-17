import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { Transaction, UserProfile, TransferStatus, SendBTCRequest } from '../backend';
import { toast } from 'sonner';
import { Principal } from '@dfinity/principal';
import { adminStatusCache } from '../utils/adminStatusCache';

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save profile: ${error.message}`);
    },
  });
}

export function useGetCallerBalance() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['balance'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getCallerBalance();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const principalString = identity?.getPrincipal().toString() || null;

  const query = useQuery<boolean>({
    queryKey: ['isAdmin', principalString],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!principalString) throw new Error('No principal available');
      
      const startTime = Date.now();
      
      console.log(`[Admin Check] Principal: ${principalString}`);
      
      // Check if this principal was verified in the current page load
      const verifiedInLoad = adminStatusCache.isVerifiedInCurrentLoad(principalString);
      
      if (!verifiedInLoad) {
        // First verification in this page load - bypass cache and do fresh check
        console.log(`[Admin Check] First verification for this page load, bypassing cache`);
      } else {
        // Already verified in this page load - check cache
        const cached = adminStatusCache.get(principalString);
        if (cached !== null) {
          console.log(`[Admin Check] Using cached result from this page load: ${cached}`);
          return cached;
        }
      }
      
      const queryStartTime = Date.now();
      const result = await actor.isCallerAdmin();
      const queryEndTime = Date.now();
      
      console.log(`[Admin Check] Query completed in: ${queryEndTime - queryStartTime}ms`);
      console.log(`[Admin Check] Total time: ${queryEndTime - startTime}ms`);
      console.log(`[Admin Check] Result: ${result}`);
      
      // Cache the result and mark as verified in current page load
      adminStatusCache.set(principalString, result);
      
      return result;
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Helper to force a refetch bypassing cache - returns a stable function reference
  const retryAdminCheck = async () => {
    if (principalString) {
      console.log(`[Admin Check] Manual retry requested for: ${principalString}`);
      adminStatusCache.clear(principalString);
    }
    queryClient.invalidateQueries({ queryKey: ['isAdmin', principalString] });
    return queryClient.refetchQueries({ queryKey: ['isAdmin', principalString] });
  };

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && !!identity && query.isFetched,
    retryAdminCheck,
  };
}

export function useAssignInitialAdminCredits() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignInitialAdminCredits();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      console.log('[Admin Credits] Initial 500 credits assigned successfully');
    },
    onError: (error: Error) => {
      // Only log error if it's not "already assigned"
      if (!error.message.includes('already assigned')) {
        console.error('[Admin Credits] Failed to assign initial credits:', error.message);
      }
    },
  });
}

export function useTransferCreditsToUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, amount }: { user: Principal; amount: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.transferCreditsToUser(user, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      toast.success('Credits transferred successfully');
    },
    onError: (error: Error) => {
      toast.error(`Transfer failed: ${error.message}`);
    },
  });
}

export function usePurchaseCredits() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ transactionId, amount }: { transactionId: string; amount: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.purchaseCredits(transactionId, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      toast.success('Credits purchased successfully');
    },
    onError: (error: Error) => {
      toast.error(`Purchase failed: ${error.message}`);
    },
  });
}

export function useGetEstimatedNetworkFee(destination: string, amount: bigint) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['estimatedNetworkFee', destination, amount.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getEstimatedNetworkFee(destination, amount);
    },
    enabled: !!actor && !actorFetching && !!destination.trim() && amount > BigInt(0),
    retry: false,
  });
}

export function useSendBTC() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ destination, amount }: { destination: string; amount: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendBTC(destination, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      toast.success('Transfer request created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Transfer failed: ${error.message}`);
    },
  });
}

export function useGetTransactionHistory() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<Transaction[]>({
    queryKey: ['transactionHistory'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTransactionHistory();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useGetTransferRequest(requestId: bigint) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<SendBTCRequest | null>({
    queryKey: ['transferRequest', requestId.toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getTransferRequest(requestId);
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useVerifyBTCTransfer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, blockchainTxId }: { requestId: bigint; blockchainTxId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.verifyBTCTransfer(requestId, blockchainTxId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['transferRequest'] });
      toast.success('Transfer verified successfully');
    },
    onError: (error: Error) => {
      toast.error(`Verification failed: ${error.message}`);
    },
  });
}
