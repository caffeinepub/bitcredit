import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerBalance } from '../hooks/useQueries';
import { Copy, CheckCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import UsdEstimateLine from '../components/balance/UsdEstimateLine';

export default function AdminCredentialsPage() {
  const { identity } = useInternetIdentity();
  const { data: balance, isLoading: balanceLoading } = useGetCallerBalance();

  const principalId = identity?.getPrincipal().toString() || '';
  const btcBalance = balance ? Number(balance) / 100_000_000 : 0;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Admin Credentials</h1>
        <p className="text-muted-foreground">Your administrator account information</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <CardTitle>Admin Status</CardTitle>
            </div>
            <CardDescription>You have administrator privileges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-green-800 dark:text-green-200 font-semibold">
                ✓ Verified Administrator
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Principal ID</CardTitle>
            <CardDescription>Your unique Internet Identity principal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-4 py-2 rounded font-mono text-sm break-all">
                {principalId}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(principalId)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Balance</CardTitle>
            <CardDescription>Your current credit balance</CardDescription>
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <p className="text-2xl font-bold">₿ {btcBalance.toFixed(8)}</p>
                <UsdEstimateLine btcAmount={balance || 0n} btcPriceUsd={null} />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Admin Capabilities</CardTitle>
            </div>
            <CardDescription>What you can do as an administrator</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Manage Withdrawal Requests</p>
                  <p className="text-sm text-muted-foreground">
                    Approve, reject, or mark withdrawal requests as paid
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">View All Transactions</p>
                  <p className="text-sm text-muted-foreground">
                    Access system-wide transaction history
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Monitor Reserve Status</p>
                  <p className="text-sm text-muted-foreground">
                    Track reserve balance and system health
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">Initial Credits</p>
                  <p className="text-sm text-muted-foreground">
                    500 credits granted automatically on first admin use
                  </p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
