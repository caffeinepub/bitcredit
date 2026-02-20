import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { Principal } from '@dfinity/principal';
import type { Transaction, UserProfile, WithdrawalRequest, PeerTransferRequest, BitcoinPurchaseRecord, BitcoinPurchaseRecordInput, BitcoinAmount, BitcoinAddress, UserAddressRecord, VerificationRequest } from '../backend';
import { Variant_P2WPKH, Variant_mainnet_testnet } from '../backend';
import type { MainnetTransaction, SendBTCResult } from '../types/mainnet';
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

export function useTransactionConfirmations(txid: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['transactionConfirmations', txid],
    queryFn: async () => {
      if (!actor || !txid) return 0;
      
      // This would call a backend method to get confirmation count
      // For now, we'll check the transaction history for confirmation data
      const transactions = await actor.getTransactionHistory();
      const tx = transactions.find((t: Transaction) => {
        const mtx = t as MainnetTransaction;
        return mtx.txHash === txid;
      });
      
      if (tx) {
        const mtx = tx as MainnetTransaction;
        return mtx.confirmationCount || 0;
      }
      
      return 0;
    },
    enabled: !!actor && !isFetching && !!txid,
    refetchInterval: (query) => {
      const confirmations = query.state.data || 0;
      // Poll every 60 seconds if less than 6 confirmations
      return confirmations < 6 ? 60000 : false;
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

// Bitcoin address management hooks
export function useGetCallerPrimaryAddress() {
  const { actor, isFetching } = useActor();

  return useQuery<BitcoinAddress | null>({
    queryKey: ['callerPrimaryAddress'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerPrimaryAddress();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCallerAddressHistory() {
  const { actor, isFetching } = useActor();

  return useQuery<BitcoinAddress[]>({
    queryKey: ['callerAddressHistory'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCallerAddressHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddBitcoinAddress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ address, publicKey, network }: { address: string; publicKey: Uint8Array; network: Variant_mainnet_testnet }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addBitcoinAddress(address, publicKey, network);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerPrimaryAddress'] });
      queryClient.invalidateQueries({ queryKey: ['callerAddressHistory'] });
      toast.success('Bitcoin address added successfully!');
    },
    onError: (error: Error) => {
      console.error('Failed to add Bitcoin address:', error);
      toast.error(error.message || 'Failed to add Bitcoin address');
    },
  });
}

export function useRotatePrimaryAddress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newPrimaryAddress: BitcoinAddress) => {
      if (!actor) throw new Error('Actor not available');
      return actor.rotatePrimaryAddress(newPrimaryAddress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerPrimaryAddress'] });
      queryClient.invalidateQueries({ queryKey: ['callerAddressHistory'] });
      toast.success('Primary address rotated successfully!');
    },
    onError: (error: Error) => {
      console.error('Failed to rotate primary address:', error);
      toast.error(error.message || 'Failed to rotate primary address');
    },
  });
}

export function useRemoveBitcoinAddress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (addressToRemove: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeBitcoinAddress(addressToRemove);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerPrimaryAddress'] });
      queryClient.invalidateQueries({ queryKey: ['callerAddressHistory'] });
      toast.success('Bitcoin address removed successfully!');
    },
    onError: (error: Error) => {
      console.error('Failed to remove Bitcoin address:', error);
      toast.error(error.message || 'Failed to remove Bitcoin address');
    },
  });
}

export function useGetAllUserAddresses() {
  const { actor, isFetching } = useActor();
  const { data: isAdmin } = useIsCallerAdmin();

  return useQuery<Array<[Principal, UserAddressRecord]>>({
    queryKey: ['allUserAddresses'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUserAddresses();
    },
    enabled: !!actor && !isFetching && !!isAdmin,
  });
}

