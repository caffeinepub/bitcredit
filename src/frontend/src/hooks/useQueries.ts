import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { Transaction, UserProfile } from '../backend';
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
      // Auto-refresh every 30 seconds if there are pending mainnet transactions
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
      // Poll every 10 seconds if transaction is pending
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
