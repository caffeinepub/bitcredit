import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreditBtc } from '../hooks/useQueries';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';
import { Coins, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import UsdEstimateLine from '../components/balance/UsdEstimateLine';

export default function AdminSendCreditsPage() {
  const [principalId, setPrincipalId] = useState('');
  const [btcAmount, setBtcAmount] = useState('');
  const [principalError, setPrincipalError] = useState('');
  const [amountError, setAmountError] = useState('');

  const { mutate: sendCredits, isPending } = useCreditBtc();

  const validatePrincipal = (value: string): boolean => {
    if (!value.trim()) {
      setPrincipalError('Principal ID is required');
      return false;
    }
    try {
      Principal.fromText(value.trim());
      setPrincipalError('');
      return true;
    } catch (error) {
      setPrincipalError('Invalid Principal ID format');
      return false;
    }
  };

  const validateAmount = (value: string): boolean => {
    if (!value.trim()) {
      setAmountError('Amount is required');
      return false;
    }
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      setAmountError('Amount must be a positive number');
      return false;
    }
    const decimalPlaces = (value.split('.')[1] || '').length;
    if (decimalPlaces > 8) {
      setAmountError('Amount cannot have more than 8 decimal places');
      return false;
    }
    setAmountError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isPrincipalValid = validatePrincipal(principalId);
    const isAmountValid = validateAmount(btcAmount);

    if (!isPrincipalValid || !isAmountValid) {
      return;
    }

    const recipient = Principal.fromText(principalId.trim());
    const amount = parseFloat(btcAmount);
    const satoshis = Math.round(amount * 100_000_000);
    
    // Generate a unique transaction ID for this credit operation
    const transactionId = `admin-credit-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    sendCredits(
      { targetUser: recipient, transactionId, amount: BigInt(satoshis) },
      {
        onSuccess: () => {
          setPrincipalId('');
          setBtcAmount('');
          setPrincipalError('');
          setAmountError('');
        },
      }
    );
  };

  const enteredAmount = btcAmount ? parseFloat(btcAmount) : 0;
  const enteredSatoshis = enteredAmount ? BigInt(Math.round(enteredAmount * 100_000_000)) : 0n;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Send Credits to Users</h1>
        <p className="text-muted-foreground">
          Credit BTC directly to user accounts by Principal ID
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This action will immediately credit the specified amount to the user's account.
          Make sure you have verified the transaction externally before crediting.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Credit User Account</CardTitle>
          <CardDescription>Enter user Principal ID and BTC amount</CardDescription>
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
                onChange={(e) => {
                  setPrincipalId(e.target.value);
                  if (principalError) validatePrincipal(e.target.value);
                }}
                onBlur={() => validatePrincipal(principalId)}
                className={principalError ? 'border-destructive' : ''}
              />
              {principalError && (
                <p className="text-sm text-destructive">{principalError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (BTC)</Label>
              <Input
                id="amount"
                type="number"
                step="0.00000001"
                placeholder="0.00000000"
                value={btcAmount}
                onChange={(e) => {
                  setBtcAmount(e.target.value);
                  if (amountError) validateAmount(e.target.value);
                }}
                onBlur={() => validateAmount(btcAmount)}
                className={amountError ? 'border-destructive' : ''}
              />
              {amountError && (
                <p className="text-sm text-destructive">{amountError}</p>
              )}
              {enteredAmount > 0 && (
                <UsdEstimateLine btcAmount={enteredSatoshis} btcPriceUsd={null} />
              )}
              <p className="text-xs text-muted-foreground">
                Enter the amount in BTC (up to 8 decimal places)
              </p>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full"
            >
              {isPending ? (
                <>
                  <Coins className="mr-2 h-4 w-4 animate-spin" />
                  Sending Credits...
                </>
              ) : (
                <>
                  <Coins className="mr-2 h-4 w-4" />
                  Send BTC Credits
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
