import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRecordBitcoinPurchase } from '../../hooks/useQueries';
import { Loader2 } from 'lucide-react';

export default function ManualVerificationForm() {
  const [txid, setTxid] = useState('');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<{ txid?: string; amount?: string }>({});

  const recordPurchase = useRecordBitcoinPurchase();

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
      await recordPurchase.mutateAsync({
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
        disabled={recordPurchase.isPending}
        className="w-full"
      >
        {recordPurchase.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Recording...
          </>
        ) : (
          'Verify Bitcoin Purchase'
        )}
      </Button>
    </form>
  );
}
