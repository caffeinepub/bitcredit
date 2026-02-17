import { useState } from 'react';
import { useSendBTC, useGetCallerBalance, useGetEstimatedNetworkFee } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, AlertCircle, Wallet, Loader2, XCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

export default function SendBtcPage() {
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [successRequestId, setSuccessRequestId] = useState<bigint | null>(null);
  const navigate = useNavigate();
  
  const { mutate: sendBTC, isPending, isError, error } = useSendBTC();
  const { data: balance } = useGetCallerBalance();

  const requestedAmount = amount && Number(amount) > 0 ? BigInt(amount) : BigInt(0);
  const { data: estimatedFee, isLoading: feeLoading, error: feeError } = useGetEstimatedNetworkFee(
    destination.trim(),
    requestedAmount
  );

  const availableBalance = balance ? Number(balance) : 0;
  const receiverAmount = Number(requestedAmount);
  const networkFee = estimatedFee ? Number(estimatedFee) : 0;
  const totalDeducted = receiverAmount + networkFee;
  const insufficientFunds = totalDeducted > availableBalance;

  // Check if broadcast is unavailable based on fee error
  const broadcastUnavailable = feeError && feeError.message.toLowerCase().includes('btc_api_disabled');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (destination.trim() && amount && Number(amount) > 0 && !insufficientFunds && !feeError) {
      sendBTC(
        { destination: destination.trim(), amount: BigInt(amount) },
        {
          onSuccess: (requestId) => {
            if (requestId !== null) {
              setSuccessRequestId(requestId);
              setDestination('');
              setAmount('');
            }
          },
        }
      );
    }
  };

  const handleViewHistory = () => {
    navigate({ to: '/history' });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Send BTC</h1>
        <p className="text-muted-foreground">
          Transfer Bitcoin from your app wallet balance to any Bitcoin mainnet address
        </p>
      </div>

      <Card className="financial-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>App Wallet Balance</CardTitle>
              <CardDescription>Credits available to send as Bitcoin mainnet transfers</CardDescription>
            </div>
            <Wallet className="h-8 w-8 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="stat-value text-primary">{balance?.toString() || '0'} BTC</div>
          <p className="text-sm text-muted-foreground mt-1">Available in your app wallet</p>
        </CardContent>
      </Card>

      {successRequestId !== null && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Transfer request created successfully!</strong>
            <br />
            Request ID: <code className="font-mono text-xs bg-green-100 dark:bg-green-900 px-1 py-0.5 rounded">{successRequestId.toString()}</code>
            <br />
            <Button
              variant="link"
              className="h-auto p-0 text-green-700 dark:text-green-300 underline mt-1"
              onClick={handleViewHistory}
            >
              View transfer details and status in History →
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card className="financial-card">
        <CardHeader>
          <CardTitle>Create Transfer Request</CardTitle>
          <CardDescription>
            Send BTC from your app wallet balance to an external Bitcoin mainnet address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Transfers are sent from your app wallet balance (credits) to the Bitcoin blockchain. Network fees are deducted from your credits. This is an app-managed wallet — you do not control private keys.
              </AlertDescription>
            </Alert>

            {broadcastUnavailable && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Broadcast service unavailable:</strong> The Bitcoin broadcast service is currently disabled. Transactions cannot be posted to the blockchain at this time. Any transfer attempts will fail and your credits will be automatically restored.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="destination">Destination Bitcoin Address</Label>
              <Input
                id="destination"
                type="text"
                placeholder="Enter Bitcoin mainnet address (e.g., bc1q...)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                The external Bitcoin mainnet address where you want to send funds
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (BTC)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="1"
                placeholder="Enter amount to send"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <div className="flex items-center justify-between text-xs">
                <p className="text-muted-foreground">
                  Amount receiver will get (1 credit = 1 BTC)
                </p>
              </div>
            </div>

            {destination.trim() && requestedAmount > BigInt(0) && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <h4 className="font-semibold text-sm">Transaction Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Receiver gets:</span>
                    <span className="font-semibold">{receiverAmount} BTC</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Bitcoin network fee:</span>
                    {feeLoading ? (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Loading...
                      </span>
                    ) : feeError ? (
                      <span className="text-destructive text-xs">Fee unavailable</span>
                    ) : (
                      <span className="font-semibold">{networkFee} BTC</span>
                    )}
                  </div>
                  <div className="pt-2 border-t flex justify-between items-center">
                    <span className="font-semibold">Total deducted from your app wallet:</span>
                    <span className="font-bold text-lg">{totalDeducted} BTC</span>
                  </div>
                </div>
                {insufficientFunds && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Insufficient balance. You need {totalDeducted} BTC but only have {availableBalance} BTC available in your app wallet.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {isError && error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {error.message}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isPending || insufficientFunds || !destination.trim() || !amount || feeLoading || !!feeError}
            >
              <Send className="h-4 w-4 mr-2" />
              {isPending ? 'Creating Request...' : 'Send BTC from App Wallet'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
