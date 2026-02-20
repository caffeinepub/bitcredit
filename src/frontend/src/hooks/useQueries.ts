import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type {
  BitcoinAmount,
  UserProfile,
  Transaction,
  PeerTransferRequest,
  WithdrawalRequest,
  VerificationRequest,
  BitcoinPurchaseRecord,
  BitcoinPurchaseRecordInput,
  PeerTransferId,
  WithdrawalRequestId,
  VerificationRequestId,
  BitcoinAddress,
  UserAddressRecord,
  Variant_mainnet_testnet,
} from '../backend';
import { Principal } from '@dfinity/principal';

export function useGetCallerBalance() {
  const { actor, isFetching } = useActor();

  return useQuery<BitcoinAmount>({
    queryKey: ['balance'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getCallerBalance();
    },
    enabled: !!actor && !isFetching,
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
  });
}

export function useTransactionConfirmations(txid: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ['transactionConfirmations', txid],
    queryFn: async () => {
      if (!actor || !txid) return 0;
      // This is a placeholder - the backend doesn't have this method yet
      return 0;
    },
    enabled: !!actor && !isFetching && !!txid,
    refetchInterval: (query) => {
      const confirmations = query.state.data || 0;
      return confirmations < 6 ? 60000 : false;
    },
  });
}

export function useSendBtc() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      destination,
      amount,
      network,
    }: {
      destination: string;
      amount: BitcoinAmount;
      network: 'mainnet' | 'testnet';
    }) => {
      if (!actor) throw new Error('Actor not available');
      
      // Check if sendBTC method exists
      if (typeof (actor as any).sendBTC !== 'function') {
        throw new Error('sendBTC method is not implemented in the backend. This feature requires backend support for transaction signing, broadcasting via HTTP outcalls, and confirmation tracking.');
      }

      const result = await (actor as any).sendBTC(destination, amount, network);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

export function useSendCreditsToPeer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      recipient,
      amount,
    }: {
      recipient: Principal;
      amount: BitcoinAmount;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendCreditsToPeer(recipient, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['peerTransfers'] });
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
      const transfers = await actor.getCallerPeerTransfers();
      return transfers;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRequestWithdrawal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      amount,
      method,
      account,
    }: {
      amount: BitcoinAmount;
      method: string;
      account: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.requestWithdrawal(amount, method, account);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequests'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
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
    mutationFn: async (requestId: WithdrawalRequestId) => {
      if (!actor) throw new Error('Actor not available');
      return actor.markWithdrawalAsPaid(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allWithdrawalRequests'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequests'] });
    },
  });
}

export function useRejectWithdrawal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      reason,
    }: {
      requestId: WithdrawalRequestId;
      reason: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.rejectWithdrawal(requestId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allWithdrawalRequests'] });
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequests'] });
    },
  });
}

export function useGetAllUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[Principal, UserProfile]>>({
    queryKey: ['allUsers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUserProfile() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (user: Principal) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getUserProfile(user);
    },
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

export function useRecordBitcoinPurchase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: BitcoinPurchaseRecordInput) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordBitcoinPurchase(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['bitcoinPurchases'] });
      queryClient.invalidateQueries({ queryKey: ['verificationRequests'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
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

export function useCreditBtcWithVerification() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      targetUser,
      transactionId,
      amount,
    }: {
      targetUser: Principal;
      transactionId: string;
      amount: BitcoinAmount;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.creditBtcWithVerification(targetUser, transactionId, amount);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bitcoinPurchases'] });
      queryClient.invalidateQueries({ queryKey: ['allUsers'] });
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

  return useQuery<VerificationRequest[]>({
    queryKey: ['allVerificationRequests'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVerificationRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useApproveVerificationRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      comment,
    }: {
      requestId: VerificationRequestId;
      comment: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.approveVerificationRequest(requestId, comment);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allVerificationRequests'] });
      queryClient.invalidateQueries({ queryKey: ['verificationRequests'] });
      queryClient.invalidateQueries({ queryKey: ['bitcoinPurchases'] });
    },
  });
}

export function useRejectVerificationRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      requestId,
      reason,
    }: {
      requestId: VerificationRequestId;
      reason: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.rejectVerificationRequest(requestId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allVerificationRequests'] });
      queryClient.invalidateQueries({ queryKey: ['verificationRequests'] });
    },
  });
}

export function useGetCallerPrimaryAddress() {
  const { actor, isFetching } = useActor();

  return useQuery<BitcoinAddress | null>({
    queryKey: ['primaryAddress'],
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
    queryKey: ['addressHistory'],
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
    mutationFn: async ({
      address,
      publicKey,
      network,
    }: {
      address: string;
      publicKey: Uint8Array;
      network: Variant_mainnet_testnet;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addBitcoinAddress(address, publicKey, network);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['primaryAddress'] });
      queryClient.invalidateQueries({ queryKey: ['addressHistory'] });
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
      queryClient.invalidateQueries({ queryKey: ['primaryAddress'] });
      queryClient.invalidateQueries({ queryKey: ['addressHistory'] });
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
      queryClient.invalidateQueries({ queryKey: ['primaryAddress'] });
      queryClient.invalidateQueries({ queryKey: ['addressHistory'] });
    },
  });
}

export function useGetAllUserAddresses() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[Principal, UserAddressRecord]>>({
    queryKey: ['allUserAddresses'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUserAddresses();
    },
    enabled: !!actor && !isFetching,
  });
}
