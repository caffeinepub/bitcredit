import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRecordBitcoinPurchase } from '../../hooks/useQueries';
import { normalizeError } from '../../utils/errors';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ManualVerificationForm() {
  const [txid, setTxid] = useState('');
  const [btcAmount, setBtcAmount] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const recordPurchase = useRecordBitcoinPurchase();

  const validateTxid = (value: string): string | null => {
    if (!value) return 'Transaction ID is required';
    if (value.length !== 64) return 'Transaction ID must be exactly 64 characters';
    if (!/^[0-9a-fA-F]+$/.test(value)) return 'Transaction ID must contain only hexadecimal characters (0-9, a-f)';
    return null;
  };

  const validateBtcAmount = (value: string): string | null => {
    if (!value) return 'BTC amount is required';
    const num = parseFloat(value);
    if (isNaN(num)) return 'Invalid BTC amount';
    if (num <= 0) return 'BTC amount must be greater than zero';
    if (num < 0) return 'BTC amount cannot be negative';
    
    // Check decimal places (max 8 for Bitcoin)
    const decimalParts = value.split('.');
    if (decimalParts.length > 1 && decimalParts[1].length > 8) {
      return 'BTC amount cannot have more than 8 decimal places';
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setSuccessMessage(null);

    // Frontend validation
    const txidError = validateTxid(txid);
    if (txidError) {
      setValidationError(txidError);
      return;
    }

    const amountError = validateBtcAmount(btcAmount);
    if (amountError) {
      setValidationError(amountError);
      return;
    }

    try {
      const btcFloat = parseFloat(btcAmount);
      const satoshis = Math.round(btcFloat * 100_000_000);

      await recordPurchase.mutateAsync({
        transactionId: txid,
        amount: BigInt(satoshis),
      });

      setSuccessMessage('Bitcoin purchase verified successfully! Balance updated.');
      setTxid('');
      setBtcAmount('');
    } catch (error: any) {
      const errorMessage = normalizeError(error);
      setValidationError(errorMessage);
    }
  };

  const isFormValid = txid.length === 64 && btcAmount && parseFloat(btcAmount) > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {successMessage && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {recordPurchase.isError && !validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {normalizeError(recordPurchase.error)}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="txid">Transaction ID (64 hex characters)</Label>
        <Input
          id="txid"
          type="text"
          value={txid}
          onChange={(e) => {
            setTxid(e.target.value);
            setValidationError(null);
            setSuccessMessage(null);
          }}
          placeholder="Enter 64-character transaction ID"
          disabled={recordPurchase.isPending}
          maxLength={64}
          className="font-mono text-sm"
        />
        {txid && txid.length !== 64 && (
          <p className="text-sm text-muted-foreground">
            {txid.length}/64 characters
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="btcAmount">BTC Amount (max 8 decimals)</Label>
        <Input
          id="btcAmount"
          type="number"
          step="0.00000001"
          min="0.00000001"
          value={btcAmount}
          onChange={(e) => {
            setBtcAmount(e.target.value);
            setValidationError(null);
            setSuccessMessage(null);
          }}
          placeholder="0.00000000"
          disabled={recordPurchase.isPending}
        />
      </div>

      <Button
        type="submit"
        disabled={recordPurchase.isPending || !isFormValid}
        className="w-full"
      >
        {recordPurchase.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying Purchase...
          </>
        ) : (
          'Verify Bitcoin Purchase'
        )}
      </Button>
    </form>
  );
}
