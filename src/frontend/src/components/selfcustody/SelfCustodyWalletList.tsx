import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Copy, Wallet } from 'lucide-react';
import { useGetSelfCustodyWallets } from '@/hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import UsdEstimateLine from '@/components/balance/UsdEstimateLine';

export default function SelfCustodyWalletList() {
  const { data: wallets, isLoading } = useGetSelfCustodyWallets();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const formatBtc = (satoshis: bigint) => {
    return (Number(satoshis) / 100000000).toFixed(8);
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!wallets || wallets.length === 0) {
    return (
      <div className="space-y-4">
        <Alert className="border-blue-500/50 bg-blue-500/10">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Backend Implementation Required:</strong> The self-custody wallet list feature requires backend
            support that is not yet implemented. This includes querying wallet records, tracking balances, and returning
            wallet metadata per user.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              No Self-Custody Wallets Yet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You haven't generated any self-custody wallets yet. Click the "Generate New Self-Custody Wallet" button
              above to create your first wallet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Your Self-Custody Wallets ({wallets.length})</h3>

      {wallets.map((wallet, index) => (
        <Card key={wallet.address}>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Wallet #{index + 1}
              </span>
              <span className="text-sm font-normal text-muted-foreground">{wallet.network}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Bitcoin Address</p>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-muted px-2 py-1 rounded flex-1 truncate">{wallet.address}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(wallet.address, 'Address')}
                  className="gap-1"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Balance</p>
              <p className="text-lg font-semibold">{formatBtc(wallet.balance)} BTC</p>
              <UsdEstimateLine btcAmount={wallet.balance} btcPriceUsd={null} />
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-1">Created</p>
              <p className="text-sm">{formatDate(wallet.createdAt)}</p>
            </div>

            {wallet.derivationPath && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Derivation Path</p>
                <code className="text-xs bg-muted px-2 py-1 rounded block">{wallet.derivationPath}</code>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
