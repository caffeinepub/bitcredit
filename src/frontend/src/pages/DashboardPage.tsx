import { useGetCallerBalance, useGetTransactionHistory, useGetCallerBitcoinWallet, useGetCurrentBtcPriceUsd, useGetUserWithdrawalRequests } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Coins, Send, History, Wallet, TrendingUp, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import WithdrawalStatusSummaryCard from '../components/withdrawals/WithdrawalStatusSummaryCard';
import { useFundedWithdrawalNotifications } from '../hooks/useFundedWithdrawalNotifications';
import UsdEstimateLine from '../components/balance/UsdEstimateLine';

export default function DashboardPage() {
  const { identity } = useInternetIdentity();
  const { data: balance, isLoading: balanceLoading } = useGetCallerBalance();
  const { data: transactions } = useGetTransactionHistory();
  const { data: wallet } = useGetCallerBitcoinWallet();
  const { data: btcPriceUsd, isLoading: priceLoading } = useGetCurrentBtcPriceUsd();
  const { data: withdrawalRequests } = useGetUserWithdrawalRequests();

  // Enable funded withdrawal notifications
  useFundedWithdrawalNotifications(withdrawalRequests);

  const principalId = identity?.getPrincipal().toString();

  const recentTransactions = transactions?.slice(0, 5) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your Bitcoin credits wallet
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>App-Managed Custodial Reserve Model:</strong> Your credits represent BTC-denominated app balance backed 1:1 by the app's custodial reserve. Each credit equals 1 Bitcoin in value. The app manages the reserve and handles on-chain broadcasting for you—you do not need to manage private keys for sending transactions.
        </AlertDescription>
      </Alert>

      <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
        <ShieldAlert className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-900 dark:text-amber-100">
          <strong>Security Notice:</strong> This app never accepts, stores, or displays Bitcoin private keys (WIF format), seed phrases, or signing secrets. Do not paste private keys into this app. All transaction signing must be performed externally using your own secure tools. The app does not use AI to sign transactions or execute external payout API calls.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="financial-card md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Balance</CardTitle>
                <CardDescription>Available credits in your wallet</CardDescription>
              </div>
              <Wallet className="h-8 w-8 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <div className="stat-value text-muted-foreground">Loading...</div>
            ) : (
              <>
                <div className="stat-value text-primary">{balance?.toString() || '0'} BTC</div>
                <UsdEstimateLine 
                  btcAmount={balance || BigInt(0)} 
                  btcPriceUsd={btcPriceUsd} 
                  isLoading={priceLoading}
                />
              </>
            )}
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader>
            <CardTitle className="text-base">Wallet Identity</CardTitle>
            <CardDescription>Your principal ID</CardDescription>
          </CardHeader>
          <CardContent>
            <code className="text-xs font-mono break-all block p-2 bg-muted rounded">
              {principalId || 'Not connected'}
            </code>
          </CardContent>
        </Card>
      </div>

      <WithdrawalStatusSummaryCard requests={withdrawalRequests || []} />

      <div className="grid gap-4 md:grid-cols-3">
        <Button asChild size="lg" className="h-auto py-4">
          <Link to="/buy-credits" className="flex flex-col items-center gap-2">
            <Coins className="h-6 w-6" />
            <span className="font-semibold">Buy Credits</span>
            <span className="text-xs opacity-80">Purchase with Bitcoin</span>
          </Link>
        </Button>

        <Button asChild size="lg" variant="secondary" className="h-auto py-4">
          <Link to="/send-btc" className="flex flex-col items-center gap-2">
            <Send className="h-6 w-6" />
            <span className="font-semibold">Send BTC</span>
            <span className="text-xs opacity-80">Transfer to mainnet</span>
          </Link>
        </Button>

        <Button asChild size="lg" variant="outline" className="h-auto py-4">
          <Link to="/history" className="flex flex-col items-center gap-2">
            <History className="h-6 w-6" />
            <span className="font-semibold">History</span>
            <span className="text-xs opacity-80">View transactions</span>
          </Link>
        </Button>
      </div>

      <Card className="financial-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest transactions</CardDescription>
            </div>
            <History className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      {tx.transactionType === 'creditPurchase' && <Coins className="h-4 w-4 text-primary" />}
                      {tx.transactionType === 'debit' && <Send className="h-4 w-4 text-primary" />}
                      {tx.transactionType === 'adjustment' && <TrendingUp className="h-4 w-4 text-primary" />}
                      {tx.transactionType === 'withdrawalRequested' && <AlertCircle className="h-4 w-4 text-amber-600" />}
                      {tx.transactionType === 'withdrawalPaid' && <TrendingUp className="h-4 w-4 text-green-600" />}
                      {tx.transactionType === 'withdrawalRejected' && <AlertCircle className="h-4 w-4 text-red-600" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {tx.transactionType === 'creditPurchase' && 'Credit Purchase'}
                        {tx.transactionType === 'debit' && 'BTC Transfer'}
                        {tx.transactionType === 'adjustment' && 'Balance Adjustment'}
                        {tx.transactionType === 'withdrawalRequested' && 'Withdrawal Requested'}
                        {tx.transactionType === 'withdrawalPaid' && 'Withdrawal Paid'}
                        {tx.transactionType === 'withdrawalRejected' && 'Withdrawal Rejected'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(Number(tx.timestamp) / 1000000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${
                      tx.transactionType === 'creditPurchase' || tx.transactionType === 'withdrawalRejected'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {tx.transactionType === 'creditPurchase' || tx.transactionType === 'withdrawalRejected' ? '+' : '-'}
                      {tx.amount.toString()} BTC
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {transactions && transactions.length > 5 && (
            <div className="mt-4 text-center">
              <Button asChild variant="outline" size="sm">
                <Link to="/history">View All Transactions</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
