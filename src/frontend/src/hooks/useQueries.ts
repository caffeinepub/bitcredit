import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { Principal } from '@dfinity/principal';
import type { Transaction, UserProfile, WithdrawalRequest, PeerTransferRequest, BitcoinPurchaseRecord, BitcoinPurchaseRecordInput, VerificationRequest, VerificationRequestId } from '../backend';
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
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
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
    queryKey: ['callerBalance'],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getCallerBalance();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserProfile(principal: Principal | null) {
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

export function useSendCreditsToPeer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ recipient, amount }: { recipient: Principal; amount: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendCreditsToPeer(recipient, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerBalance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['callerPeerTransfers'] });
    },
  });
}

export function useGetCallerPeerTransfers() {
  const { actor, isFetching } = useActor();

  return useQuery<PeerTransferRequest[]>({
    queryKey: ['callerPeerTransfers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCallerPeerTransfers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRequestWithdrawal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, method, account }: { amount: bigint; method: string; account: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.requestWithdrawal(amount, method, account);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerBalance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['callerWithdrawalRequests'] });
    },
  });
}

export function useGetCallerWithdrawalRequests() {
  const { actor, isFetching } = useActor();

  return useQuery<WithdrawalRequest[]>({
    queryKey: ['callerWithdrawalRequests'],
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
      queryClient.invalidateQueries({ queryKey: ['callerWithdrawalRequests'] });
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
      queryClient.invalidateQueries({ queryKey: ['callerWithdrawalRequests'] });
    },
  });
}

export function useGetBitcoinPurchases() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[string, BitcoinPurchaseRecord]>>({
    queryKey: ['bitcoinPurchases'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBitcoinPurchases();
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
      queryClient.invalidateQueries({ queryKey: ['bitcoinPurchases'] });
      toast.success('Bitcoin purchase verified successfully');
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to record Bitcoin purchase';
      if (errorMessage.includes('already exists')) {
        toast.error('This transaction ID has already been verified');
      } else if (errorMessage.includes('Unauthorized')) {
        toast.error('You do not have permission to verify Bitcoin purchases');
      } else {
        toast.error(errorMessage);
      }
    },
  });
}

export function useSubmitVerification() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({ transactionId, amount }: { transactionId: string; amount: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitVerificationRequest(transactionId, amount);
    },
    onSuccess: () => {
      const principalId = identity?.getPrincipal().toString();
      queryClient.invalidateQueries({ queryKey: ['verificationRequests', principalId] });
      toast.success('Verification request submitted successfully');
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to submit verification request';
      toast.error(errorMessage);
    },
  });
}

export function useUserVerificationRequests() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  const principalId = identity?.getPrincipal();

  return useQuery<VerificationRequest[]>({
    queryKey: ['verificationRequests', principalId?.toString()],
    queryFn: async () => {
      if (!actor || !principalId) return [];
      return actor.getUserVerificationRequests(principalId);
    },
    enabled: !!actor && !isFetching && !!principalId,
  });
}

export function useAdminVerificationRequests() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[VerificationRequestId, VerificationRequest]>>({
    queryKey: ['allVerificationRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVerificationRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useApproveVerification() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, comment }: { requestId: VerificationRequestId; comment?: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveVerificationRequest(requestId, comment || null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allVerificationRequests'] });
      toast.success('Verification request approved');
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to approve verification request';
      toast.error(errorMessage);
    },
  });
}

export function useRejectVerification() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, comment }: { requestId: VerificationRequestId; comment: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.rejectVerificationRequest(requestId, comment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allVerificationRequests'] });
      toast.success('Verification request rejected');
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Failed to reject verification request';
      toast.error(errorMessage);
    },
  });
}
