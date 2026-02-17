import { useGetCallerBalance, useGetTransactionHistory } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, TrendingUp, History, ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { data: balance, isLoading: balanceLoading } = useGetCallerBalance();
  const { data: transactions, isLoading: historyLoading } = useGetTransactionHistory();

  const recentTransactions = transactions?.slice(0, 5) || [];

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'creditPurchase':
        return 'Credit Purchase';
      case 'debit':
        return 'Bitcoin Mainnet Transfer';
      case 'adjustment':
        return 'Adjustment';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your Bitcoin credits and track your transactions
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="financial-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Credits</CardTitle>
            <Coins className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <div className="stat-value text-primary">{balance?.toString() || '0'} BTC</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">1 credit = 1 BTC</p>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <TrendingUp className="h-5 w-5 text-chart-2" />
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            ) : (
              <div className="stat-value">{transactions?.length || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">All time activity</p>
          </CardContent>
        </Card>

        <Card className="financial-card md:col-span-2 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/buy-credits">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Coins className="h-4 w-4 mr-2" />
                Buy Credits
              </Button>
            </Link>
            <Link to="/send-btc">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <ArrowRight className="h-4 w-4 mr-2" />
                Send BTC
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="financial-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <Link to="/history">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No transactions yet</p>
                <p className="text-sm mt-1">Start by purchasing credits</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{getTransactionTypeLabel(tx.transactionType)}</p>
                      <p className="text-xs text-muted-foreground">{formatTimestamp(tx.timestamp)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${
                        tx.transactionType === 'creditPurchase' || tx.transactionType === 'adjustment'
                          ? 'text-chart-1'
                          : 'text-muted-foreground'
                      }`}>
                        {tx.transactionType === 'creditPurchase' || tx.transactionType === 'adjustment' ? '+' : '-'}
                        {tx.amount.toString()} BTC
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <img
                src="/assets/generated/btc-ledger-hero.dim_1600x900.png"
                alt="Bitcoin Ledger"
                className="w-full rounded-lg mb-4"
              />
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                  1
                </div>
                <div>
                  <p className="font-medium">Purchase Credits</p>
                  <p className="text-muted-foreground text-xs">Submit a Bitcoin mainnet transaction ID to verify and receive credits</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                  2
                </div>
                <div>
                  <p className="font-medium">Send BTC</p>
                  <p className="text-muted-foreground text-xs">Create transfer requests to any Bitcoin mainnet wallet — posted on-chain</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                  3
                </div>
                <div>
                  <p className="font-medium">Verify Transfers</p>
                  <p className="text-muted-foreground text-xs">Attach blockchain transaction IDs to verify completed transfers</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
