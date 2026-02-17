import { useState } from 'react';
import { usePurchaseCredits, useGetCallerBalance } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Coins, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function BuyCreditsPage() {
  const [transactionId, setTransactionId] = useState('');
  const [amount, setAmount] = useState('');
  const { mutate: purchaseCredits, isPending, isSuccess } = usePurchaseCredits();
  const { data: balance } = useGetCallerBalance();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transactionId.trim() && amount && Number(amount) > 0) {
      purchaseCredits(
        { transactionId: transactionId.trim(), amount: BigInt(amount) },
        {
          onSuccess: () => {
            setTransactionId('');
            setAmount('');
          },
        }
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Buy Credits</h1>
        <p className="text-muted-foreground">
          Purchase Bitcoin credits by verifying your mainnet transaction
        </p>
      </div>

      <Card className="financial-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Balance</CardTitle>
              <CardDescription>Your available credits</CardDescription>
            </div>
            <Coins className="h-8 w-8 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="stat-value text-primary">{balance?.toString() || '0'} BTC</div>
          <p className="text-sm text-muted-foreground mt-1">1 credit = 1 Bitcoin</p>
        </CardContent>
      </Card>

      <Card className="financial-card">
        <CardHeader>
          <CardTitle>Purchase Credits</CardTitle>
          <CardDescription>
            Submit your Bitcoin mainnet transaction ID to verify and receive credits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your transaction will be verified via blockchain API. Only confirmed mainnet transactions will be accepted.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="txid">Bitcoin Transaction ID (txid)</Label>
              <Input
                id="txid"
                type="text"
                placeholder="Enter your Bitcoin mainnet transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                required
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                The transaction ID from your Bitcoin wallet or block explorer
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Credit Amount (BTC)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="1"
                placeholder="Enter amount of credits to purchase"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Number of credits you expect to receive (must match transaction value)
              </p>
            </div>

            {isSuccess && (
              <Alert className="border-chart-1 bg-chart-1/10">
                <CheckCircle2 className="h-4 w-4 text-chart-1" />
                <AlertDescription className="text-chart-1">
                  Credits purchased successfully! Your balance has been updated.
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? 'Verifying Transaction...' : 'Purchase Credits'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2">
            <h4 className="font-semibold text-sm">How it works:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Send Bitcoin to the designated address from your wallet</li>
              <li>Copy the transaction ID from your wallet or block explorer</li>
              <li>Paste the transaction ID and specify the amount here</li>
              <li>We verify the transaction on the Bitcoin blockchain</li>
              <li>Credits are added to your account after verification</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