export function useCreateBitcoinAddress() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ addressType, network }: { addressType: Variant_P2WPKH; network: Variant_mainnet_testnet }) => {
      if (!actor) throw new Error('Actor not available');
      
      // Generate a mock address for demonstration
      const mockAddress = `bc1q${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      const mockPublicKey = new Uint8Array(33);
      
      return actor.addBitcoinAddress(mockAddress, mockPublicKey, network);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['callerPrimaryAddress'] });
      queryClient.invalidateQueries({ queryKey: ['callerAddressHistory'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Bitcoin address generated successfully!');
    },
    onError: (error: Error) => {
      console.error('Failed to generate Bitcoin address:', error);
      toast.error(error.message || 'Failed to generate Bitcoin address');
    },
  });
}

export function useSendBtc() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<SendBTCResult, Error, { destination: string; amount: bigint; network: 'mainnet' | 'testnet' }>({
    mutationFn: async ({ destination, amount, network }) => {
      if (!actor) throw new Error('Actor not available');
      
      // Check if sendBTC method exists
      if (typeof (actor as any).sendBTC !== 'function') {
        throw new Error('sendBTC method is not implemented in the backend. This feature requires backend support for transaction signing, broadcasting via HTTP outcalls, and confirmation tracking.');
      }

      // Call the backend sendBTC method
      const result = await (actor as any).sendBTC(destination, amount, network);
      
      return {
        success: result.success || false,
        txid: result.txid || null,
        requestId: result.requestId || null,
        recordsUpdated: result.recordsUpdated || false,
        diagnosticData: result.diagnosticData || null,
        broadcastAttempts: result.broadcastAttempts || [],
      };
    },
    onSuccess: (result) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['currentBalance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      if (result.success) {
        toast.success('Bitcoin transaction broadcast successfully!');
      } else {
        toast.error('Transaction failed: ' + (result.diagnosticData || 'Unknown error'));
      }
    },
    onError: (error: Error) => {
      console.error('Send BTC failed:', error);
      toast.error(error.message || 'Failed to send Bitcoin');
    },
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
      toast.success('Withdrawal request submitted successfully!');
    },
    onError: (error: Error) => {
      console.error('Failed to request withdrawal:', error);
      toast.error(error.message || 'Failed to request withdrawal');
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
  const { data: isAdmin } = useIsCallerAdmin();

  return useQuery<WithdrawalRequest[]>({
    queryKey: ['allWithdrawalRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllWithdrawalRequests();
    },
    enabled: !!actor && !isFetching && !!isAdmin,
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
      toast.success('Withdrawal marked as paid!');
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
      toast.success('Withdrawal rejected!');
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
      toast.success('Credits sent successfully!');
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
  const { data: isAdmin } = useIsCallerAdmin();

  return useQuery<PeerTransferRequest[]>({
    queryKey: ['allPeerTransfers'],
    queryFn: async () => {
      if (!actor) return [];
      const allTransfers = await actor.getCallerPeerTransfers();
      return allTransfers;
    },
    enabled: !!actor && !isFetching && !!isAdmin,
  });
}

export function useGetUserProfileByPrincipal() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (principalString: string) => {
      if (!actor) throw new Error('Actor not available');
      const principal = Principal.fromText(principalString);
      return actor.getUserProfile(principal);
    },
  });
}

export function useGetAllUsers() {
  const { actor, isFetching } = useActor();
  const { data: isAdmin } = useIsCallerAdmin();

  return useQuery<Array<[Principal, UserProfile]>>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching && !!isAdmin,
  });
}

export function useCreditBtcWithVerification() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetUser, transactionId, amount }: { targetUser: Principal; transactionId: string; amount: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.creditBtcWithVerification(targetUser, transactionId, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitcoinPurchases'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
      toast.success('BTC credited successfully!');
    },
    onError: (error: Error) => {
      console.error('Failed to credit BTC:', error);
      toast.error(error.message || 'Failed to credit BTC');
    },
  });
}

export function useGetBitcoinPurchases() {
  const { actor, isFetching } = useActor();
  const { data: isAdmin } = useIsCallerAdmin();

  return useQuery<Array<[string, BitcoinPurchaseRecord]>>({
    queryKey: ['bitcoinPurchases'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBitcoinPurchases();
    },
    enabled: !!actor && !isFetching && !!isAdmin,
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
      queryClient.invalidateQueries({ queryKey: ['verificationRequests'] });
      toast.success('Bitcoin purchase verification request submitted!');
    },
    onError: (error: Error) => {
      console.error('Failed to record Bitcoin purchase:', error);
      toast.error(error.message || 'Failed to submit verification request');
    },
  });
}

export function useGetCallerVerificationRequests() {
  const { actor, isFetching } = useActor();

  return useQuery<VerificationRequest[]>({
    queryKey: ['verificationRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCallerVerificationRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllVerificationRequests() {
  const { actor, isFetching } = useActor();
  const { data: isAdmin } = useIsCallerAdmin();

  return useQuery<VerificationRequest[]>({
    queryKey: ['allVerificationRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVerificationRequests();
    },
    enabled: !!actor && !isFetching && !!isAdmin,
  });
}

export function useApproveVerificationRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, comment }: { requestId: bigint; comment: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveVerificationRequest(requestId, comment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allVerificationRequests'] });
      queryClient.invalidateQueries({ queryKey: ['bitcoinPurchases'] });
      toast.success('Verification request approved!');
    },
    onError: (error: Error) => {
      console.error('Failed to approve verification request:', error);
      toast.error(error.message || 'Failed to approve verification request');
    },
  });
}

export function useRejectVerificationRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: bigint; reason: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.rejectVerificationRequest(requestId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allVerificationRequests'] });
      toast.success('Verification request rejected!');
    },
    onError: (error: Error) => {
      console.error('Failed to reject verification request:', error);
      toast.error(error.message || 'Failed to reject verification request');
    },
  });
}
