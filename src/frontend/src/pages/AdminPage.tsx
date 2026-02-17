import { useState } from 'react';
import { useGetCallerBalance, useTransferCreditsToUser, useGetTransactionHistory } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Coins, Send, Copy, Check, User, History } from 'lucide-react';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function AdminPage() {
  const { identity } = useInternetIdentity();
  const { data: balance, isLoading: balanceLoading } = useGetCallerBalance();
  const { data: transactions } = useGetTransactionHistory();
  const transferCredits = useTransferCreditsToUser();

  const [recipientPrincipal, setRecipientPrincipal] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [principalError, setPrincipalError] = useState('');
  const [copiedPrincipal, setCopiedPrincipal] = useState(false);

  const adminPrincipal = identity?.getPrincipal().toString() || '';

  const validatePrincipal = (value: string): boolean => {
    if (!value.trim()) {
      setPrincipalError('Principal is required');
      return false;
    }
    try {
      Principal.fromText(value);
      setPrincipalError('');
      return true;
    } catch (error) {
      setPrincipalError('Invalid principal format');
      return false;
    }
  };

  const handleCopyPrincipal = async () => {
    try {
      await navigator.clipboard.writeText(adminPrincipal);
      setCopiedPrincipal(true);
      toast.success('Principal copied to clipboard');
      setTimeout(() => setCopiedPrincipal(false), 2000);
    } catch (error) {
      toast.error('Failed to copy principal');
    }
  };

  const handleTransferCredits = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePrincipal(recipientPrincipal)) {
      return;
    }

    const amount = parseInt(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    if (balance && BigInt(amount) > balance) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      const principal = Principal.fromText(recipientPrincipal);
      await transferCredits.mutateAsync({
        user: principal,
        amount: BigInt(amount),
      });
      setRecipientPrincipal('');
      setTransferAmount('');
    } catch (error) {
      // Error already handled by mutation
    }
  };

  // Filter admin transfer transactions
  const adminTransfers = transactions?.filter(
    (tx) => tx.id.startsWith('ADMIN_TRANSFER_DEBIT_') || tx.id.startsWith('ADMIN_TRANSFER_CREDIT_')
  ) || [];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">Credit Distribution</h1>
        </div>
        <p className="text-muted-foreground">
          Manage and distribute credits to users from your admin account
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="financial-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Coins className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <div className="stat-value text-primary">{balance?.toString() || '0'} BTC</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Credits available to distribute</p>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Admin Principal</CardTitle>
            <User className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                {adminPrincipal}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyPrincipal}
                className="h-8 w-8 flex-shrink-0"
              >
                {copiedPrincipal ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Your identity on the network</p>
          </CardContent>
        </Card>
      </div>

      <Card className="financial-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Transfer Credits to User
          </CardTitle>
          <CardDescription>
            Send credits from your admin balance to any user principal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTransferCredits} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Principal</Label>
              <Input
                id="recipient"
                type="text"
                placeholder="Enter user principal (e.g., aaaaa-aa...)"
                value={recipientPrincipal}
                onChange={(e) => {
                  setRecipientPrincipal(e.target.value);
                  if (principalError) {
                    validatePrincipal(e.target.value);
                  }
                }}
                onBlur={() => validatePrincipal(recipientPrincipal)}
                className={principalError ? 'border-destructive' : ''}
              />
              {principalError && (
                <p className="text-sm text-destructive">{principalError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Ask the user to provide their principal ID from their profile
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (BTC Credits)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                placeholder="Enter amount"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
              {balance && (
                <p className="text-xs text-muted-foreground">
                  Available balance: {balance.toString()} BTC
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={transferCredits.isPending || !recipientPrincipal || !transferAmount}
              className="w-full"
            >
              {transferCredits.isPending ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Transferring...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Transfer Credits
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {adminTransfers.length > 0 && (
        <Card className="financial-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Admin Transfers
            </CardTitle>
            <CardDescription>
              Your latest credit distribution transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {adminTransfers.slice(0, 5).map((tx) => {
                const isDebit = tx.id.startsWith('ADMIN_TRANSFER_DEBIT_');
                const recipientPrincipal = tx.id.replace('ADMIN_TRANSFER_DEBIT_', '').replace('ADMIN_TRANSFER_CREDIT_', '');
                
                return (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={isDebit ? "destructive" : "default"} className="text-xs">
                          {isDebit ? 'Sent' : 'Received'}
                        </Badge>
                        <span className="text-sm font-medium">
                          {isDebit ? '-' : '+'}{tx.amount.toString()} BTC
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {isDebit ? 'To: ' : 'From: '}
                        <code className="bg-muted px-1 rounded">{recipientPrincipal.slice(0, 20)}...</code>
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground ml-4">
                      {new Date(Number(tx.timestamp) / 1000000).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="financial-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-sm">How to Distribute Credits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs">
              1
            </div>
            <div>
              <p className="font-medium">Initial Credits</p>
              <p className="text-muted-foreground text-xs">
                Your admin account automatically receives 500 credits on first use (one-time grant)
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs">
              2
            </div>
            <div>
              <p className="font-medium">Get User Principal</p>
              <p className="text-muted-foreground text-xs">
                Ask the user to provide their principal ID (they can find it in their profile or browser console)
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs">
              3
            </div>
            <div>
              <p className="font-medium">Transfer Credits</p>
              <p className="text-muted-foreground text-xs">
                Enter the recipient's principal and amount, then submit the transfer. Credits will be deducted from your balance and added to theirs.
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs">
              4
            </div>
            <div>
              <p className="font-medium">Track Transfers</p>
              <p className="text-muted-foreground text-xs">
                View all your admin transfers in the transaction history above or on the History page
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
