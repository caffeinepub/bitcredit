import { useState } from 'react';
import { useGetCallerBalance, useTransferCreditsToUser, useGetTransactionHistory, useSendBTC, useGetEstimatedNetworkFee } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Coins, Send, Copy, Check, User, History, Wallet, AlertCircle, Loader2, XCircle, CheckCircle } from 'lucide-react';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from '@tanstack/react-router';

export default function AdminPage() {
  const { identity } = useInternetIdentity();
  const { data: balance, isLoading: balanceLoading } = useGetCallerBalance();
  const { data: transactions } = useGetTransactionHistory();
  const transferCredits = useTransferCreditsToUser();
  const sendBTC = useSendBTC();
  const navigate = useNavigate();

  const [recipientPrincipal, setRecipientPrincipal] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [principalError, setPrincipalError] = useState('');
  const [copiedPrincipal, setCopiedPrincipal] = useState(false);

  // BTC mainnet wallet send state
  const [btcDestination, setBtcDestination] = useState('');
  const [btcAmount, setBtcAmount] = useState('');
  const [successRequestId, setSuccessRequestId] = useState<bigint | null>(null);

  const adminPrincipal = identity?.getPrincipal().toString() || '';

  // Fee estimation for BTC send
  const requestedBtcAmount = btcAmount && Number(btcAmount) > 0 ? BigInt(btcAmount) : BigInt(0);
  const { data: estimatedFee, isLoading: feeLoading, error: feeError } = useGetEstimatedNetworkFee(
    btcDestination.trim(),
    requestedBtcAmount
  );

  const availableBalance = balance ? Number(balance) : 0;
  const receiverAmount = Number(requestedBtcAmount);
  const networkFee = estimatedFee ? Number(estimatedFee) : 0;
  const totalDeducted = receiverAmount + networkFee;
  const insufficientFunds = totalDeducted > availableBalance;

  // Check if broadcast is unavailable based on fee error
  const broadcastUnavailable = feeError && feeError.message.toLowerCase().includes('btc_api_disabled');

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

  const handleSendBTC = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!btcDestination.trim()) {
      toast.error('Please enter a Bitcoin address');
      return;
    }

    const amount = parseInt(btcAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    if (insufficientFunds) {
      toast.error(`Insufficient balance. Required: ${totalDeducted} BTC, Available: ${availableBalance} BTC`);
      return;
    }

    if (feeError) {
      toast.error('Cannot send BTC: network fee unavailable');
      return;
    }

    try {
      const requestId = await sendBTC.mutateAsync({
        destination: btcDestination.trim(),
        amount: BigInt(amount),
      });
      if (requestId !== null) {
        setSuccessRequestId(requestId);
        setBtcDestination('');
        setBtcAmount('');
      }
    } catch (error) {
      // Error already handled by mutation with normalized message
    }
  };

  const handleViewHistory = () => {
    navigate({ to: '/history' });
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
          <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground">
          Manage credits, distribute to users, and send BTC to mainnet wallets
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
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Send BTC to Mainnet Wallet
          </CardTitle>
          <CardDescription>
            Send Bitcoin to any mainnet wallet — posted on the Bitcoin blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendBTC} className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                All transactions are posted on the Bitcoin blockchain. Bitcoin network fees are deducted from your credits.
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
              <Label htmlFor="btc-destination">Destination Bitcoin Address</Label>
              <Input
                id="btc-destination"
                type="text"
                placeholder="Enter Bitcoin mainnet address (e.g., bc1q...)"
                value={btcDestination}
                onChange={(e) => setBtcDestination(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                The Bitcoin mainnet address where you want to send funds
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="btc-amount">Amount (BTC)</Label>
              <Input
                id="btc-amount"
                type="number"
                min="1"
                step="1"
                placeholder="Enter amount to send"
                value={btcAmount}
                onChange={(e) => setBtcAmount(e.target.value)}
              />
              <div className="flex items-center justify-between text-xs">
                <p className="text-muted-foreground">
                  Amount receiver will get (1 credit = 1 BTC)
                </p>
              </div>
            </div>

            {btcDestination.trim() && requestedBtcAmount > BigInt(0) && (
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

            {sendBTC.isError && sendBTC.error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {sendBTC.error.message}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={sendBTC.isPending || insufficientFunds || !btcDestination.trim() || !btcAmount || feeLoading || !!feeError}
            >
              <Send className="h-4 w-4 mr-2" />
              {sendBTC.isPending ? 'Creating Request...' : 'Create Transfer Request'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card className="financial-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Transfer Credits to User
          </CardTitle>
          <CardDescription>
            Distribute credits from your admin balance to any user principal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTransferCredits} className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This transfers credits internally within the system. No blockchain transaction is involved.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Principal ID</Label>
              <Input
                id="recipient"
                type="text"
                placeholder="Enter user principal (e.g., xxxxx-xxxxx-xxxxx-xxxxx-xxx)"
                value={recipientPrincipal}
                onChange={(e) => {
                  setRecipientPrincipal(e.target.value);
                  if (principalError) validatePrincipal(e.target.value);
                }}
                className={`font-mono text-sm ${principalError ? 'border-destructive' : ''}`}
              />
              {principalError && (
                <p className="text-xs text-destructive">{principalError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The principal ID of the user who will receive the credits
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-amount">Amount (BTC)</Label>
              <Input
                id="transfer-amount"
                type="number"
                min="1"
                step="1"
                placeholder="Enter amount to transfer"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
              <div className="flex items-center justify-between text-xs">
                <p className="text-muted-foreground">
                  Credits to transfer (1 credit = 1 BTC)
                </p>
                <p className="text-muted-foreground">
                  Available: {balance?.toString() || '0'} BTC
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={transferCredits.isPending || !recipientPrincipal.trim() || !transferAmount}
            >
              <Send className="h-4 w-4 mr-2" />
              {transferCredits.isPending ? 'Transferring...' : 'Transfer Credits'}
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
              Your recent credit distribution and BTC transfer activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {adminTransfers.slice(0, 10).map((tx) => {
                const isDebit = tx.id.startsWith('ADMIN_TRANSFER_DEBIT_');
                const targetPrincipal = tx.id.replace('ADMIN_TRANSFER_DEBIT_', '').replace('ADMIN_TRANSFER_CREDIT_', '');
                
                return (
                  <div
                    key={`${tx.id}-${tx.timestamp}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={isDebit ? 'secondary' : 'default'}>
                          {isDebit ? 'Sent' : 'Received'}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">
                          {targetPrincipal.substring(0, 20)}...
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(Number(tx.timestamp) / 1_000_000).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`text-sm font-semibold ${isDebit ? 'text-muted-foreground' : 'text-chart-1'}`}>
                        {isDebit ? '-' : '+'}
                        {tx.amount.toString()} BTC
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="financial-card bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Admin Capabilities</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Send BTC to any Bitcoin mainnet wallet (when broadcast service is available)</li>
            <li>Transfer credits to any user principal</li>
            <li>View all transaction history across the system</li>
            <li>Initial 500 credits granted automatically on first admin use</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
