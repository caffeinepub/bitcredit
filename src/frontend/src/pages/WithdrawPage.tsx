import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useGetCallerBalance, useRequestWithdrawal } from '../hooks/useQueries';
import { toast } from 'sonner';
import { ArrowDownRight, CheckCircle } from 'lucide-react';
import UsdEstimateLine from '../components/balance/UsdEstimateLine';
import WithdrawalHistoryList from '../components/withdrawals/WithdrawalHistoryList';
import { useFundedWithdrawalNotifications } from '../hooks/useFundedWithdrawalNotifications';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function WithdrawPage() {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'PayPal' | 'Stripe'>('PayPal');
  const [accountDetails, setAccountDetails] = useState('');
  const [requestId, setRequestId] = useState<bigint | null>(null);

  const { data: balance, isLoading: balanceLoading } = useGetCallerBalance();
  const withdrawMutation = useRequestWithdrawal();

  useFundedWithdrawalNotifications();

  const btcBalance = balance ? Number(balance) / 100_000_000 : 0;
  const amountSatoshis = amount ? Math.floor(parseFloat(amount) * 100_000_000) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amountSatoshis > Number(balance || 0n)) {
      toast.error('Insufficient balance');
      return;
    }

    if (!accountDetails.trim()) {
      toast.error('Please enter account details');
      return;
    }

    try {
      const id = await withdrawMutation.mutateAsync({
        amount: BigInt(amountSatoshis),
        method: paymentMethod,
        account: accountDetails.trim(),
      });

      setRequestId(id);
      toast.success('Withdrawal request submitted successfully!');
      
      // Reset form
      setAmount('');
      setAccountDetails('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit withdrawal request');
    }
  };

  if (requestId !== null) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <CardTitle>Withdrawal Request Submitted</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Your withdrawal request has been submitted successfully.</p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">Request ID</p>
              <p className="font-mono font-bold">{requestId.toString()}</p>
            </div>
            <Alert>
              <AlertDescription>
                An administrator will review and process your request manually. You will be notified when your withdrawal is paid.
              </AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Button onClick={() => setRequestId(null)} variant="outline" className="flex-1">
                Submit Another Request
              </Button>
              <Button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="flex-1">
                View History
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Your Withdrawal History</h2>
          <WithdrawalHistoryList />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Withdraw Credits</h1>
        <p className="text-muted-foreground">Request withdrawal to external payment method</p>
      </div>

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Manual Processing:</strong> Withdrawal requests are reviewed and processed manually by administrators.
          Processing times may vary.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Your Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {balanceLoading ? (
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          ) : (
            <>
              <p className="text-2xl font-bold">₿ {btcBalance.toFixed(8)}</p>
              <UsdEstimateLine btcAmount={balance || 0n} btcPriceUsd={null} />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ArrowDownRight className="h-5 w-5" />
            <CardTitle>Withdrawal Request</CardTitle>
          </div>
          <CardDescription>Enter withdrawal details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (BTC)</Label>
              <Input
                id="amount"
                type="number"
                step="0.00000001"
                min="0"
                placeholder="0.00000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              {amount && parseFloat(amount) > 0 && (
                <p className="text-sm text-muted-foreground">
                  = {amountSatoshis.toLocaleString()} satoshis
                </p>
              )}
            </div>

            {amount && amountSatoshis > Number(balance || 0n) && (
              <p className="text-sm text-destructive">Insufficient balance</p>
            )}

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'PayPal' | 'Stripe')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PayPal" id="paypal" />
                  <Label htmlFor="paypal" className="cursor-pointer">PayPal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Stripe" id="stripe" />
                  <Label htmlFor="stripe" className="cursor-pointer">Stripe</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">
                {paymentMethod === 'PayPal' ? 'PayPal Email' : 'Stripe Account ID'}
              </Label>
              <Input
                id="account"
                placeholder={paymentMethod === 'PayPal' ? 'your@email.com' : 'acct_xxxxxxxxxxxxx'}
                value={accountDetails}
                onChange={(e) => setAccountDetails(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={withdrawMutation.isPending || !amount || !accountDetails}
            >
              {withdrawMutation.isPending ? 'Submitting...' : 'Submit Withdrawal Request'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4">Your Withdrawal History</h2>
        <WithdrawalHistoryList />
      </div>
    </div>
  );
}
