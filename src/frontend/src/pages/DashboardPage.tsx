import { useGetCallerBalance, useGetTransactionHistory, useGetCallerBitcoinWallet } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, TrendingUp, History, ArrowRight, Wallet, Copy, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { data: balance, isLoading: balanceLoading } = useGetCallerBalance();
  const { data: transactions, isLoading: historyLoading } = useGetTransactionHistory();
  const { data: wallet, isLoading: walletLoading, isError: walletError, isFetched: walletFetched } = useGetCallerBitcoinWallet();
  const [copied, setCopied] = useState(false);

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

  const handleCopyWallet = async () => {
    if (wallet?.address) {
      try {
        await navigator.clipboard.writeText(wallet.address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy wallet address:', err);
      }
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

      <Alert className="border-primary/20 bg-primary/5">
        <Info className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm space-y-1">
          <p className="font-medium">1 credit = 1 BTC</p>
          <p>
            All credits are backed 1:1 by Bitcoin held in reserve. The USD market value of your credits fluctuates with the Bitcoin market price.
          </p>
        </AlertDescription>
      </Alert>

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

      <Card className="financial-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <CardTitle>Your Anonymous Wallet</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This is your app-managed custodial wallet identity tied to your account. The app manages this wallet on your behalf — you do not control private keys.
            </AlertDescription>
          </Alert>

          {walletLoading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          )}

          {walletError && walletFetched && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load wallet identity. Please try refreshing the page.
              </AlertDescription>
            </Alert>
          )}

          {wallet && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Wallet Identity</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-muted rounded-lg border border-border">
                  <code className="text-sm font-mono break-all">{wallet.address}</code>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyWallet}
                  className="shrink-0"
                  title="Copy wallet address"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {copied && (
                <p className="text-xs text-green-600 dark:text-green-400">Copied to clipboard!</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

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
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  1
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Purchase Credits</p>
                  <p className="text-sm text-muted-foreground">
                    Buy BTC-denominated credits to fund your wallet
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  2
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Send Bitcoin</p>
                  <p className="text-sm text-muted-foreground">
                    Transfer BTC to any mainnet address using your credits
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  3
                </div>
                <div className="space-y-1">
                  <p className="font-medium">Track Transactions</p>
                  <p className="text-sm text-muted-foreground">
                    Monitor all your activity in the transaction history
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <img
                src="/assets/generated/btc-ledger-hero.dim_1600x900.png"
                alt="Bitcoin Ledger"
                className="w-full rounded-lg border border-border"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
