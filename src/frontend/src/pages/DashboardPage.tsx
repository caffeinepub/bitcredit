import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGetCallerBalance, useGetTransactionHistory } from '../hooks/useQueries';
import { ArrowUpRight, ArrowDownRight, History, Send, Users, Wallet, ShoppingCart } from 'lucide-react';
import UsdEstimateLine from '../components/balance/UsdEstimateLine';
import WithdrawalStatusSummaryCard from '../components/withdrawals/WithdrawalStatusSummaryCard';
import { useFundedWithdrawalNotifications } from '../hooks/useFundedWithdrawalNotifications';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const { data: balance, isLoading: balanceLoading } = useGetCallerBalance();
  const { data: transactions, isLoading: transactionsLoading } = useGetTransactionHistory();
  
  useFundedWithdrawalNotifications();

  const recentTransactions = transactions?.slice(0, 5) || [];
  const btcBalance = balance ? Number(balance) / 100_000_000 : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Manage your Bitcoin credits and transfers</p>
      </div>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> This is an app-managed custodial wallet. The application controls your Bitcoin.
          Only deposit amounts you're comfortable with the app managing.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your Balance</CardTitle>
            <CardDescription>Available Bitcoin credits</CardDescription>
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <div className="h-12 w-48 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <p className="text-4xl font-bold">₿ {btcBalance.toFixed(8)}</p>
                <UsdEstimateLine btcAmount={balance || 0n} btcPriceUsd={null} />
              </>
            )}
          </CardContent>
        </Card>

        <WithdrawalStatusSummaryCard />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Link to="/buy-btc">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Buy BTC</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Purchase Bitcoin instantly
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/send-btc">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Send BTC</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Send Bitcoin to external addresses
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/send-to-peer">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Send to Peer</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Transfer credits to another user
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/withdraw">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ArrowDownRight className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Withdraw</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Request withdrawal to payment method
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/history">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">History</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                View all transactions
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest activity</CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : recentTransactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {tx.transactionType === 'creditPurchase' || tx.transactionType === 'adjustment' ? (
                      <ArrowUpRight className="h-5 w-5 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium capitalize">
                        {tx.transactionType.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(Number(tx.timestamp) / 1_000_000).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p className="font-mono font-semibold">
                    ₿ {(Number(tx.amount) / 100_000_000).toFixed(8)}
                  </p>
                </div>
              ))}
            </div>
          )}
          {recentTransactions.length > 0 && (
            <div className="mt-4">
              <Link to="/history">
                <Button variant="outline" className="w-full">
                  View All Transactions
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
