import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { Transaction, UserProfile, SendBTCRequest, WithdrawalRequest, ConfirmationAnalysisResult, ReserveStatus, ReserveMultisigConfig, ReserveDepositValidationRequest, ReserveDepositValidationResult, ExtendedReserveAdjustment } from '../backend';
import { toast } from 'sonner';
import { Principal } from '@dfinity/principal';

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

export function useGetCallerBalance() {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['balance'],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getCallerBalance();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCallerBitcoinWallet() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['callerBitcoinWallet'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerBitcoinWallet();
    },
    enabled: !!actor && !isFetching,
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
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Credits purchased successfully!');
    },
  });
}

export function useGetEstimatedNetworkFee(destination: string, amount: bigint) {
  const { actor, isFetching } = useActor();

  return useQuery<bigint>({
    queryKey: ['networkFee', destination, amount.toString()],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getEstimatedNetworkFee(destination, amount);
    },
    enabled: !!actor && !isFetching && !!destination && amount > BigInt(0),
  });
}

export function useSendBTC() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ destination, amount }: { destination: string; amount: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      const requestId = await actor.sendBTC(destination, amount);
      const transferRequest = await actor.getTransferRequest(requestId);
      return { requestId, transferRequest };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
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

export function useGetTransferRequest(requestId: bigint | null, enableLiveRefresh: boolean = false) {
  const { actor, isFetching } = useActor();

  return useQuery<SendBTCRequest | null>({
    queryKey: ['transferRequest', requestId?.toString()],
    queryFn: async () => {
      if (!actor || requestId === null) return null;
      
      // Use refreshTransferRequestStatus when live refresh is enabled
      if (enableLiveRefresh) {
        return actor.refreshTransferRequestStatus(requestId);
      }
      
      return actor.getTransferRequest(requestId);
    },
    enabled: !!actor && !isFetching && requestId !== null,
    refetchInterval: (query) => {
      // Only poll when live refresh is enabled and status is IN_PROGRESS
      if (!enableLiveRefresh) return false;
      
      const data = query.state.data;
      if (data && data.status === 'IN_PROGRESS') {
        return 3000; // Poll every 3 seconds
      }
      // Stop polling for COMPLETED, FAILED, or EVICTED
      return false;
    },
  });
}

export function useTransferRequestStatus(requestId: bigint | null, enabled: boolean) {
  const { actor, isFetching } = useActor();

  return useQuery<SendBTCRequest | null>({
    queryKey: ['transferRequestStatus', requestId?.toString()],
    queryFn: async () => {
      if (!actor || requestId === null) return null;
      return actor.refreshTransferRequestStatus(requestId);
    },
    enabled: !!actor && !isFetching && requestId !== null && enabled,
    refetchInterval: (query) => {
      if (!enabled) return false;
      
      const data = query.state.data;
      // Poll while status is PENDING or IN_PROGRESS
      if (data && (data.status === 'PENDING' || data.status === 'IN_PROGRESS')) {
        return 3000; // Poll every 3 seconds
      }
      // Stop polling for COMPLETED, FAILED, or EVICTED
      return false;
    },
  });
}

export function useRefreshTransferStatus() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.refreshTransferRequestStatus(requestId);
    },
    onSuccess: (data, requestId) => {
      // Update the cached transfer request with fresh data
      queryClient.setQueryData(['transferRequest', requestId.toString()], data);
      queryClient.invalidateQueries({ queryKey: ['confirmationAnalysis', requestId.toString()] });
      toast.success('Transfer status refreshed');
    },
    onError: (error: any) => {
      toast.error(`Failed to refresh status: ${error.message || 'Unknown error'}`);
    },
  });
}

export function useAnalyzeSendBTCRequestConfirmation(requestId: bigint | null, forceFreshCheck: boolean = false) {
  const { actor, isFetching } = useActor();

  return useQuery<ConfirmationAnalysisResult | null>({
    queryKey: ['confirmationAnalysis', requestId?.toString(), forceFreshCheck],
    queryFn: async () => {
      if (!actor || requestId === null) return null;
      return actor.analyzeSendBTCRequestConfirmation(requestId, forceFreshCheck);
    },
    enabled: !!actor && !isFetching && requestId !== null,
    staleTime: forceFreshCheck ? 0 : 30000, // No cache when forcing fresh check
  });
}

