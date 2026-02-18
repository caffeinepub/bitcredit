import { useState, useRef } from 'react';
import { useGetCallerBalance, useGetTransactionHistory, useSendBTC, useGetEstimatedNetworkFee, useManageReserve, useSubmitWithdrawalRequest, useGetAllWithdrawalRequests, useGetCurrentBtcPriceUsd, useValidateReserveDeposit, useGetAllReserveAdjustments } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Send, AlertCircle, TrendingUp, Wallet, CheckCircle, XCircle, Loader2, DollarSign, Inbox, Hash, Copy, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { SendBTCRequest, ReserveChangeReason } from '../backend';
import AdminWithdrawalRequestsTable from '../components/withdrawals/AdminWithdrawalRequestsTable';
import AdminWithdrawalStatusDashboard from '../components/withdrawals/AdminWithdrawalStatusDashboard';
import BroadcastingDetailsNote from '../components/transfers/BroadcastingDetailsNote';
import ExternalPayoutApisDeveloperNote from '../components/withdrawals/ExternalPayoutApisDeveloperNote';
import UsdEstimateLine from '../components/balance/UsdEstimateLine';
import AdminReserveStatusMonitor from '../components/reserve/AdminReserveStatusMonitor';
import ReserveMultisigSetupExternalNote from '../components/reserve/ReserveMultisigSetupExternalNote';
import ReserveMultisigConfigPanel from '../components/reserve/ReserveMultisigConfigPanel';
import ExternalAiReserveManagerMiningPoolNote from '../components/reserve/ExternalAiReserveManagerMiningPoolNote';
import BitcoinCoreReserveBalanceExternalNote from '../components/reserve/BitcoinCoreReserveBalanceExternalNote';
import AdminBroadcastTroubleshootingCard from '../components/reserve/AdminBroadcastTroubleshootingCard';
import { useAiReserveMonitoringPreference } from '../hooks/useAiReserveMonitoringPreference';
import { normalizeReserveDepositValidationError } from '../utils/errors';
import { toast } from 'sonner';

