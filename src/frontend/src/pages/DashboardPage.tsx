import { useNavigate } from '@tanstack/react-router';
import { useGetCallerBalance } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import AppLayout from '../components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Send, History, ArrowUpFromLine, ShieldAlert, ShoppingCart, ArrowDownToLine } from 'lucide-react';
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
    return (
      <AppLayout>
        <LoggedOutSignInPanel />
      </AppLayout>
    );
  }

  const btcBalance = balance ? Number(balance) / 100_000_000 : 0;

  return (
    <AppLayout>
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
            <AlertTitle className="text-amber-800 dark:text-amber-200">Custodial Model Notice</AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              This application operates as a custodial service. Your Bitcoin is held in reserve by the platform.
              For maximum security, consider withdrawing to your own wallet.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Current Balance</CardTitle>
              <CardDescription>Your available Bitcoin credits</CardDescription>
            </CardHeader>
            <CardContent>
              {balanceLoading ? (
                <div className="text-2xl font-bold text-muted-foreground">Loading...</div>
              ) : (
                <div>
                  <div className="text-4xl font-bold">{btcBalance.toFixed(8)} BTC</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    USD value unavailable
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <BitcoinAddressDisplay />

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate({ to: '/send-btc' })}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Send BTC</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Send Bitcoin to any address
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate({ to: '/receive-btc' })}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receive BTC</CardTitle>
                <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Get your Bitcoin address
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate({ to: '/buy-btc' })}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Buy BTC</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Fund your account instantly
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:bg-accent transition-colors" onClick={() => navigate({ to: '/withdraw' })}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Withdraw</CardTitle>
                <ArrowUpFromLine className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Request a withdrawal
                </p>
              </CardContent>
            </Card>
          </div>

          <WithdrawalStatusSummaryCard />

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>View your transaction history</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate({ to: '/history' })} className="w-full gap-2">
                <History className="h-4 w-4" />
                View Full History
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
