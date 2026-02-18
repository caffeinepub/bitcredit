import { useState } from 'react';
import { useGetCallerBalance, useTransferCreditsToUser, useGetTransactionHistory, useSendBTC, useGetEstimatedNetworkFee, useGetReserveStatus, useManageReserve, useIsCallerAdmin } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Coins, Send, Copy, Check, User, Wallet, AlertCircle, Loader2, XCircle, CheckCircle, Database, TrendingUp, AlertTriangle, Info } from 'lucide-react';
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

  const getAdminTransferOutcomeAlert = () => {
    if (!transferOutcome || !transferOutcome.request) return null;

    const { requestId, request } = transferOutcome;
    const isFailed = request.status === 'FAILED';
    const hasTxId = !!request.blockchainTxId;

    if (isFailed) {
      const failureMessage = request.failureReason 
        ? request.failureReason 
        : 'The transaction could not be broadcast.';
      
      return (
        <Alert className="border-destructive bg-destructive/10">
          <XCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            <strong>Transfer Failed</strong>
            <br />
            Request ID: <code className="font-mono text-xs bg-destructive/20 px-1 py-0.5 rounded">{requestId.toString()}</code>
            <br />
            <span className="text-sm mt-1 block font-semibold">
              This transaction was not posted to the Bitcoin blockchain.
            </span>
            <span className="text-sm mt-1 block">
              {failureMessage}
            </span>
            <br />
            <span className="text-sm font-semibold">Your credits have been restored.</span>
            <br />
            <Button
              variant="link"
              className="h-auto p-0 text-destructive underline mt-1"
              onClick={handleViewTransferDetails}
            >
              View request details in History to troubleshoot →
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    if (hasTxId) {
      return (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Transfer Broadcast Successfully!</strong>
            <br />
            Request ID: <code className="font-mono text-xs bg-green-100 dark:bg-green-900 px-1 py-0.5 rounded">{requestId.toString()}</code>
            <br />
            <span className="text-sm mt-1 block">
              Transaction ID: <code className="font-mono text-xs bg-green-100 dark:bg-green-900 px-1 py-0.5 rounded">{request.blockchainTxId}</code>
            </span>
            <br />
            <span className="text-sm font-semibold">This transaction has been posted to the Bitcoin blockchain.</span>
            <br />
            <Button
              variant="link"
              className="h-auto p-0 text-green-700 dark:text-green-300 underline mt-1"
              onClick={handleViewTransferDetails}
            >
              View transfer details and status in History →
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="border-chart-1 bg-chart-1/10">
        <CheckCircle className="h-4 w-4 text-chart-1" />
        <AlertDescription className="text-chart-1">
          <strong>Transfer request created!</strong>
          <br />
          Request ID: <code className="font-mono text-xs bg-chart-1/20 px-1 py-0.5 rounded">{requestId.toString()}</code>
          <br />
          <span className="text-sm">Status: {request.status}</span>
          <br />
          <Button
            variant="link"
            className="h-auto p-0 text-chart-1 underline mt-1"
            onClick={handleViewTransferDetails}
          >
            View transfer details and status in History →
          </Button>
        </AlertDescription>
      </Alert>
    );
  };

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
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Reserve BTC can be funded via external providers such as BitPay, MoonPay, or MetaMask, then recorded here. Use the adjustment form below to reflect external deposits or withdrawals.
              </AlertDescription>
            </Alert>

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
                      Coverage ratio is below 100%. Consider depositing more BTC to the reserve.
                    </AlertDescription>
                  </Alert>
                )}

                {coverageStatus === 'critical' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Critical:</strong> Coverage ratio is below 80%. Immediate action required to maintain reserve backing.
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
                    <p className="text-xs text-muted-foreground">
                      {reserveActionType === 'deposit' && 'Add BTC to the reserve (e.g., after external funding via BitPay, MoonPay, or MetaMask)'}
                      {reserveActionType === 'withdraw' && 'Remove BTC from the reserve'}
                      {reserveActionType === 'correction' && 'Set the reserve to an exact amount'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reserveAmount">Amount (BTC)</Label>
                    <Input
                      id="reserveAmount"
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Enter amount"
                      value={reserveAmount}
                      onChange={(e) => setReserveAmount(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reserveReason">Reason (Required)</Label>
                    <Textarea
                      id="reserveReason"
                      placeholder="Explain the reason for this adjustment (e.g., 'External deposit via BitPay', 'Correction after audit')"
                      value={reserveReason}
                      onChange={(e) => setReserveReason(e.target.value)}
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Document the reason for this reserve adjustment for audit purposes
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={manageReserve.isPending || !reserveAmount || !reserveReason.trim()}
                    className="w-full"
                  >
                    {manageReserve.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Database className="h-4 w-4 mr-2" />
                        {reserveActionType === 'deposit' && 'Deposit to Reserve'}
                        {reserveActionType === 'withdraw' && 'Withdraw from Reserve'}
                        {reserveActionType === 'correction' && 'Apply Correction'}
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
              <Label htmlFor="recipientPrincipal">Recipient Principal ID</Label>
              <Input
                id="recipientPrincipal"
                type="text"
                placeholder="Enter user principal ID"
                value={recipientPrincipal}
                onChange={(e) => {
                  setRecipientPrincipal(e.target.value);
                  setPrincipalError('');
                }}
                className={`font-mono text-sm ${principalError ? 'border-destructive' : ''}`}
              />
              {principalError && (
                <p className="text-xs text-destructive">{principalError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="transferAmount">Amount (BTC)</Label>
              <Input
                id="transferAmount"
                type="number"
                min="1"
                step="1"
                placeholder="Enter amount to transfer"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Available: {balance?.toString() || '0'} BTC
              </p>
            </div>

            <Button
              type="submit"
              disabled={transferCredits.isPending || !recipientPrincipal.trim() || !transferAmount}
              className="w-full"
            >
              {transferCredits.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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

      <Card className="financial-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" />
            <CardTitle>Send BTC to Mainnet Wallet</CardTitle>
          </div>
          <CardDescription>
            Transfer Bitcoin from your admin balance to any Bitcoin mainnet address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {transferOutcome && getAdminTransferOutcomeAlert()}

          <form onSubmit={handleSendBTC} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="btcDestination">Destination Bitcoin Address</Label>
              <Input
                id="btcDestination"
                type="text"
                placeholder="Enter Bitcoin mainnet address (e.g., bc1q...)"
                value={btcDestination}
                onChange={(e) => setBtcDestination(e.target.value)}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="btcAmount">Amount (BTC)</Label>
              <Input
                id="btcAmount"
                type="number"
                min="1"
                step="1"
                placeholder="Enter amount to send"
                value={btcAmount}
                onChange={(e) => setBtcAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Available: {balance?.toString() || '0'} BTC
              </p>
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
                {insufficientBalance && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Insufficient balance. You need {totalDeducted} BTC but only have {availableBalance} BTC available.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={sendBTC.isPending || insufficientBalance || !btcDestination.trim() || !btcAmount || feeLoading || !!feeError}
              className="w-full"
            >
              {sendBTC.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Request...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Create Transfer Request
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
