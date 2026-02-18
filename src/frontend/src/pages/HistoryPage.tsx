import { useGetTransactionHistory } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { History, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import TransferHistoryTable from '../components/transfers/TransferHistoryTable';
import { useEffect, useState } from 'react';

export default function HistoryPage() {
  const { data: transactions, isLoading } = useGetTransactionHistory();
  const [initialRequestId, setInitialRequestId] = useState<bigint | null>(null);

  useEffect(() => {
    const storedRequestId = sessionStorage.getItem('openTransferRequestId');
    if (storedRequestId) {
      try {
        setInitialRequestId(BigInt(storedRequestId));
        sessionStorage.removeItem('openTransferRequestId');
      } catch (error) {
        console.error('Invalid stored request ID:', error);
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Transaction History</h1>
          <p className="text-muted-foreground">Loading your transaction history...</p>
        </div>
      </div>
    );
  }

  const totalCredits = transactions?.filter((tx) => tx.transactionType === 'creditPurchase' || tx.transactionType === 'adjustment' || tx.transactionType === 'withdrawalRejected').reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

  const totalDebits = transactions?.filter((tx) => tx.transactionType === 'debit' || tx.transactionType === 'withdrawalRequested').reduce((sum, tx) => sum + Number(tx.amount), 0) || 0;

  const totalTransactions = transactions?.length || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Transaction History</h1>
        <p className="text-muted-foreground">
          View all your transactions including credit purchases, transfers, withdrawals, and adjustments
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="financial-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">+{totalCredits}</div>
            <p className="text-xs text-muted-foreground mt-1">Purchases & adjustments</p>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-{totalDebits}</div>
            <p className="text-xs text-muted-foreground mt-1">Transfers & withdrawals</p>
          </CardContent>
        </Card>
      </div>

      <Card className="financial-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            <CardTitle>All Transactions</CardTitle>
          </div>
          <CardDescription>Complete history of your account activity</CardDescription>
        </CardHeader>
        <CardContent>
          <TransferHistoryTable transactions={transactions || []} initialRequestId={initialRequestId} />
        </CardContent>
      </Card>
    </div>
  );
}
