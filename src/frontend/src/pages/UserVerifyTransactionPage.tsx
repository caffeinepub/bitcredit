import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSubmitVerification, useUserVerificationRequests } from '../hooks/useQueries';
import { Loader2 } from 'lucide-react';
import UserVerificationHistoryTable from '../components/verification/UserVerificationHistoryTable';

export default function UserVerifyTransactionPage() {
  const [txid, setTxid] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<{ txid?: string; amount?: string }>({});

  const submitVerification = useSubmitVerification();
  const { data: verificationRequests, isLoading: requestsLoading } = useUserVerificationRequests();

  const validateTxid = (value: string): boolean => {
    const txidRegex = /^[0-9a-fA-F]{64}$/;
    if (!value) {
      setErrors(prev => ({ ...prev, txid: 'Transaction ID is required' }));
      return false;
    }
    if (!txidRegex.test(value)) {
      setErrors(prev => ({ ...prev, txid: 'Transaction ID must be a 64-character hexadecimal string' }));
      return false;
    }
    setErrors(prev => ({ ...prev, txid: undefined }));
    return true;
  };

  const validateAmount = (value: string): boolean => {
    if (!value) {
      setErrors(prev => ({ ...prev, amount: 'Amount is required' }));
      return false;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      setErrors(prev => ({ ...prev, amount: 'Amount must be a positive number' }));
      return false;
    }
    const decimalPlaces = (value.split('.')[1] || '').length;
    if (decimalPlaces > 8) {
      setErrors(prev => ({ ...prev, amount: 'Amount cannot have more than 8 decimal places' }));
      return false;
    }
    setErrors(prev => ({ ...prev, amount: undefined }));
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isTxidValid = validateTxid(txid);
    const isAmountValid = validateAmount(amount);

    if (!isTxidValid || !isAmountValid) {
      return;
    }

    const btcAmount = parseFloat(amount);
    const satoshis = Math.round(btcAmount * 100000000);

    try {
      await submitVerification.mutateAsync({
        transactionId: txid,
        amount: BigInt(satoshis),
      });

      setTxid('');
      setAmount('');
      setErrors({});
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Verify Bitcoin Transaction</h1>
        <p className="text-muted-foreground">
          Submit your Bitcoin transaction for verification
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>How It Works</AlertTitle>
        <AlertDescription>
          Submit your Bitcoin transaction ID (txid) and the amount you sent. An admin will verify your transaction
          on the blockchain and approve your request. Once approved, the credits will be added to your balance.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Submit Transaction for Verification</CardTitle>
          <CardDescription>
            Enter your Bitcoin transaction details below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="txid">Bitcoin Transaction ID (txid)</Label>
              <Input
                id="txid"
                type="text"
                placeholder="64-character hexadecimal string"
                value={txid}
                onChange={(e) => {
                  setTxid(e.target.value);
                  if (errors.txid) validateTxid(e.target.value);
                }}
                onBlur={() => validateTxid(txid)}
                className={errors.txid ? 'border-destructive' : ''}
              />
              {errors.txid && (
                <p className="text-sm text-destructive">{errors.txid}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (BTC)</Label>
              <Input
                id="amount"
                type="number"
                step="0.00000001"
                placeholder="0.00000000"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) validateAmount(e.target.value);
                }}
                onBlur={() => validateAmount(amount)}
                className={errors.amount ? 'border-destructive' : ''}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter the amount in BTC (up to 8 decimal places)
              </p>
            </div>

            <Button
              type="submit"
              disabled={submitVerification.isPending}
              className="w-full"
            >
              {submitVerification.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit for Verification'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Verification Requests</CardTitle>
          <CardDescription>
            Track the status of your submitted transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserVerificationHistoryTable 
            requests={verificationRequests || []} 
            isLoading={requestsLoading} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