export default function AdminPage() {
  const [destination, setDestination] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [reserveAmount, setReserveAmount] = useState('');
  const [reserveTxid, setReserveTxid] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [transferOutcome, setTransferOutcome] = useState<{
    requestId: bigint;
    request: SendBTCRequest | null;
  } | null>(null);
  const [withdrawalRequestId, setWithdrawalRequestId] = useState<bigint | null>(null);

  const [depositTxid, setDepositTxid] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositValidationResult, setDepositValidationResult] = useState<{
    success: boolean;
    confirmedDeposit: boolean;
    creditedAmount: bigint;
  } | null>(null);

  const [aiMonitoringEnabled, setAiMonitoringEnabled] = useAiReserveMonitoringPreference();

  const inboxRef = useRef<HTMLDivElement>(null);

  const { data: balance } = useGetCallerBalance();
  const { data: transactions } = useGetTransactionHistory();
  const { data: allWithdrawalRequests } = useGetAllWithdrawalRequests();
  const { data: btcPriceUsd, isLoading: priceLoading } = useGetCurrentBtcPriceUsd();
  const { data: reserveAdjustments } = useGetAllReserveAdjustments();
  const { mutate: sendBTC, isPending: isSending } = useSendBTC();
  const { mutate: manageReserve, isPending: isManagingReserve } = useManageReserve();
  const { mutate: submitWithdrawal, isPending: isSubmittingWithdrawal } = useSubmitWithdrawalRequest();
  const { mutate: validateDeposit, isPending: isValidatingDeposit, error: depositValidationError } = useValidateReserveDeposit();

  const requestedAmount = sendAmount && Number(sendAmount) > 0 ? BigInt(sendAmount) : BigInt(0);
  const { data: estimatedFee, isLoading: feeLoading, error: feeError } = useGetEstimatedNetworkFee(
    destination.trim(),
    requestedAmount
  );

  const availableBalance = balance ? Number(balance) : 0;
  const receiverAmount = Number(requestedAmount);
  const networkFee = estimatedFee ? Number(estimatedFee) : 0;
  const totalDeducted = receiverAmount + networkFee;
  const insufficientFunds = totalDeducted > availableBalance;

  const withdrawAmountNum = withdrawAmount && Number(withdrawAmount) > 0 ? Number(withdrawAmount) : 0;
  const insufficientWithdrawFunds = withdrawAmountNum > availableBalance;

  const handleSendBTC = (e: React.FormEvent) => {
    e.preventDefault();
    if (destination.trim() && sendAmount && Number(sendAmount) > 0 && !insufficientFunds && !feeError) {
      sendBTC(
        { destination: destination.trim(), amount: BigInt(sendAmount) },
        {
          onSuccess: ({ requestId, transferRequest }) => {
            setTransferOutcome({ requestId, request: transferRequest });
            setDestination('');
            setSendAmount('');
          },
        }
      );
    }
  };

  const handleManageReserve = (e: React.FormEvent) => {
    e.preventDefault();
    if (reserveAmount && Number(reserveAmount) > 0) {
      const amount = BigInt(reserveAmount);
      const txid = reserveTxid.trim() || null;
      
      manageReserve(
        { action: { __kind: 'deposit', deposit: amount }, txid },
        {
          onSuccess: () => {
            setReserveAmount('');
            setReserveTxid('');
          },
        }
      );
    }
  };

  const handleSubmitWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount && Number(withdrawAmount) > 0 && withdrawMethod.trim() && !insufficientWithdrawFunds) {
      const amount = BigInt(withdrawAmount);
      const account = withdrawAccount.trim() || null;
      
      submitWithdrawal(
        { amount, method: withdrawMethod.trim(), account },
        {
          onSuccess: (requestId) => {
            setWithdrawalRequestId(requestId);
            setWithdrawAmount('');
            setWithdrawMethod('');
            setWithdrawAccount('');
            toast.success(`Payout request #${requestId} created successfully!`);
          },
        }
      );
    }
  };

  const handleValidateDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    setDepositValidationResult(null);

    if (!depositTxid.trim()) {
      toast.error('Please enter a transaction ID');
      return;
    }

    if (!depositAmount || Number(depositAmount) <= 0) {
      toast.error('Please enter a valid deposit amount');
      return;
    }

    const amount = BigInt(depositAmount);
    validateDeposit(
      { txid: depositTxid.trim(), amount },
      {
        onSuccess: (result) => {
          setDepositValidationResult({
            success: result.success,
            confirmedDeposit: result.confirmedDeposit,
            creditedAmount: amount,
          });
          setDepositTxid('');
          setDepositAmount('');
        },
        onError: (error: any) => {
          const normalizedError = normalizeReserveDepositValidationError(error);
          toast.error(normalizedError);
        },
      }
    );
  };

  const handleScrollToInbox = () => {
    inboxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCopyTxid = (txid: string) => {
    navigator.clipboard.writeText(txid);
    toast.success('Transaction ID copied to clipboard');
  };

  const getReasonLabel = (reason: ReserveChangeReason): string => {
    if (reason === 'deposit') return 'Deposit';
    if (reason === 'withdrawal') return 'Withdrawal';
    if (reason === 'adjustment') return 'Adjustment';
    return 'Unknown';
  };

  const getReasonBadgeVariant = (reason: ReserveChangeReason): 'default' | 'secondary' | 'outline' => {
    if (reason === 'deposit') return 'default';
    if (reason === 'withdrawal') return 'secondary';
    return 'outline';
  };

  const getOutcomeAlert = () => {
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
            <span className="text-sm font-semibold">
              This transaction has been posted to the Bitcoin blockchain.
            </span>
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
        </AlertDescription>
      </Alert>
    );
  };

  const getDepositValidationAlert = () => {
    if (!depositValidationResult) return null;

    if (depositValidationResult.success && depositValidationResult.confirmedDeposit) {
      return (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong>Reserve Deposit Validated Successfully!</strong>
            <br />
            <span className="text-sm mt-1 block">
              ✓ Transaction matched the reserve wallet address
            </span>
            <span className="text-sm mt-1 block">
              ✓ Credited amount: <strong>{depositValidationResult.creditedAmount.toString()} satoshis</strong>
            </span>
            <br />
            <span className="text-sm font-semibold">
              The reserve balance has been updated.
            </span>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="border-destructive bg-destructive/10">
        <XCircle className="h-4 w-4 text-destructive" />
        <AlertDescription className="text-destructive">
          <strong>Validation Failed</strong>
          <br />
          <span className="text-sm mt-1 block">
            The transaction could not be validated. No funds were added to the reserve.
          </span>
        </AlertDescription>
      </Alert>
    );
  };

  const pendingCount = allWithdrawalRequests?.filter((r) => r.status === 'PENDING').length || 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Shield className="h-10 w-10 text-primary" />
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage reserves, send BTC to mainnet, and process withdrawal requests
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="financial-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Admin Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-primary">{balance?.toString() || '0'} BTC</div>
            <UsdEstimateLine 
              btcAmount={balance || BigInt(0)} 
              btcPriceUsd={btcPriceUsd} 
              isLoading={priceLoading}
            />
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-chart-2">{transactions?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">All-time transaction count</p>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-amber-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting processing</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reserve" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reserve">
            <Wallet className="h-4 w-4 mr-2" />
            Reserve
          </TabsTrigger>
          <TabsTrigger value="payouts" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Payouts
            {pendingCount > 0 && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="transfers">
            <Send className="h-4 w-4 mr-2" />
            Transfers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reserve" className="space-y-6 mt-6">
          <Card className="financial-card">
            <CardHeader>
              <CardTitle>AI Reserve Monitoring</CardTitle>
              <CardDescription>
                Control automatic reserve status updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ai-monitoring-toggle" className="text-base font-medium">
                    AI reserve monitoring (auto-refresh)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {aiMonitoringEnabled 
                      ? 'Reserve status updates automatically every 10 seconds' 
                      : 'When off, reserve status updates only when you click Refresh Now'}
                  </p>
                </div>
                <Switch
                  id="ai-monitoring-toggle"
                  checked={aiMonitoringEnabled}
                  onCheckedChange={setAiMonitoringEnabled}
                />
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Current state: <span className="font-semibold">{aiMonitoringEnabled ? 'ON' : 'OFF'}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <AdminReserveStatusMonitor 
            pollingInterval={10000} 
            monitoringEnabled={aiMonitoringEnabled}
          />

          <Card className="financial-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-5 w-5" />
                Validate Reserve Deposit
              </CardTitle>
              <CardDescription>
                Submit a Bitcoin transaction ID (txid) to verify and credit a deposit to the reserve wallet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {getDepositValidationAlert()}

              <form onSubmit={handleValidateDeposit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="depositTxid">Transaction ID (txid)</Label>
                  <Input
                    id="depositTxid"
                    type="text"
                    placeholder="e.g., a1b2c3d4e5f6..."
                    value={depositTxid}
                    onChange={(e) => setDepositTxid(e.target.value)}
                    disabled={isValidatingDeposit}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the Bitcoin transaction ID that sent funds to the reserve wallet
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Amount (satoshis)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    placeholder="e.g., 100000000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    disabled={isValidatingDeposit}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the amount that was sent to the reserve wallet in this transaction
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isValidatingDeposit || !depositTxid.trim() || !depositAmount || Number(depositAmount) <= 0}
                  className="w-full"
                >
                  {isValidatingDeposit ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Validate & Credit Reserve
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="financial-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Manual Reserve Update
              </CardTitle>
              <CardDescription>
                Manually adjust the reserve balance (e.g., for corrections or withdrawals)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManageReserve} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reserveAmount">Amount (satoshis)</Label>
                  <Input
                    id="reserveAmount"
                    type="number"
                    placeholder="e.g., 100000000"
                    value={reserveAmount}
                    onChange={(e) => setReserveAmount(e.target.value)}
                    disabled={isManagingReserve}
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the amount to add to the reserve balance
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reserveTxid">Transaction ID (txid) (optional)</Label>
                  <Input
                    id="reserveTxid"
                    type="text"
                    placeholder="e.g., a1b2c3d4e5f6..."
                    value={reserveTxid}
                    onChange={(e) => setReserveTxid(e.target.value)}
                    disabled={isManagingReserve}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optionally record a transaction ID for audit purposes
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isManagingReserve || !reserveAmount || Number(reserveAmount) <= 0}
                  className="w-full"
                >
                  {isManagingReserve ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Update Reserve
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="financial-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Reserve Adjustment History
              </CardTitle>
              <CardDescription>
                View all reserve balance changes with transaction IDs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!reserveAdjustments || reserveAdjustments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No reserve adjustments recorded yet</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Transaction ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reserveAdjustments.map(([id, adjustment]) => (
                        <TableRow key={id.toString()}>
                          <TableCell className="text-sm">
                            {new Date(Number(adjustment.timestamp) / 1_000_000).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getReasonBadgeVariant(adjustment.reason)}>
                              {getReasonLabel(adjustment.reason)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {adjustment.amount.toString()} sats
                          </TableCell>
                          <TableCell>
                            {adjustment.transactionId ? (
                              <div className="flex items-center gap-2">
                                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                  {adjustment.transactionId.length > 16 
                                    ? `${adjustment.transactionId.slice(0, 8)}...${adjustment.transactionId.slice(-8)}`
                                    : adjustment.transactionId}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyTxid(adjustment.transactionId!)}
                                  className="h-7 w-7 p-0"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <ReserveMultisigConfigPanel />
          <ReserveMultisigSetupExternalNote />
          <ExternalAiReserveManagerMiningPoolNote />
          <BitcoinCoreReserveBalanceExternalNote />
          <AdminBroadcastTroubleshootingCard />
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6 mt-6">
          <AdminWithdrawalStatusDashboard 
            requests={allWithdrawalRequests || []} 
            onScrollToInbox={handleScrollToInbox} 
          />

          <Card className="financial-card">
            <CardHeader>
              <CardTitle>Submit Test Withdrawal Request</CardTitle>
              <CardDescription>
                Create a withdrawal request from your admin account for testing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitWithdrawal} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdrawAmount">Amount (satoshis)</Label>
                  <Input
                    id="withdrawAmount"
                    type="number"
                    placeholder="e.g., 50000000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    disabled={isSubmittingWithdrawal}
                  />
                  {insufficientWithdrawFunds && (
                    <p className="text-xs text-destructive">Insufficient balance</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="withdrawMethod">Withdrawal Method</Label>
                  <Input
                    id="withdrawMethod"
                    type="text"
                    placeholder="e.g., PayPal, Bank Transfer"
                    value={withdrawMethod}
                    onChange={(e) => setWithdrawMethod(e.target.value)}
                    disabled={isSubmittingWithdrawal}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="withdrawAccount">Account (optional)</Label>
                  <Input
                    id="withdrawAccount"
                    type="text"
                    placeholder="e.g., user@example.com"
                    value={withdrawAccount}
                    onChange={(e) => setWithdrawAccount(e.target.value)}
                    disabled={isSubmittingWithdrawal}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmittingWithdrawal || !withdrawAmount || Number(withdrawAmount) <= 0 || !withdrawMethod.trim() || insufficientWithdrawFunds}
                  className="w-full"
                >
                  {isSubmittingWithdrawal ? (
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

              {withdrawalRequestId !== null && (
                <Alert className="mt-4 border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <strong>Withdrawal request created!</strong>
                    <br />
                    Request ID: <code className="font-mono text-xs bg-green-100 dark:bg-green-900 px-1 py-0.5 rounded">{withdrawalRequestId.toString()}</code>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div ref={inboxRef}>
            <Card className="financial-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Inbox className="h-5 w-5" />
                  Withdrawal Approval Inbox
                </CardTitle>
                <CardDescription>
                  Review and process pending withdrawal requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminWithdrawalRequestsTable requests={allWithdrawalRequests || []} />
              </CardContent>
            </Card>
          </div>

          <ExternalPayoutApisDeveloperNote context="admin" />
        </TabsContent>

        <TabsContent value="transfers" className="space-y-6 mt-6">
          <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>Security Notice:</strong> This app manages Bitcoin transactions using a custodial model. 
              The backend broadcasts signed transactions to the Bitcoin network via public blockchain APIs. 
              Never paste private keys into this application.
            </AlertDescription>
          </Alert>

          <Card className="financial-card">
            <CardHeader>
              <CardTitle>Send BTC to Mainnet</CardTitle>
              <CardDescription>
                Create a Bitcoin transfer request (requires external signing)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendBTC} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination Address</Label>
                  <Input
                    id="destination"
                    type="text"
                    placeholder="bc1q..."
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    disabled={isSending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sendAmount">Amount (satoshis)</Label>
                  <Input
                    id="sendAmount"
                    type="number"
                    placeholder="e.g., 100000"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    disabled={isSending}
                  />
                </div>

                {requestedAmount > BigInt(0) && (
                  <div className="rounded-lg border bg-muted/50 p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Receiver gets:</span>
                      <span className="font-mono">{receiverAmount.toLocaleString()} sats</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Network fee:</span>
                      <span className="font-mono">
                        {feeLoading ? 'Loading...' : `${networkFee.toLocaleString()} sats`}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-semibold">
                      <span>Total deducted:</span>
                      <span className="font-mono">{totalDeducted.toLocaleString()} sats</span>
                    </div>
                    {insufficientFunds && (
                      <p className="text-xs text-destructive pt-2">
                        Insufficient balance. You need {totalDeducted.toLocaleString()} sats but only have {availableBalance.toLocaleString()} sats.
                      </p>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSending || !destination.trim() || !sendAmount || Number(sendAmount) <= 0 || insufficientFunds || !!feeError}
                  className="w-full"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Transfer...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Create Transfer Request
                    </>
                  )}
                </Button>
              </form>

              {transferOutcome && (
                <div className="mt-4">
                  {getOutcomeAlert()}
                </div>
              )}
            </CardContent>
          </Card>

          <BroadcastingDetailsNote />
        </TabsContent>
      </Tabs>
    </div>
  );
}
