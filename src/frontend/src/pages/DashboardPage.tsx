import { useNavigate } from '@tanstack/react-router';
import { useGetCallerBalance } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Send, History, ArrowUpFromLine, ShieldAlert, ShoppingCart, ArrowDownToLine, Lock } from 'lucide-react';
import ProfileSetupModal from '../components/auth/ProfileSetupModal';
import LoggedOutSignInPanel from '../components/auth/LoggedOutSignInPanel';
import WithdrawalStatusSummaryCard from '../components/withdrawals/WithdrawalStatusSummaryCard';
import BitcoinAddressDisplay from '../components/balance/BitcoinAddressDisplay';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: balance, isLoading: balanceLoading } = useGetCallerBalance();
  
  const isAuthenticated = !!identity;

  if (!isAuthenticated) {
    return <LoggedOutSignInPanel />;
  }

  const btcBalance = balance ? Number(balance) / 100_000_000 : 0;

  return (
    <>
      <ProfileSetupModal />
      
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your Bitcoin credits and transactions
            </p>
          </div>

          <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">Threshold ECDSA Security</AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              This application uses the Internet Computer's threshold ECDSA protocol for enhanced Bitcoin security.
              Your funds are protected through distributed cryptography without exposing private keys.
              <Button
                variant="link"
                className="text-amber-800 dark:text-amber-200 underline p-0 h-auto ml-1"
                onClick={() => navigate({ to: '/wallet/keys' })}
              >
                Learn more about wallet security →
              </Button>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Current Balance</CardTitle>
              <CardDescription>Your available Bitcoin credits</CardDescription>
            </CardHeader>
            <CardContent>
              {balanceLoading ? (
                <div className="animate-pulse">
                  <div className="h-12 bg-muted rounded w-48" />
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-4xl font-bold">{btcBalance.toFixed(8)} BTC</p>
                  <p className="text-sm text-muted-foreground">
                    {balance?.toString()} satoshis
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <BitcoinAddressDisplay />

          <WithdrawalStatusSummaryCard />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate({ to: '/buy-bitcoin' })}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Buy Bitcoin
                </CardTitle>
                <CardDescription>
                  Purchase BTC credits instantly
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate({ to: '/send-btc' })}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send BTC
                </CardTitle>
                <CardDescription>
                  Transfer Bitcoin to any address
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate({ to: '/receive-btc' })}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowDownToLine className="h-5 w-5" />
                  Receive BTC
                </CardTitle>
                <CardDescription>
                  Get your Bitcoin address
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate({ to: '/withdraw' })}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpFromLine className="h-5 w-5" />
                  Withdraw
                </CardTitle>
                <CardDescription>
                  Request withdrawal to external wallet
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate({ to: '/history' })}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  History
                </CardTitle>
                <CardDescription>
                  View your transaction history
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-amber-500" onClick={() => navigate({ to: '/wallet/keys' })}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Wallet Keys
                </CardTitle>
                <CardDescription>
                  View addresses and security info
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
