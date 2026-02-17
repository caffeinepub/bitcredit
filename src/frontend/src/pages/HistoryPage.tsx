import { useGetTransactionHistory } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import TransferHistoryTable from '../components/transfers/TransferHistoryTable';
import { History, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function HistoryPage() {
  const { data: transactions, isLoading } = useGetTransactionHistory();

  const credits = transactions?.filter(
    (tx) => tx.transactionType === 'creditPurchase' || tx.transactionType === 'adjustment'
  ) || [];
  const debits = transactions?.filter((tx) => tx.transactionType === 'debit') || [];

  const totalCreditsAdded = credits.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const totalDebits = debits.reduce((sum, tx) => sum + Number(tx.amount), 0);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Transaction History</h1>
        <p className="text-muted-foreground">
          View all your credit purchases, transfers, and adjustments
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="financial-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <History className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="stat-value">{transactions?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">All time activity</p>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credits Added</CardTitle>
            <TrendingUp className="h-5 w-5 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="stat-value text-chart-1">+{totalCreditsAdded} BTC</div>
            <p className="text-xs text-muted-foreground mt-1">Purchases & adjustments</p>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">Credits Spent</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="text-xs">
                      Includes transfer amounts plus network fees deducted from your credits.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <TrendingDown className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="stat-value text-muted-foreground">-{totalDebits} BTC</div>
            <p className="text-xs text-muted-foreground mt-1">Transfer requests (incl. fees)</p>
          </CardContent>
        </Card>
      </div>

      <Card className="financial-card">
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Complete ledger history including admin transfers and adjustments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <TransferHistoryTable transactions={transactions || []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
