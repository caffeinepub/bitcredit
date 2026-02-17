import { useState, useEffect } from 'react';
import { useSendBTC, useGetCallerBalance, useGetEstimatedNetworkFee } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, AlertCircle, CheckCircle2, Wallet, Loader2 } from 'lucide-react';

export default function SendBtcPage() {
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const { mutate: sendBTC, isPending, isSuccess } = useSendBTC();
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (destination.trim() && amount && Number(amount) > 0 && !insufficientFunds && !feeError) {
      sendBTC(
        { destination: destination.trim(), amount: BigInt(amount) },
        {
          onSuccess: () => {
            setDestination('');
            setAmount('');
          },
        }
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Send BTC</h1>
        <p className="text-muted-foreground">
          Create a transfer request to send Bitcoin to any mainnet wallet
        </p>
      </div>

      <Card className="financial-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Available Balance</CardTitle>
              <CardDescription>BTC-denominated credits ready to transfer</CardDescription>
            </div>
            <Wallet className="h-8 w-8 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="stat-value text-primary">{balance?.toString() || '0'} BTC</div>
          <p className="text-sm text-muted-foreground mt-1">Available for transfer</p>
        </CardContent>
      </Card>

      <Card className="financial-card">
        <CardHeader>
          <CardTitle>Create Transfer Request</CardTitle>
          <CardDescription>
            Enter the destination Bitcoin address and amount to transfer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Transactions go directly to the receiver's wallet on the Bitcoin blockchain. Network fees are deducted from your credits.
              </AlertDescription>
            </Alert>

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
                The Bitcoin mainnet address where you want to send funds
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
                    <span className="text-muted-foreground">Estimated network fee:</span>
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
                    <span className="font-semibold">Total deducted from credits:</span>
                    <span className="font-bold text-lg">{totalDeducted} BTC</span>
                  </div>
                </div>
                {insufficientFunds && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Insufficient balance. You need {totalDeducted} BTC but only have {availableBalance} BTC available.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {isSuccess && (
              <Alert className="border-chart-1 bg-chart-1/10">
                <CheckCircle2 className="h-4 w-4 text-chart-1" />
                <AlertDescription className="text-chart-1">
                  Transfer request created successfully! Credits have been reserved. Check History to verify the transaction.
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isPending || insufficientFunds || !destination.trim() || !amount || feeLoading || !!feeError}
            >
              <Send className="h-4 w-4 mr-2" />
              {isPending ? 'Creating Request...' : 'Create Transfer Request'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm">What happens next:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Your credits are reserved for this transfer (amount + network fee)</li>
              <li>A transfer request is created with status "IN_PROGRESS"</li>
              <li>Complete the Bitcoin transaction on-chain</li>
              <li>Submit the blockchain transaction ID in History to verify</li>
              <li>Once verified, the transfer status updates to "VERIFIED"</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
