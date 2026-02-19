import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { Principal } from '@dfinity/principal';
import type { Transaction, UserProfile, WithdrawalRequest, PeerTransferRequest, BitcoinPurchaseRecord, BitcoinPurchaseRecordInput, BitcoinAmount } from '../backend';
import type { MainnetTransaction } from '../types/mainnet';
import { toast } from 'sonner';

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
      
      // Validate profile has required fields
      if (!profile.name || profile.name.trim() === '') {
        throw new Error('Name is required');
      }

      // Call backend with the complete profile object
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      // Invalidate the profile query to trigger a refetch
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile created successfully!');
    },
    onError: (error: Error) => {
      console.error('Failed to save profile:', error);
      toast.error(error.message || 'Failed to save profile');
    },
  });
}

export function useGetTransactionHistory() {
  const { actor, isFetching } = useActor();

  return useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTransactionHistory();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: (query) => {
      const transactions = query.state.data || [];
      const hasPendingMainnet = transactions.some((tx: Transaction) => {
        const mtx = tx as MainnetTransaction;
        return !!(
          mtx.broadcastStatus === 'pending' || 
          mtx.broadcastStatus === 'broadcast' || 
          mtx.signingStatus === 'pending'
        );
      });
      return hasPendingMainnet ? 30000 : false;
    },
  });
}

export function useTransactionStatus(transactionId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Transaction | null>({
    queryKey: ['transactionStatus', transactionId],
    queryFn: async () => {
      if (!actor || !transactionId) return null;
      const transactions = await actor.getTransactionHistory();
      return transactions.find((tx: Transaction) => tx.id === transactionId) || null;
    },
    enabled: !!actor && !isFetching && !!transactionId,
    refetchInterval: (query) => {
      const tx = query.state.data;
      if (tx) {
        const mtx = tx as MainnetTransaction;
        if (mtx.broadcastStatus === 'pending' || mtx.broadcastStatus === 'broadcast' || mtx.signingStatus === 'pending') {
          return 10000;
        }
      }
      return false;
    },
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const principalId = identity?.getPrincipal().toString();

  const query = useQuery<boolean>({
    queryKey: ['isAdmin', principalId],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching && !!principalId,
    retry: false,
  });

  const retryAdminCheck = async () => {
    await queryClient.invalidateQueries({ queryKey: ['isAdmin', principalId] });
    await queryClient.refetchQueries({ queryKey: ['isAdmin', principalId] });
  };

  return {
    ...query,
    retryAdminCheck,
  };
}

export function useGetCallerBalance() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['currentBalance'],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getCallerBalance();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRequestWithdrawal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, method, account }: { amount: bigint; method: string; account: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.requestWithdrawal(amount, method, account);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentBalance'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequests'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Withdrawal request submitted successfully');
    },
    onError: (error: Error) => {
      console.error('Withdrawal request failed:', error);
      toast.error(error.message || 'Failed to submit withdrawal request');
    },
  });
}

export function useGetCallerWithdrawalRequests() {
  const { actor, isFetching } = useActor();

  return useQuery<WithdrawalRequest[]>({
    queryKey: ['withdrawalRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCallerWithdrawalRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllWithdrawalRequests() {
  const { actor, isFetching } = useActor();

  return useQuery<WithdrawalRequest[]>({
    queryKey: ['allWithdrawalRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllWithdrawalRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMarkWithdrawalAsPaid() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.markWithdrawalAsPaid(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allWithdrawalRequests'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequests'] });
      toast.success('Withdrawal marked as paid');
    },
    onError: (error: Error) => {
      console.error('Failed to mark withdrawal as paid:', error);
      toast.error(error.message || 'Failed to mark withdrawal as paid');
    },
  });
}

export function useRejectWithdrawal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: bigint; reason: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.rejectWithdrawal(requestId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allWithdrawalRequests'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequests'] });
      toast.success('Withdrawal rejected');
    },
    onError: (error: Error) => {
      console.error('Failed to reject withdrawal:', error);
      toast.error(error.message || 'Failed to reject withdrawal');
    },
  });
}

export function useSendCreditsToPeer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipient, amount }: { recipient: Principal; amount: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendCreditsToPeer(recipient, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentBalance'] });
      queryClient.invalidateQueries({ queryKey: ['peerTransfers'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Credits sent successfully');
    },
    onError: (error: Error) => {
      console.error('Failed to send credits:', error);
      toast.error(error.message || 'Failed to send credits');
    },
  });
}

export function useGetCallerPeerTransfers() {
  const { actor, isFetching } = useActor();

  return useQuery<PeerTransferRequest[]>({
    queryKey: ['peerTransfers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCallerPeerTransfers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllPeerTransfers() {
  const { actor, isFetching } = useActor();

  return useQuery<PeerTransferRequest[]>({
    queryKey: ['allPeerTransfers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCallerPeerTransfers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserProfile() {
  const { actor } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor,
  });
}

export function useGetUserProfileByPrincipal(principal: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useGetAllUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<[Principal, UserProfile][]>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecordBitcoinPurchase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BitcoinPurchaseRecordInput) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordBitcoinPurchase(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentBalance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bitcoinPurchases'] });
      toast.success('Bitcoin purchase recorded and account funded instantly!');
    },
    onError: (error: Error) => {
      console.error('Failed to record Bitcoin purchase:', error);
      toast.error(error.message || 'Failed to record Bitcoin purchase');
    },
  });
}

export function useGetBitcoinPurchases() {
  const { actor, isFetching } = useActor();

  return useQuery<[string, BitcoinPurchaseRecord][]>({
    queryKey: ['bitcoinPurchases'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBitcoinPurchases();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitVerificationRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ transactionId, amount }: { transactionId: string; amount: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      if (!identity) throw new Error('Not authenticated');
      const principal = identity.getPrincipal();
      return actor.creditBtcWithVerification(principal, transactionId, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentBalance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Your account has been funded instantly!', {
        description: 'The Bitcoin credits are now available in your balance.',
      });
    },
    onError: (error: Error) => {
      console.error('Verification request failed:', error);
      toast.error(error.message || 'Failed to submit verification request');
    },
  });
}

export function useCreditBtc() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetUser, transactionId, amount }: { targetUser: Principal; transactionId: string; amount: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.creditBtcWithVerification(targetUser, transactionId, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success('BTC credits sent successfully');
    },
    onError: (error: Error) => {
      console.error('Failed to credit BTC:', error);
      toast.error(error.message || 'Failed to credit BTC');
    },
  });
}
