import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ManualVerificationForm from '../components/verification/ManualVerificationForm';
import VerificationHistoryTable from '../components/verification/VerificationHistoryTable';
import { useGetBitcoinPurchases } from '../hooks/useQueries';
import { Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminManualVerificationPage() {
  const { data: purchases, isLoading } = useGetBitcoinPurchases();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Manual Bitcoin Verification</h1>
        <p className="text-muted-foreground">
          Record Bitcoin purchases for historical tracking and special cases
        </p>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900">Instant Funding Now Active</AlertTitle>
        <AlertDescription className="text-blue-800">
          The standard user flow now funds accounts instantly when users submit transaction IDs. This manual 
          verification page is primarily for historical record-keeping, special cases, or administrative corrections. 
          Manual records created here are stored as verified purchase records for audit purposes.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Record Bitcoin Purchase Manually</CardTitle>
          <CardDescription>
            Enter the Bitcoin transaction ID and amount to create a manual verification record
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
