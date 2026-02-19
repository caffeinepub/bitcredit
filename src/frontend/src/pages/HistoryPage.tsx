import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetTransactionHistory } from '../hooks/useQueries';
import TransferHistoryTable from '../components/transfers/TransferHistoryTable';
import type { Transaction } from '../backend';
import type { MainnetTransaction } from '../types/mainnet';

export default function HistoryPage() {
  const { data: transactions = [], isLoading } = useGetTransactionHistory();

  const [initialRequestId, setInitialRequestId] = React.useState<bigint | null>(null);

  useEffect(() => {
    const autoOpenRequestId = sessionStorage.getItem('autoOpenTransferRequest');
    if (autoOpenRequestId) {
      setInitialRequestId(BigInt(autoOpenRequestId));
      sessionStorage.removeItem('autoOpenTransferRequest');
    }
  }, []);

  const calculateStats = () => {
    let totalTransactions = transactions.length;
    let creditsReceived = BigInt(0);
    let creditsSpent = BigInt(0);
    let pendingMainnetTransactions = 0;
    let completedMainnetTransactions = 0;

    transactions.forEach((tx: Transaction) => {
      if (tx.transactionType === 'creditPurchase' || tx.transactionType === 'withdrawalPaid') {
        creditsReceived += tx.amount;
      } else if (tx.transactionType === 'debit' || tx.transactionType === 'withdrawalRequested') {
        creditsSpent += tx.amount;
      }

      // Track mainnet transaction status
      const mtx = tx as MainnetTransaction;
      if (mtx.broadcastStatus === 'confirmed') {
        completedMainnetTransactions++;
      } else if (mtx.broadcastStatus === 'pending' || mtx.broadcastStatus === 'broadcast' || mtx.signingStatus === 'pending') {
        pendingMainnetTransactions++;
      }
    });

    return { 
      totalTransactions, 
      creditsReceived, 
      creditsSpent,
      pendingMainnetTransactions,
      completedMainnetTransactions
    };
  };

  const stats = calculateStats();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Transaction History</h1>
        <p className="text-muted-foreground">View all your credit transactions and mainnet transfers</p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Transactions</CardDescription>
            <CardTitle className="text-3xl">{stats.totalTransactions}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Credits Received</CardDescription>
            <CardTitle className="text-3xl text-emerald-600 dark:text-emerald-400">
              {stats.creditsReceived.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Credits Spent</CardDescription>
            <CardTitle className="text-3xl text-amber-600 dark:text-amber-400">
              {stats.creditsSpent.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Mainnet Transaction Status Summary */}
      {(stats.pendingMainnetTransactions > 0 || stats.completedMainnetTransactions > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending Mainnet Transactions</CardDescription>
              <CardTitle className="text-3xl text-blue-600 dark:text-blue-400">
                {stats.pendingMainnetTransactions}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Completed Mainnet Transactions</CardDescription>
              <CardTitle className="text-3xl text-emerald-600 dark:text-emerald-400">
                {stats.completedMainnetTransactions}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Transaction Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>Complete ledger of your account activity including mainnet transfers</CardDescription>
        </CardHeader>
        <CardContent>
          <TransferHistoryTable initialRequestId={initialRequestId} />
        </CardContent>
      </Card>
    </div>
  );
}
