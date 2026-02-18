import { useGetCallerBalance, useGetTransactionHistory, useGetCallerBitcoinWallet, useGetCurrentBtcPriceUsd } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, TrendingUp, History, ArrowRight, Wallet, Copy, CheckCircle, AlertCircle, Info, DollarSign } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { data: balance, isLoading: balanceLoading } = useGetCallerBalance();
  const { data: transactions, isLoading: historyLoading } = useGetTransactionHistory();
  const { data: wallet, isLoading: walletLoading, isError: walletError, isFetched: walletFetched } = useGetCallerBitcoinWallet();
  const { data: btcPriceUsd, isLoading: priceLoading } = useGetCurrentBtcPriceUsd();
  const [copied, setCopied] = useState(false);

  const recentTransactions = transactions?.slice(0, 5) || [];
  const balanceInBTC = balance ? Number(balance) / 100_000_000 : 0;

  // Calculate estimated USD value for total balance
  const estimatedUsdValue = btcPriceUsd && balance 
    ? (Number(balance) / 100_000_000) * btcPriceUsd 
    : null;

  // Calculate per-credit USD value (1 credit = 1 satoshi)
  const perCreditUsdValue = btcPriceUsd 
    ? btcPriceUsd / 100_000_000 
    : null;

  const handleCopyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage your Bitcoin-backed credits and transfers
        </p>
      </div>

      {/* Important Information Alert */}
      <Alert className="border-amber-500/50 bg-amber-500/10">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-sm">
          <strong>Important:</strong> Your credits are denominated in BTC and backed 1:1 by Bitcoin reserves held by the platform. 
          The USD value shown is an estimate based on current Bitcoin market prices and will fluctuate with the market. 
          Credits can be used for Bitcoin mainnet transfers subject to reserve availability and Bitcoin network fees.
        </AlertDescription>
      </Alert>

      {/* Balance Card */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            Your Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {balanceLoading ? (
            <Skeleton className="h-12 w-48" />
          ) : (
            <div className="space-y-3">
              <div className="text-4xl font-bold tracking-tight">
                {balanceInBTC.toFixed(8)} BTC
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                {priceLoading ? (
                  <span>Loading USD estimate...</span>
                ) : estimatedUsdValue !== null ? (
                  <span>
                    Estimated USD value: ${estimatedUsdValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    <span className="ml-1 text-xs italic">(fluctuates with Bitcoin market price)</span>
                  </span>
                ) : (
                  <span>Estimated USD value: unavailable</span>
                )}
              </div>
              <div className="pt-2 border-t border-primary/10">
                <p className="text-xs text-muted-foreground">
                  {priceLoading ? (
                    <span>Loading per-credit value...</span>
                  ) : perCreditUsdValue !== null ? (
                    <span>
                      1 Credit (BTC) ≈ ${perCreditUsdValue.toFixed(8)} USD
                    </span>
                  ) : (
                    <span>Per-credit USD value: unavailable</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wallet Identity Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Your Wallet Identity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {walletLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : walletError || (walletFetched && !wallet) ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>No wallet found. Create one to receive Bitcoin.</span>
            </div>
          ) : wallet ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm font-mono break-all">
                  {wallet.address}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyAddress}
                  className="shrink-0"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This is your unique Bitcoin wallet address for receiving transfers
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Buy Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Purchase BTC credits by verifying a Bitcoin transaction
            </p>
            <Link to="/buy-credits">
              <Button className="w-full">
                Buy Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-600" />
              Send BTC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Transfer your credits to any Bitcoin mainnet address
            </p>
            <Link to="/send-btc">
              <Button className="w-full" variant="outline">
                Send Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5 text-blue-600" />
              History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View all your transactions and transfer requests
            </p>
            <Link to="/history">
              <Button className="w-full" variant="outline">
                View History
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No transactions yet</p>
              <p className="text-sm">Start by buying credits or sending BTC</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      tx.transactionType === 'creditPurchase' ? 'bg-green-500/10' :
                      tx.transactionType === 'debit' ? 'bg-red-500/10' :
                      'bg-blue-500/10'
                    }`}>
                      {tx.transactionType === 'creditPurchase' ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : tx.transactionType === 'debit' ? (
                        <ArrowRight className="h-4 w-4 text-red-600" />
                      ) : (
                        <Coins className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {tx.transactionType === 'creditPurchase' ? 'Credit Purchase' :
                         tx.transactionType === 'debit' ? 'BTC Transfer' :
                         'Credit Adjustment'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(Number(tx.timestamp) / 1_000_000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`font-semibold ${
                    tx.transactionType === 'creditPurchase' || tx.transactionType === 'adjustment' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {tx.transactionType === 'creditPurchase' || tx.transactionType === 'adjustment' ? '+' : '-'}
                    {(Number(tx.amount) / 100_000_000).toFixed(8)} BTC
                  </div>
                </div>
              ))}
              <Link to="/history">
                <Button variant="ghost" className="w-full mt-2">
                  View All Transactions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Onboarding Guide */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">Getting Started</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-primary">1.</span>
              <span>Purchase BTC credits by verifying a Bitcoin transaction on the Buy Credits page</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-primary">2.</span>
              <span>Send your credits to any Bitcoin mainnet address using the Send BTC page</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-primary">3.</span>
              <span>Track all your transactions and transfer requests in the History page</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
