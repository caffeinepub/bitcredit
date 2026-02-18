import { useState } from 'react';
import { useGetCallerBalance, useSubmitWithdrawalRequest, useGetUserWithdrawalRequests, useGetCurrentBtcPriceUsd } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, Loader2, Info, AlertCircle } from 'lucide-react';
import WithdrawalHistoryList from '../components/withdrawals/WithdrawalHistoryList';
import ExternalPayoutApisDeveloperNote from '../components/withdrawals/ExternalPayoutApisDeveloperNote';
import { useFundedWithdrawalNotifications } from '../hooks/useFundedWithdrawalNotifications';

export default function WithdrawPage() {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [account, setAccount] = useState('');
  const [requestId, setRequestId] = useState<bigint | null>(null);

  const { data: balance } = useGetCallerBalance();
  const { data: withdrawalRequests } = useGetUserWithdrawalRequests();
  const { data: btcPriceUsd } = useGetCurrentBtcPriceUsd();
  const { mutate: submitWithdrawal, isPending } = useSubmitWithdrawalRequest();

  // Enable funded withdrawal notifications
  useFundedWithdrawalNotifications(withdrawalRequests);

  const availableBalance = balance ? Number(balance) : 0;
  const requestedAmount = amount && Number(amount) > 0 ? Number(amount) : 0;
  const insufficientFunds = requestedAmount > availableBalance;

  const estimatedUsdValue = btcPriceUsd && requestedAmount > 0 
    ? (requestedAmount * btcPriceUsd).toFixed(2)
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount && Number(amount) > 0 && method.trim() && !insufficientFunds) {
      const amountBigInt = BigInt(amount);
      const accountValue = account.trim() || null;
      
      submitWithdrawal(
        { amount: amountBigInt, method: method.trim(), account: accountValue },
        {
          onSuccess: (id) => {
            setRequestId(id);
            setAmount('');
            setMethod('');
            setAccount('');
          },
        }
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Withdraw Credits</h1>
        <p className="text-muted-foreground">
          Request a manual payout to convert your credits to external funds
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Manual Processing:</strong> Withdrawal requests are processed manually by administrators outside of this application. After you submit a request, an administrator will review it and process the payout externally (via PayPal, bank transfer, or other methods). Once the external payout is completed, the administrator will mark your request as "Paid" in the system. This is an administrative audit record—the app does not automatically send funds or execute external payment API calls.
        </AlertDescription>
      </Alert>

      <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-900 dark:text-amber-100">
          <strong>Important:</strong> Timing is not guaranteed. Payouts depend on external processing and on-chain settlement where applicable. The app does not guarantee instant delivery of funds. Status changes in the app reflect administrative records, not automated payment actions.
        </AlertDescription>
      </Alert>

      <Card className="financial-card">
        <CardHeader>
          <CardTitle>Submit Withdrawal Request</CardTitle>
          <CardDescription>
            Request a payout from your available balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (BTC credits)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="e.g., 100000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isPending}
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Available: {availableBalance.toLocaleString()} BTC</span>
                {estimatedUsdValue && (
                  <span className="italic">≈ ${estimatedUsdValue} USD (estimate only)</span>
                )}
              </div>
              {insufficientFunds && (
                <p className="text-sm text-destructive">Insufficient balance</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Payout Method</Label>
              <Input
                id="method"
                type="text"
                placeholder="e.g., PayPal, Bank Transfer, Venmo"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Specify how you'd like to receive your payout
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">Account/Email (optional)</Label>
              <Input
                id="account"
                type="text"
                placeholder="e.g., user@example.com or account number"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Provide account details for the administrator to process your payout
              </p>
            </div>

            <Button
              type="submit"
              disabled={
                isPending ||
                !amount ||
                Number(amount) <= 0 ||
                !method.trim() ||
                insufficientFunds
              }
              className="w-full"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Submit Withdrawal Request
                </>
              )}
            </Button>
          </form>

          {requestId !== null && (
            <Alert className="mt-4 border-green-500 bg-green-50 dark:bg-green-950">
              <Info className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <strong>Request submitted successfully!</strong>
                <br />
                Request ID: <code className="font-mono text-xs bg-green-100 dark:bg-green-900 px-1 py-0.5 rounded">{requestId.toString()}</code>
                <br />
                <span className="text-sm mt-1 block">
                  Your withdrawal request has been submitted and is pending administrator review. You will be notified once it has been processed.
                </span>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <ExternalPayoutApisDeveloperNote context="user" />

      <Card className="financial-card">
        <CardHeader>
          <CardTitle>Your Withdrawal History</CardTitle>
          <CardDescription>Track the status of your payout requests</CardDescription>
        </CardHeader>
        <CardContent>
          <WithdrawalHistoryList requests={withdrawalRequests || []} />
        </CardContent>
      </Card>
    </div>
  );
}