export function useGetReserveStatus(options?: { refetchInterval?: number }) {
  const { actor, isFetching } = useActor();

  return useQuery<ReserveStatus>({
    queryKey: ['reserveStatus'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getReserveStatus();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: options?.refetchInterval,
  });
}

export function useManageReserve() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ action, txid }: { action: any; txid?: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.manageReserve(action, txid || null);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reserveStatus'] });
      queryClient.invalidateQueries({ queryKey: ['reserveAdjustments'] });
      
      const txidMessage = variables.txid ? ` Txid recorded: ${variables.txid}` : '';
      toast.success(`Reserve updated successfully!${txidMessage}`);
    },
  });
}

export function useGetAllReserveAdjustments() {
  const { actor, isFetching } = useActor();

  return useQuery<Array<[bigint, ExtendedReserveAdjustment]>>({
    queryKey: ['reserveAdjustments'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllReserveAdjustments();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCurrentBtcPriceUsd() {
  const { actor, isFetching } = useActor();

  return useQuery<number | null>({
    queryKey: ['btcPriceUsd'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCurrentBtcPriceUsd();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60000,
    refetchInterval: 300000,
  });
}

export function useRefreshBtcPrice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.refreshBtcPrice();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['btcPriceUsd'] });
      toast.success('BTC price refreshed!');
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

export function useSubmitWithdrawalRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amount, method, account }: { amount: bigint; method: string; account: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.submitWithdrawalRequest(amount, method, account);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['userWithdrawalRequests'] });
      queryClient.invalidateQueries({ queryKey: ['allWithdrawalRequests'] });
      toast.success('Withdrawal request submitted successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to submit withdrawal request: ${error.message || 'Unknown error'}`);
    },
  });
}

export function useGetWithdrawalRequest(requestId: bigint | null) {
  const { actor, isFetching } = useActor();

  return useQuery<WithdrawalRequest | null>({
    queryKey: ['withdrawalRequest', requestId?.toString()],
    queryFn: async () => {
      if (!actor || requestId === null) return null;
      return actor.getWithdrawalRequest(requestId);
    },
    enabled: !!actor && !isFetching && requestId !== null,
  });
}

export function useGetUserWithdrawalRequests() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<WithdrawalRequest[]>({
    queryKey: ['userWithdrawalRequests'],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getUserWithdrawalRequests(identity.getPrincipal());
    },
    enabled: !!actor && !isFetching && !!identity,
    refetchInterval: 10000, // Poll every 10 seconds to detect status changes
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

export function useMarkWithdrawalPaid() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.markWithdrawalPaid(requestId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequest'] });
      queryClient.invalidateQueries({ queryKey: ['userWithdrawalRequests'] });
      queryClient.invalidateQueries({ queryKey: ['allWithdrawalRequests'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Withdrawal marked as paid!');
    },
    onError: (error: any) => {
      toast.error(`Failed to mark withdrawal as paid: ${error.message || 'Unknown error'}`);
    },
  });
}

export function useRejectWithdrawalRequest() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: bigint; reason: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.rejectWithdrawalRequest(requestId, reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawalRequest'] });
      queryClient.invalidateQueries({ queryKey: ['userWithdrawalRequests'] });
      queryClient.invalidateQueries({ queryKey: ['allWithdrawalRequests'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      toast.success('Withdrawal request rejected and credits restored!');
    },
    onError: (error: any) => {
      toast.error(`Failed to reject withdrawal request: ${error.message || 'Unknown error'}`);
    },
  });
}

export function useGetReserveMultisigConfig() {
  const { actor, isFetching } = useActor();

  return useQuery<ReserveMultisigConfig | null>({
    queryKey: ['reserveMultisigConfig'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getReserveMultisigConfig();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateReserveMultisigConfig() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      threshold, 
      pubkeys, 
      address, 
      redeemScript 
    }: { 
      threshold: bigint; 
      pubkeys: Uint8Array[]; 
      address: string | null; 
      redeemScript: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateReserveMultisigConfig(threshold, pubkeys, address, redeemScript);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reserveMultisigConfig'] });
      toast.success('Reserve multisig configuration updated successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to update multisig config: ${error.message || 'Unknown error'}`);
    },
  });
}

export function useValidateReserveDeposit() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation<ReserveDepositValidationResult, Error, ReserveDepositValidationRequest>({
    mutationFn: async (request: ReserveDepositValidationRequest) => {
      if (!actor) throw new Error('Actor not available');
      return actor.validateReserveDeposit(request);
    },
    onSuccess: (result) => {
      if (result.success && result.confirmedDeposit) {
        queryClient.invalidateQueries({ queryKey: ['reserveStatus'] });
        queryClient.invalidateQueries({ queryKey: ['reserveAdjustments'] });
        toast.success('Reserve deposit validated and credited successfully!');
      }
    },
    onError: (error: any) => {
      // Error handling is done in the component
    },
  });
}
