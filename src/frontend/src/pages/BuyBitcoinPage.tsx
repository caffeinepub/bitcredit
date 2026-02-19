import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import InstantFundingForm from '../components/buybtc/InstantFundingForm';
import BuyBitcoinHistoryTable from '../components/buybtc/BuyBitcoinHistoryTable';
import { useGetCallerBalance } from '../hooks/useQueries';

export default function BuyBitcoinPage() {
  const { data: balance, isLoading: balanceLoading } = useGetCallerBalance();
  const btcBalance = balance ? Number(balance) / 100_000_000 : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Buy Bitcoin</h1>
        <p className="text-muted-foreground">
          Submit your Bitcoin purchase transaction for instant account funding
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          After purchasing Bitcoin externally, submit your transaction ID and amount here.
          Your account will be credited instantly upon submission.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Current Balance</CardTitle>
          <CardDescription>Your available Bitcoin credits</CardDescription>
        </CardHeader>
        <CardContent>
          {balanceLoading ? (
            <div className="h-10 w-48 bg-muted animate-pulse rounded" />
          ) : (
            <p className="text-3xl font-bold">₿ {btcBalance.toFixed(8)}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submit Purchase</CardTitle>
          <CardDescription>
            Enter your Bitcoin transaction details for instant funding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InstantFundingForm />
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">Purchase History</h2>
        <BuyBitcoinHistoryTable />
      </div>
    </div>
  );
}
