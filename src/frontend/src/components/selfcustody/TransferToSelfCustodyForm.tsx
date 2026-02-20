import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Send } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetSelfCustodyWallets, useGetCallerBalance, useCreateSelfCustodyTransfer } from '@/hooks/useQueries';
import { toast } from 'sonner';
import { normalizeError } from '@/utils/errors';
import SelfCustodyTransferSuccess from './SelfCustodyTransferSuccess';
import UsdEstimateLine from '@/components/balance/UsdEstimateLine';

export default function TransferToSelfCustodyForm() {
  const [amount, setAmount] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ transferId: string; address: string; amount: string } | null>(
    null
  );

  const { data: wallets, isLoading: walletsLoading } = useGetSelfCustodyWallets();
  const { data: balance, isLoading: balanceLoading } = useGetCallerBalance();
  const createTransfer = useCreateSelfCustodyTransfer();

  const formatBtc = (satoshis: bigint) => {
    return (Number(satoshis) / 100000000).toFixed(8);
  };

  const parseBtcToSatoshis = (btc: string): bigint => {
    const btcNumber = parseFloat(btc);
    if (isNaN(btcNumber) || btcNumber <= 0) return BigInt(0);
    return BigInt(Math.floor(btcNumber * 100000000));
  };

  const validateAmount = (value: string): boolean => {
    if (!value) return false;
    const btcNumber = parseFloat(value);
    if (isNaN(btcNumber) || btcNumber <= 0) return false;

    // Check max 8 decimal places
    const decimalPart = value.split('.')[1];
    if (decimalPart && decimalPart.length > 8) return false;

    // Check against balance
    const satoshis = parseBtcToSatoshis(value);
    if (balance && satoshis > balance) return false;

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAmount(amount)) {
      toast.error('Invalid amount', {
        description: 'Please enter a valid BTC amount (max 8 decimals) within your balance.',
      });
      return;
    }

    if (!selectedWallet) {
      toast.error('No wallet selected', {
        description: 'Please select a destination wallet.',
      });
      return;
    }

    try {
      const satoshis = parseBtcToSatoshis(amount);
      const result = await createTransfer.mutateAsync({
        amount: satoshis,
        destinationAddress: selectedWallet,
      });

      setSuccessData({
        transferId: result.transferId,
        address: selectedWallet,
        amount: amount,
      });
      setShowSuccess(true);
      setAmount('');
      setSelectedWallet('');
    } catch (error: any) {
      const errorMessage = normalizeError(error);
      toast.error('Transfer Failed', {
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  const handleReset = () => {
    setShowSuccess(false);
    setSuccessData(null);
  };

  if (showSuccess && successData) {
    return <SelfCustodyTransferSuccess onReset={handleReset} transferData={successData} />;
  }

  const hasWallets = wallets && wallets.length > 0;
  const isFormDisabled = walletsLoading || balanceLoading || !hasWallets;

  return (
    <div className="space-y-4">
      <Alert className="border-amber-500/50 bg-amber-500/10">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Backend Implementation Required:</strong> The self-custody transfer feature requires backend support
          that is not yet implemented. This includes validating platform balance, debiting the balance, creating
          transfer records with pending status, and returning transfer confirmation details.
        </AlertDescription>
      </Alert>

      {!hasWallets && !walletsLoading && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You need to generate at least one self-custody wallet before you can transfer funds.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="destination">Destination Wallet</Label>
          <Select value={selectedWallet} onValueChange={setSelectedWallet} disabled={isFormDisabled}>
            <SelectTrigger id="destination">
              <SelectValue placeholder="Select a self-custody wallet" />
            </SelectTrigger>
            <SelectContent>
              {wallets?.map((wallet, index) => (
                <SelectItem key={wallet.address} value={wallet.address}>
                  Wallet #{index + 1} - {wallet.address.slice(0, 8)}...{wallet.address.slice(-8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="amount">Amount (BTC)</Label>
          <Input
            id="amount"
            type="number"
            step="0.00000001"
            min="0"
            max={balance ? formatBtc(balance) : undefined}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00000000"
            disabled={isFormDisabled}
          />
          {balance && (
            <p className="text-xs text-muted-foreground mt-1">
              Available balance: {formatBtc(balance)} BTC
            </p>
          )}
          {amount && validateAmount(amount) && (
            <UsdEstimateLine btcAmount={parseBtcToSatoshis(amount)} btcPriceUsd={null} />
          )}
        </div>

        <Button type="submit" disabled={isFormDisabled || createTransfer.isPending} className="w-full gap-2">
          {createTransfer.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing Transfer...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Transfer to Self-Custody Wallet
            </>
          )}
        </Button>
      </form>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          This will transfer BTC from your platform balance to your selected self-custody wallet. The transfer will be
          recorded and tracked in your transfer history.
        </AlertDescription>
      </Alert>
    </div>
  );
}
