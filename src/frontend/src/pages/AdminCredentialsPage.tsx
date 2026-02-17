import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useGetCallerBalance } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

export default function AdminCredentialsPage() {
  const { data: balance, isLoading: balanceLoading } = useGetCallerBalance();
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
                <p className="text-2xl font-bold text-primary">
                  {balance?.toString() || '0'} BTC
                </p>
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
                <span>Transfer credits to any user principal</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-chart-2 mt-0.5 flex-shrink-0" />
                <span>View all transaction history across the platform</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-chart-2 mt-0.5 flex-shrink-0" />
                <span>Manage user credit adjustments and balances</span>
              </li>
            </ul>
          </div>

          <div className="pt-4">
            <Link to="/admin">
              <Button className="w-full" size="lg">
                Continue to Admin Panel
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="financial-card">
        <CardHeader>
          <CardTitle className="text-sm">Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Your admin privileges are tied to your Internet Identity principal
          </p>
          <p>
            • All admin actions are logged and recorded in the transaction history
          </p>
          <p>
            • Initial 500 credits are granted automatically on first admin use (one-time only)
          </p>
          <p>
            • Credit transfers are immediate and cannot be reversed
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
