import { useState } from 'react';
import { useGetCallerBalance, useTransferCreditsToUser, useGetTransactionHistory, useSendBTC, useGetEstimatedNetworkFee, useGetReserveStatus, useManageReserve, useIsCallerAdmin } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Coins, Send, Copy, Check, User, Wallet, AlertCircle, Loader2, XCircle, CheckCircle, Database, TrendingUp, AlertTriangle } from 'lucide-react';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from '@tanstack/react-router';
import type { SendBTCRequest, ReserveManagementAction } from '../backend';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function AdminPage() {
  const { identity } = useInternetIdentity();
  const { data: balance, isLoading: balanceLoading } = useGetCallerBalance();
  const { data: transactions } = useGetTransactionHistory();
  const { data: isAdmin, isLoading: adminCheckLoading } = useIsCallerAdmin();
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
  const [transferOutcome, setTransferOutcome] = useState<{
    requestId: bigint;
    request: SendBTCRequest | null;
  } | null>(null);

  // Reserve management state
  const [reserveActionType, setReserveActionType] = useState<'deposit' | 'withdraw' | 'correction'>('deposit');
  const [reserveAmount, setReserveAmount] = useState('');
  const [reserveReason, setReserveReason] = useState('');

  const { data: reserveStatus, isLoading: reserveLoading } = useGetReserveStatus();
  const manageReserve = useManageReserve();

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
  const insufficientBalance = totalDeducted > availableBalance;

  const handleCopyPrincipal = async () => {
    try {
      await navigator.clipboard.writeText(adminPrincipal);
      setCopiedPrincipal(true);
      setTimeout(() => setCopiedPrincipal(false), 2000);
    } catch (err) {
      console.error('Failed to copy principal:', err);
    }
  };

  const handleTransferCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    setPrincipalError('');

    try {
      const principal = Principal.fromText(recipientPrincipal.trim());
      const amount = BigInt(transferAmount);

      if (amount <= BigInt(0)) {
        toast.error('Amount must be greater than 0');
        return;
      }

      await transferCredits.mutateAsync({ user: principal, amount });
      setRecipientPrincipal('');
      setTransferAmount('');
    } catch (error: any) {
      if (error.message.includes('Invalid principal')) {
        setPrincipalError('Invalid principal format');
      }
    }
  };

  const handleSendBTC = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferOutcome(null);

    try {
      const amount = BigInt(btcAmount);
      if (amount <= BigInt(0)) {
        toast.error('Amount must be greater than 0');
        return;
      }

      const result = await sendBTC.mutateAsync({
        destination: btcDestination.trim(),
        amount,
      });

      setTransferOutcome({
        requestId: result.requestId,
        request: result.transferRequest,
      });

      setBtcDestination('');
      setBtcAmount('');
    } catch (error) {
      // Error already handled by mutation
    }
  };

  const handleViewTransferDetails = () => {
    if (transferOutcome?.requestId) {
      sessionStorage.setItem('openTransferRequestId', transferOutcome.requestId.toString());
      navigate({ to: '/history' });
    }
  };

  const handleManageReserve = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = BigInt(reserveAmount);
    if (amount <= BigInt(0)) {
      toast.error('Amount must be greater than 0');
      return;
    }

    if (!reserveReason.trim()) {
      toast.error('Reason is required for reserve adjustments');
      return;
    }

    let action: ReserveManagementAction;
    if (reserveActionType === 'deposit') {
      action = { __kind__: 'deposit', deposit: amount };
    } else if (reserveActionType === 'withdraw') {
      action = { __kind__: 'withdraw', withdraw: amount };
    } else {
      action = { __kind__: 'correction', correction: amount };
    }

    try {
      await manageReserve.mutateAsync(action);
      setReserveAmount('');
      setReserveReason('');
    } catch (error) {
      // Error already handled by mutation
    }
  };

  const coverageRatio = reserveStatus?.coverageRatio !== undefined && reserveStatus.coverageRatio !== null
    ? (reserveStatus.coverageRatio * 100).toFixed(2)
    : null;

  const coverageStatus = coverageRatio !== null
    ? Number(coverageRatio) >= 100
      ? 'healthy'
      : Number(coverageRatio) >= 80
      ? 'warning'
      : 'critical'
    : 'unknown';

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground">
          Manage credits, transfers, and system reserves
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="financial-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Balance</CardTitle>
            <Coins className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {balanceLoading ? (
              <div className="h-8 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <div className="stat-value text-primary">{balance?.toString() || '0'} BTC</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Available credits</p>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <User className="h-5 w-5 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="stat-value">{transactions?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">System-wide activity</p>
          </CardContent>
        </Card>
      </div>

      <Card className="financial-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>Admin Identity</CardTitle>
          </div>
          <CardDescription>Your verified admin principal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="flex-1 p-3 bg-muted rounded-lg border border-border">
              <code className="text-sm font-mono break-all">{adminPrincipal}</code>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyPrincipal}
              className="shrink-0"
            >
              {copiedPrincipal ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {!adminCheckLoading && isAdmin && (
        <Card className="financial-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>Reserve Management</CardTitle>
            </div>
            <CardDescription>Monitor and adjust BTC reserve backing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {reserveLoading ? (
              <div className="space-y-3">
                <div className="h-20 bg-muted animate-pulse rounded" />
                <div className="h-20 bg-muted animate-pulse rounded" />
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Wallet className="h-4 w-4" />
                      <span>Reserve Balance</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                      {reserveStatus?.reserveBtcBalance.toString() || '0'} BTC
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Coins className="h-4 w-4" />
                      <span>Outstanding Credits</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {reserveStatus?.outstandingIssuedCredits.toString() || '0'} BTC
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TrendingUp className="h-4 w-4" />
                      <span>Coverage Ratio</span>
                    </div>
                    <div className={`text-2xl font-bold ${
                      coverageStatus === 'healthy' ? 'text-green-600' :
                      coverageStatus === 'warning' ? 'text-yellow-600' :
                      coverageStatus === 'critical' ? 'text-red-600' :
                      'text-muted-foreground'
                    }`}>
                      {coverageRatio !== null ? `${coverageRatio}%` : 'Not available'}
                    </div>
                  </div>
                </div>

                {coverageStatus === 'warning' && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Coverage ratio is below 100%. Consider depositing additional BTC to maintain full backing.
                    </AlertDescription>
                  </Alert>
                )}

                {coverageStatus === 'critical' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Critical: Coverage ratio is below 80%. Immediate action required to restore full reserve backing.
                    </AlertDescription>
                  </Alert>
                )}

                <Separator />

                <form onSubmit={handleManageReserve} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reserveActionType">Action Type</Label>
                    <Select
                      value={reserveActionType}
                      onValueChange={(value: 'deposit' | 'withdraw' | 'correction') => setReserveActionType(value)}
                    >
                      <SelectTrigger id="reserveActionType">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deposit">Deposit (Increase Reserve)</SelectItem>
                        <SelectItem value="withdraw">Withdraw (Decrease Reserve)</SelectItem>
                        <SelectItem value="correction">Correction (Set Exact Amount)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reserveAmount">
                      {reserveActionType === 'correction' ? 'New Reserve Amount (BTC)' : 'Amount (BTC)'}
                    </Label>
                    <Input
                      id="reserveAmount"
                      type="number"
                      placeholder="0"
                      value={reserveAmount}
                      onChange={(e) => setReserveAmount(e.target.value)}
                      required
                      min="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reserveReason">Reason (Required)</Label>
                    <Textarea
                      id="reserveReason"
                      placeholder="Explain the reason for this reserve adjustment..."
                      value={reserveReason}
                      onChange={(e) => setReserveReason(e.target.value)}
                      required
                      rows={3}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={manageReserve.isPending || !reserveAmount || !reserveReason.trim()}
                    className="w-full"
                  >
                    {manageReserve.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Database className="mr-2 h-4 w-4" />
                        {reserveActionType === 'deposit' ? 'Deposit to Reserve' :
                         reserveActionType === 'withdraw' ? 'Withdraw from Reserve' :
                         'Set Reserve Amount'}
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="financial-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <CardTitle>Transfer Credits to User</CardTitle>
          </div>
          <CardDescription>Send credits from your admin balance to any user</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTransferCredits} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipientPrincipal">Recipient Principal</Label>
              <Input
                id="recipientPrincipal"
                placeholder="Enter user principal ID"
                value={recipientPrincipal}
                onChange={(e) => {
                  setRecipientPrincipal(e.target.value);
                  setPrincipalError('');
                }}
                required
              />
              {principalError && (
                <p className="text-sm text-destructive">{principalError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="transferAmount">Amount (BTC)</Label>
              <Input
                id="transferAmount"
                type="number"
                placeholder="0"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                required
                min="1"
              />
            </div>

            <Button
              type="submit"
              disabled={transferCredits.isPending}
              className="w-full"
            >
              {transferCredits.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Transferring...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Transfer Credits
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="financial-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            <CardTitle>Send BTC to Mainnet Wallet</CardTitle>
          </div>
          <CardDescription>Transfer Bitcoin to any mainnet address</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendBTC} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="btcDestination">Destination Address</Label>
              <Input
                id="btcDestination"
                placeholder="Enter Bitcoin mainnet address"
                value={btcDestination}
                onChange={(e) => setBtcDestination(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="btcAmount">Amount (BTC)</Label>
              <Input
                id="btcAmount"
                type="number"
                placeholder="0"
                value={btcAmount}
                onChange={(e) => setBtcAmount(e.target.value)}
                required
                min="1"
              />
            </div>

            {requestedBtcAmount > BigInt(0) && btcDestination.trim() && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Receiver gets:</span>
                  <span className="font-medium">{receiverAmount} BTC</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Network fee:</span>
                  <span className="font-medium">
                    {feeLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin inline" />
                    ) : feeError ? (
                      <span className="text-destructive">Error</span>
                    ) : (
                      `${networkFee} BTC`
                    )}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total deducted:</span>
                  <span className={insufficientBalance ? 'text-destructive' : ''}>
                    {totalDeducted} BTC
                  </span>
                </div>
                {insufficientBalance && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Insufficient balance. You need {totalDeducted} BTC but only have {availableBalance} BTC.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={sendBTC.isPending || insufficientBalance || feeLoading}
              className="w-full"
            >
              {sendBTC.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send BTC
                </>
              )}
            </Button>
          </form>

          {transferOutcome && (
            <div className="mt-6 p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                {transferOutcome.request?.status === 'FAILED' ? (
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-2 flex-1">
                  <p className="font-medium">
                    {transferOutcome.request?.status === 'FAILED'
                      ? 'Transfer Request Created (Broadcast Failed)'
                      : 'Transfer Request Created'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Request ID: {transferOutcome.requestId.toString()}
                  </p>

                  {transferOutcome.request?.status === 'FAILED' && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="space-y-2">
                        <p className="font-medium">
                          {transferOutcome.request.failureReason || 'The transaction was not posted to the Bitcoin blockchain.'}
                        </p>
                        <p className="text-sm">
                          Your credits have been restored to your balance.
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewTransferDetails}
                    className="w-full"
                  >
                    View Details in History
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
