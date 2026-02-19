import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, ArrowLeft } from 'lucide-react';
import { useGetCallerBalance } from '../hooks/useQueries';
import UsdEstimateLine from '../components/balance/UsdEstimateLine';

export default function BuyCreditsPage() {
  const { data: balance, isLoading: balanceLoading } = useGetCallerBalance();
  const btcBalance = balance ? Number(balance) / 100_000_000 : 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Buy Credits</h1>
        <p className="text-muted-foreground">Purchase Bitcoin credits for your account</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current Balance</CardTitle>
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

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>How it works:</strong> Credits are issued after blockchain verification and represent BTC-denominated
          app balance backed 1:1 by the reserve. The application manages the Bitcoin on your behalf.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Credit Purchase</CardTitle>
          <CardDescription>Payment integration coming soon</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The credit purchase feature is currently under development. Payment integration with external
            providers will be available in a future update.
          </p>
          
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">What you'll be able to do:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Purchase credits using various payment methods</li>
              <li>Instant credit issuance after payment confirmation</li>
              <li>Automatic blockchain verification</li>
              <li>1:1 backing by reserve Bitcoin</li>
            </ul>
          </div>

          <Link to="/">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
