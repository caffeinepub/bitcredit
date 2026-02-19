import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreditBtcWithVerification } from '../hooks/useQueries';
import { Principal } from '@dfinity/principal';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import UsdEstimateLine from '../components/balance/UsdEstimateLine';

export default function AdminSendCreditsPage() {
  const [principalId, setPrincipalId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [btcAmount, setBtcAmount] = useState('');
  const [validationError, setValidationError] = useState('');

  const creditMutation = useCreditBtcWithVerification();

  const satoshiAmount = btcAmount && Number(btcAmount) > 0 
    ? BigInt(Math.floor(Number(btcAmount) * 100000000))
    : BigInt(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    try {
      const targetUser = Principal.fromText(principalId.trim());
      
      if (!transactionId.trim()) {
        setValidationError('Transaction ID is required');
        return;
      }

      if (satoshiAmount <= 0n) {
        setValidationError('Amount must be greater than 0');
        return;
      }

      await creditMutation.mutateAsync({
        targetUser,
        transactionId: transactionId.trim(),
        amount: satoshiAmount,
      });

      // Reset form on success
      setPrincipalId('');
      setTransactionId('');
      setBtcAmount('');
    } catch (error: any) {
      if (error.message?.includes('Invalid principal')) {
        setValidationError('Invalid Principal ID format');
      } else {
        setValidationError(error.message || 'Failed to credit BTC');
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Send Credits to User</h1>
        <p className="text-muted-foreground">
          Credit BTC directly to a user account with transaction verification
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credit User Account</CardTitle>
          <CardDescription>
            Enter the user's Principal ID, transaction ID, and BTC amount to credit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="principalId">User Principal ID</Label>
              <Input
                id="principalId"
                type="text"
                placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"
                value={principalId}
                onChange={(e) => setPrincipalId(e.target.value)}
                disabled={creditMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionId">Bitcoin Transaction ID</Label>
              <Input
                id="transactionId"
                type="text"
                placeholder="64-character hex transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                disabled={creditMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                This prevents duplicate credits for the same transaction
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="btcAmount">BTC Amount</Label>
              <Input
                id="btcAmount"
                type="number"
                step="0.00000001"
                min="0"
                placeholder="0.00000000"
                value={btcAmount}
                onChange={(e) => setBtcAmount(e.target.value)}
                disabled={creditMutation.isPending}
              />
              {satoshiAmount > 0n && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    = {satoshiAmount.toString()} satoshis
                  </p>
                  <UsdEstimateLine btcAmount={satoshiAmount} btcPriceUsd={null} />
                </div>
              )}
            </div>

            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {creditMutation.isSuccess && (
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Credits successfully sent to user!
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={creditMutation.isPending}
              className="w-full"
            >
              {creditMutation.isPending ? 'Sending...' : 'Send Credits'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
