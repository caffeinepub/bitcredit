import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRecordBitcoinPurchase, useGetCallerBalance } from '../../hooks/useQueries';
import { Loader2, CheckCircle2 } from 'lucide-react';
import UsdEstimateLine from '../balance/UsdEstimateLine';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function InstantFundingForm() {
  const [txid, setTxid] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<{ txid?: string; amount?: string }>({});
  const [showSuccess, setShowSuccess] = useState(false);

  const { data: balance } = useGetCallerBalance();
  const recordPurchase = useRecordBitcoinPurchase();

  const validateTxid = (value: string): boolean => {
    const txidRegex = /^[0-9a-fA-F]{64}$/;
    if (!value) {
      setErrors(prev => ({ ...prev, txid: 'Transaction ID is required' }));
      return false;
    }
    if (!txidRegex.test(value)) {
      setErrors(prev => ({ ...prev, txid: 'Transaction ID must be exactly 64 hexadecimal characters' }));
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
    setShowSuccess(false);

    const isTxidValid = validateTxid(txid);
    const isAmountValid = validateAmount(amount);

    if (!isTxidValid || !isAmountValid) {
      return;
    }

    const btcAmount = parseFloat(amount);
    const satoshis = Math.round(btcAmount * 100_000_000);

    try {
      await recordPurchase.mutateAsync({
        transactionId: txid,
        amount: BigInt(satoshis),
      });

      setShowSuccess(true);
      setTxid('');
      setAmount('');
      setErrors({});

      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      // Error handling is done in the mutation hook
    }
  };

  const currentBalance = balance ? Number(balance) / 100_000_000 : 0;
  const enteredAmount = amount ? parseFloat(amount) : 0;
  const enteredSatoshis = enteredAmount ? BigInt(Math.round(enteredAmount * 100_000_000)) : 0n;

  return (
    <div className="space-y-6">
      {showSuccess && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Instant Funding Complete!</strong> Your balance has been immediately credited with ₿ {enteredAmount.toFixed(8)}. The funds are available now.
          </AlertDescription>
        </Alert>
      )}

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
          <p className="text-xs text-muted-foreground">
            The transaction ID from your Bitcoin purchase
          </p>
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
          {enteredAmount > 0 && (
            <UsdEstimateLine btcAmount={enteredSatoshis} btcPriceUsd={null} />
          )}
          <p className="text-xs text-muted-foreground">
            Enter the BTC amount you purchased (up to 8 decimal places)
          </p>
        </div>

        <Button
          type="submit"
          disabled={recordPurchase.isPending}
          className="w-full"
        >
          {recordPurchase.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Submit & Fund Account Instantly'
          )}
        </Button>
      </form>
    </div>
  );
}
