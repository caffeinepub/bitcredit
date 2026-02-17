import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { Transaction, UserProfile, TransferStatus, SendBTCRequest, BitcoinWallet } from '../backend';
import { toast } from 'sonner';
import { Principal } from '@dfinity/principal';
import { adminStatusCache } from '../utils/adminStatusCache';
import { normalizeSendBTCError } from '../utils/errors';

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

export function useGetCallerBitcoinWallet() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<BitcoinWallet | null>({
    queryKey: ['callerBitcoinWallet'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerBitcoinWallet();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - wallet identity is stable
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useCreateCallerBitcoinWallet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.createCallerBitcoinWallet();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerBitcoinWallet'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Wallet created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create wallet: ${error.message}`);
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
  const actorResult = useActor();
  const { actor, isFetching: actorFetching } = actorResult;
  const tokenDetected = (actorResult as any).tokenDetected || false;
  const accessControlInitialized = (actorResult as any).accessControlInitialized || false;
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const principalString = identity?.getPrincipal().toString() || null;

  const query = useQuery<boolean>({
    queryKey: ['isAdmin', principalString],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      if (!principalString) throw new Error('No principal available');
      
      const startTime = Date.now();
      
      // Development-only: Single-pass trace for admin gating
      if (import.meta.env.DEV) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('[Admin Check] Starting admin verification');
        console.log(`[Admin Check] Principal: ${principalString}`);
        console.log(`[Admin Check] Token detected in session: ${tokenDetected}`);
        console.log(`[Admin Check] Access control initialized: ${accessControlInitialized}`);
      }
      
      // Check if this principal was verified in the current page load
      const verifiedInLoad = adminStatusCache.isVerifiedInCurrentLoad(principalString);
      
      if (!verifiedInLoad) {
        // First verification in this page load - bypass cache and do fresh check
        if (import.meta.env.DEV) {
          console.log(`[Admin Check] First verification for this page load, bypassing cache`);
        }
      } else {
        // Already verified in this page load - check cache
        const cached = adminStatusCache.get(principalString);
        if (cached !== null) {
          if (import.meta.env.DEV) {
            console.log(`[Admin Check] Using cached result from this page load: ${cached}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          }
          return cached;
        }
      }
      
      const queryStartTime = Date.now();
      const result = await actor.isCallerAdmin();
      const queryEndTime = Date.now();
      
      if (import.meta.env.DEV) {
        console.log(`[Admin Check] Backend query completed in: ${queryEndTime - queryStartTime}ms`);
        console.log(`[Admin Check] Total time: ${queryEndTime - startTime}ms`);
        console.log(`[Admin Check] Result: ${result}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
      
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
      if (import.meta.env.DEV) {
        console.log(`[Admin Check] Manual retry requested for: ${principalString}`);
      }
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
    tokenDetected,
    accessControlInitialized,
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
      if (import.meta.env.DEV) {
        console.log('[Admin Credits] Initial 500 credits assigned successfully');
      }
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
    enabled: !!actor && !actorFetching && !!destination && amount > BigInt(0),
  });
}

export function useSendBTC() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<bigint | null, Error, { destination: string; amount: bigint }>({
    mutationFn: async ({ destination, amount }: { destination: string; amount: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      try {
        const requestId = await actor.sendBTC(destination, amount);
        return requestId;
      } catch (error: any) {
        // Backend traps when broadcast fails, so we won't get a requestId
        // Normalize the error and re-throw with clear message
        const normalizedMessage = normalizeSendBTCError(error);
        const enhancedError = new Error(normalizedMessage);
        throw enhancedError;
      }
    },
    onSuccess: (requestId) => {
      // Always invalidate balance and history to show updated state
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      
      // If we got a requestId, show success and invalidate transfer request
      if (requestId !== null) {
        toast.success(`Transfer request created! Request ID: ${requestId.toString()}`);
        queryClient.invalidateQueries({ queryKey: ['transferRequest', requestId.toString()] });
      }
    },
    onError: (error: Error) => {
      // Error message is already normalized in mutationFn
      toast.error(error.message);
      
      // Invalidate balance to show restored credits
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
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

export function useGetTransferRequest(requestId: bigint | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<SendBTCRequest | null>({
    queryKey: ['transferRequest', requestId?.toString()],
    queryFn: async () => {
      if (!actor || requestId === null) return null;
      return actor.getTransferRequest(requestId);
    },
    enabled: !!actor && !actorFetching && requestId !== null,
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['transferRequest', variables.requestId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      toast.success('Transfer verified successfully');
    },
    onError: (error: Error) => {
      toast.error(`Verification failed: ${error.message}`);
    },
  });
}

export function useConfirmOnChain() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.confirmOnChain(requestId);
    },
    onSuccess: (confirmed, requestId) => {
      queryClient.invalidateQueries({ queryKey: ['transferRequest', requestId.toString()] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      if (confirmed) {
        toast.success('Transfer confirmed as completed on-chain');
      } else {
        toast.info('Transfer status checked');
      }
    },
    onError: (error: Error) => {
      toast.error(`Failed to confirm on-chain status: ${error.message}`);
    },
  });
}

export function useAdjustCredits() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, amount, reason }: { user: Principal; amount: bigint; reason: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.adjustCredits(user, amount, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      toast.success('Credits adjusted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Adjustment failed: ${error.message}`);
    },
  });
}
