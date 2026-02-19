import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ManualVerificationForm from '../components/verification/ManualVerificationForm';
import VerificationHistoryTable from '../components/verification/VerificationHistoryTable';
import { useGetBitcoinPurchases } from '../hooks/useQueries';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminManualVerificationPage() {
  const { data: purchases, isLoading } = useGetBitcoinPurchases();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Manual Bitcoin Verification</h1>
        <p className="text-muted-foreground">
          Record Bitcoin purchases by verifying transaction IDs on the blockchain
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Manual Verification Process</AlertTitle>
        <AlertDescription>
          This tool allows you to manually record Bitcoin purchases after verifying them on the blockchain.
          Enter the transaction ID (txid) and amount in BTC. The system will store this as a verified purchase record.
          This does not automatically update reserve balances - it serves as an audit trail.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Verify New Bitcoin Purchase</CardTitle>
          <CardDescription>
            Enter the Bitcoin transaction ID and amount to record a verified purchase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ManualVerificationForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verification History</CardTitle>
          <CardDescription>
            All manually verified Bitcoin purchases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VerificationHistoryTable purchases={purchases || []} isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  );
}
