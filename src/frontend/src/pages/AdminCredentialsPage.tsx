import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useGetCallerBalance, useGetCurrentBtcPriceUsd } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import UsdEstimateLine from '../components/balance/UsdEstimateLine';

export default function AdminCredentialsPage() {
  const { data: balance, isLoading: balanceLoading } = useGetCallerBalance();
  const { data: btcPriceUsd, isLoading: priceLoading } = useGetCurrentBtcPriceUsd();
  const { identity } = useInternetIdentity();

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Shield className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Admin Credentials</h1>
        <p className="text-muted-foreground text-lg">
          Welcome to the administrative area
        </p>
      </div>

      <Card className="financial-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-chart-2" />
            Admin Access Verified
          </CardTitle>
          <CardDescription>
            You have been authenticated as an administrator
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm font-medium">Your Principal ID</p>
              <p className="text-xs text-muted-foreground font-mono break-all">
                {identity?.getPrincipal().toString() || 'Loading...'}
              </p>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <p className="text-sm font-medium">Current Balance</p>
              {balanceLoading ? (
                <div className="h-6 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <p className="text-2xl font-bold text-primary">
                    {balance?.toString() || '0'} BTC
                  </p>
                  <UsdEstimateLine 
                    btcAmount={balance || BigInt(0)} 
                    btcPriceUsd={btcPriceUsd} 
                    isLoading={priceLoading}
                  />
                </>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-semibold text-sm">Admin Capabilities</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-chart-2 mt-0.5 flex-shrink-0" />
                <span>Receive automatic one-time 500-credit grant on first admin use</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-chart-2 mt-0.5 flex-shrink-0" />
                <span>Transfer credits to Bitcoin mainnet addresses</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-chart-2 mt-0.5 flex-shrink-0" />
                <span>Manage the app's Bitcoin reserve balance</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-chart-2 mt-0.5 flex-shrink-0" />
                <span>Process user withdrawal requests (mark as paid or reject)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-chart-2 mt-0.5 flex-shrink-0" />
                <span>View all user transactions and transfer requests</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <Button asChild className="w-full" size="lg">
              <Link to="/admin" className="flex items-center justify-center gap-2">
                Go to Admin Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
