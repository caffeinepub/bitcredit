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
      setAmountError('Amount must be greater than 0');
      return false;
    }
    // Check for max 8 decimal places
    const decimalParts = value.split('.');
    if (decimalParts.length > 1 && decimalParts[1].length > 8) {
      setAmountError('Maximum 8 decimal places allowed');
      return false;
    }
    setAmountError('');
    return true;
  };

  const handlePrincipalChange = (value: string) => {
    setPrincipalId(value);
    if (principalError) {
      validatePrincipal(value);
    }
  };

  const handleAmountChange = (value: string) => {
    setBtcAmount(value);
    if (amountError) {
      validateAmount(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isPrincipalValid = validatePrincipal(principalId);
    const isAmountValid = validateAmount(btcAmount);

    if (!isPrincipalValid || !isAmountValid) {
      return;
    }

    try {
      const recipient = Principal.fromText(principalId.trim());
      const btcValue = parseFloat(btcAmount);
      const satoshis = BigInt(Math.round(btcValue * 100000000));

      sendCredits(
        { user: recipient, amount: satoshis },
        {
          onSuccess: () => {
            toast.success('BTC credits sent successfully');
            setPrincipalId('');
            setBtcAmount('');
            setPrincipalError('');
            setAmountError('');
          },
          onError: (error: any) => {
            const errorMessage = error?.message || 'Failed to send BTC credits';
            if (errorMessage.includes('Unauthorized')) {
              toast.error('You do not have permission to send BTC credits');
            } else {
              toast.error(errorMessage);
            }
          },
        }
      );
    } catch (error) {
      toast.error('Invalid input values');
    }
  };

  const btcAmountBigInt = btcAmount && !isNaN(parseFloat(btcAmount)) 
    ? BigInt(Math.round(parseFloat(btcAmount) * 100000000))
    : 0n;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Send BTC Credits to Users</h1>
        <p className="text-muted-foreground">
          Credit BTC directly to user accounts as an administrator
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> This action will immediately credit the specified amount to the user's balance and record it in their transaction history.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Credit User Account
          </CardTitle>
          <CardDescription>
            Enter the recipient's Principal ID and the BTC amount to credit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="principalId">Recipient Principal ID</Label>
              <Input
                id="principalId"
                type="text"
                placeholder="e.g., aaaaa-aa..."
                value={principalId}
                onChange={(e) => handlePrincipalChange(e.target.value)}
                onBlur={() => validatePrincipal(principalId)}
                disabled={isPending}
                className={principalError ? 'border-destructive' : ''}
              />
              {principalError && (
                <p className="text-sm text-destructive">{principalError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The unique identifier of the user receiving the credits
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">BTC Amount</Label>
              <Input
                id="amount"
                type="text"
                placeholder="0.00000000"
                value={btcAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                onBlur={() => validateAmount(btcAmount)}
                disabled={isPending}
                className={amountError ? 'border-destructive' : ''}
              />
              {amountError && (
                <p className="text-sm text-destructive">{amountError}</p>
              )}
              {btcAmount && !amountError && btcAmountBigInt > 0n && (
                <div className="mt-2">
                  <UsdEstimateLine btcAmount={btcAmountBigInt} btcPriceUsd={null} />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Supports up to 8 decimal places (satoshi precision)
              </p>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isPending || !!principalError || !!amountError}
            >
              {isPending ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
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

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• The specified BTC amount will be added to the user's balance immediately</p>
          <p>• A transaction record will be created in the user's history</p>
          <p>• The transaction will be marked as a "Credit Purchase" type</p>
          <p>• No blockchain transaction is involved - this is an internal credit operation</p>
        </CardContent>
      </Card>
    </div>
  );
}
