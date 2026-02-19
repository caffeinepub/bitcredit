import { useState, useRef, useEffect } from 'react';
import { useGetCallerBalance, useGetTransactionHistory, useSendBTC, useGetEstimatedNetworkFee, useManageReserve, useSubmitWithdrawalRequest, useGetAllWithdrawalRequests, useGetCurrentBtcPriceUsd, useValidateReserveDeposit, useGetAllReserveAdjustments, useTransferRequestStatus } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Send, AlertCircle, TrendingUp, Wallet, CheckCircle, XCircle, Loader2, DollarSign, Inbox, Hash, Copy, Clock, CheckCheck } from 'lucide-react';
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
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);

  const [depositTxid, setDepositTxid] = useState('');
  const [depositAmount, setDepositAmount] = useState('');

  const { data: balance } = useGetCallerBalance();
  const { data: transactions } = useGetTransactionHistory();
  const { data: btcPrice } = useGetCurrentBtcPriceUsd();
  const { data: allWithdrawalRequests } = useGetAllWithdrawalRequests();
  const { data: reserveAdjustments } = useGetAllReserveAdjustments();
  const { mutate: sendBTC, isPending: sendPending } = useSendBTC();
  const { mutate: manageReserve, isPending: reservePending } = useManageReserve();
  const { mutate: submitWithdrawal, isPending: withdrawPending } = useSubmitWithdrawalRequest();
  const { mutate: validateDeposit, isPending: depositValidationPending, error: depositValidationError } = useValidateReserveDeposit();
  const [monitoringEnabled, setMonitoringEnabled] = useAiReserveMonitoringPreference();

  const requestedAmount = sendAmount && Number(sendAmount) > 0 ? BigInt(sendAmount) : BigInt(0);
  const { data: estimatedFee } = useGetEstimatedNetworkFee(destination, requestedAmount);

  const payoutsTabRef = useRef<HTMLButtonElement>(null);
  const approvalInboxRef = useRef<HTMLDivElement>(null);

  // Poll transfer status while broadcasting
  const { data: liveTransferRequest } = useTransferRequestStatus(
    transferOutcome?.requestId || null,
    sendPending || (transferOutcome?.request?.status === 'PENDING' || transferOutcome?.request?.status === 'IN_PROGRESS')
  );

  // Update transfer outcome with live data
  useEffect(() => {
    if (liveTransferRequest && transferOutcome) {
      setTransferOutcome({
        requestId: transferOutcome.requestId,
        request: liveTransferRequest,
      });

      // Update broadcast status messages
      if (liveTransferRequest.status === 'PENDING') {
        setBroadcastStatus('Attempting broadcast to blockchain API...');
      } else if (liveTransferRequest.status === 'IN_PROGRESS' && !liveTransferRequest.blockchainTxId) {
        setBroadcastStatus('Broadcast in progress, analyzing connection...');
      } else if (liveTransferRequest.status === 'IN_PROGRESS' && liveTransferRequest.blockchainTxId) {
        setBroadcastStatus('Transaction posted to blockchain, awaiting confirmation...');
      } else if (liveTransferRequest.status === 'COMPLETED') {
        setBroadcastStatus('Transaction confirmed on-chain!');
      } else if (liveTransferRequest.status === 'FAILED') {
        setBroadcastStatus(null);
      }
    }
  }, [liveTransferRequest, transferOutcome]);

  const handleSendBTC = (e: React.FormEvent) => {
    e.preventDefault();
    if (destination && sendAmount && Number(sendAmount) > 0) {
      setBroadcastStatus('Submitting transfer request...');
      sendBTC(
        { destination, amount: BigInt(sendAmount) },
        {
          onSuccess: ({ requestId, transferRequest }) => {
            setTransferOutcome({ requestId, request: transferRequest });
            setDestination('');
            setSendAmount('');

            if (transferRequest?.status === 'PENDING') {
              setBroadcastStatus('Attempting broadcast to blockchain API...');
            } else if (transferRequest?.status === 'IN_PROGRESS') {
              setBroadcastStatus('Broadcast in progress...');
            }
          },
          onError: () => {
            setBroadcastStatus(null);
          },
        }
      );
    }
  };

  const handleManageReserve = (e: React.FormEvent) => {
    e.preventDefault();
    if (reserveAmount && Number(reserveAmount) > 0) {
      const action = { __kind__: 'deposit' as const, deposit: BigInt(reserveAmount) };
      const txid = reserveTxid.trim() || null;
      manageReserve(
        { action, txid },
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
    if (withdrawAmount && Number(withdrawAmount) > 0 && withdrawMethod) {
      submitWithdrawal(
        {
          amount: BigInt(withdrawAmount),
          method: withdrawMethod,
          account: withdrawAccount || null,
        },
        {
          onSuccess: (requestId) => {
            setWithdrawalRequestId(requestId);
            setWithdrawAmount('');
            setWithdrawMethod('');
            setWithdrawAccount('');
            payoutsTabRef.current?.click();
          },
        }
      );
    }
  };

  const handleValidateDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (depositTxid && depositAmount && Number(depositAmount) > 0) {
      validateDeposit(
        {
          txid: depositTxid,
          amount: BigInt(depositAmount),
        },
        {
          onSuccess: () => {
            setDepositTxid('');
            setDepositAmount('');
          },
          onError: (error: any) => {
            toast.error(normalizeReserveDepositValidationError(error));
          },
        }
      );
    }
  };

  const handleCopyTxid = async (txid: string) => {
    try {
      await navigator.clipboard.writeText(txid);
      toast.success('Transaction ID copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy transaction ID');
    }
  };

  const handleScrollToInbox = () => {
    approvalInboxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const formatReserveReason = (reason: ReserveChangeReason): string => {
    // Handle enum-style types from backend
    if (typeof reason === 'string') {
      return reason;
    }
    // Handle object-style variants
    if (typeof reason === 'object' && reason !== null) {
      // Try to extract the variant name
      const keys = Object.keys(reason);
      if (keys.length > 0) {
        return keys[0];
      }
    }
    return 'unknown';
  };

  const getTransferOutcomeAlert = () => {
    if (!transferOutcome || !transferOutcome.request) return null;

    const { requestId, request } = transferOutcome;
    const isFailed = request.status === 'FAILED';
    const isCompleted = request.status === 'COMPLETED';
    const hasTxId = !!request.blockchainTxId;

    if (isFailed) {
      return (
        <Alert className="border-destructive bg-destructive/10">
          <XCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            <strong>Transfer Failed</strong>
            <br />
            Request ID: <code className="font-mono text-xs">{requestId.toString()}</code>
            <br />
            {request.failureReason && (
              <span className="text-sm">{request.failureReason}</span>
            )}
          </AlertDescription>
        </Alert>
      );
    }

    if (isCompleted) {
      return (
        <Alert className="border-emerald-600 bg-emerald-50 dark:bg-emerald-950">
          <CheckCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertDescription className="text-emerald-800 dark:text-emerald-200">
            <strong>Transfer Confirmed On-Chain!</strong>
            <br />
            Request ID: <code className="font-mono text-xs">{requestId.toString()}</code>
            <br />
            Transaction ID: <code className="font-mono text-xs">{request.blockchainTxId}</code>
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
            Request ID: <code className="font-mono text-xs">{requestId.toString()}</code>
            <br />
            Transaction ID: <code className="font-mono text-xs">{request.blockchainTxId}</code>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="border-chart-1 bg-chart-1/10">
        <Clock className="h-4 w-4 text-chart-1" />
        <AlertDescription className="text-chart-1">
          <strong>Transfer request created</strong>
          <br />
          Request ID: <code className="font-mono text-xs">{requestId.toString()}</code>
          <br />
          Status: {request.status}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-10 w-10 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage reserves, process payouts, and monitor system health
        </p>
      </div>

      <Card className="financial-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Admin Balance</CardTitle>
              <CardDescription>Your personal app wallet balance</CardDescription>
            </div>
            <Wallet className="h-8 w-8 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="stat-value text-primary">{balance?.toString() || '0'} BTC</div>
          <UsdEstimateLine btcAmount={balance || BigInt(0)} btcPriceUsd={btcPrice} />
        </CardContent>
      </Card>

      <Tabs defaultValue="reserve" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="reserve">Reserve</TabsTrigger>
          <TabsTrigger value="payouts" ref={payoutsTabRef}>
            <Inbox className="h-4 w-4 mr-2" />
            Payouts
          </TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
        </TabsList>

        <TabsContent value="reserve" className="space-y-6">
          <Card className="financial-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>AI Reserve Monitoring</CardTitle>
                  <CardDescription>
                    Enable automatic reserve status checks and real-time monitoring
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="monitoring-toggle" className="text-sm">
                    {monitoringEnabled ? 'ON' : 'OFF'}
                  </Label>
                  <Switch
                    id="monitoring-toggle"
                    checked={monitoringEnabled}
                    onCheckedChange={setMonitoringEnabled}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <AdminReserveStatusMonitor monitoringEnabled={monitoringEnabled} />
            </CardContent>
          </Card>

          <Card className="financial-card">
            <CardHeader>
              <CardTitle>Validate Reserve Deposit</CardTitle>
              <CardDescription>
                Verify and credit a Bitcoin deposit to the reserve address
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleValidateDeposit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="depositTxid">Transaction ID (txid)</Label>
                  <Input
                    id="depositTxid"
                    type="text"
                    placeholder="Enter Bitcoin transaction ID"
                    value={depositTxid}
                    onChange={(e) => setDepositTxid(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Amount (BTC)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    placeholder="0.00000000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    step="0.00000001"
                    min="0"
                  />
                </div>
                {depositValidationError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {normalizeReserveDepositValidationError(depositValidationError)}
                    </AlertDescription>
                  </Alert>
                )}
                <Button type="submit" disabled={depositValidationPending} className="w-full">
                  {depositValidationPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating Deposit...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Validate & Credit Deposit
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="financial-card">
            <CardHeader>
              <CardTitle>Manual Reserve Management</CardTitle>
              <CardDescription>
                Manually adjust reserve balance (for corrections or off-chain deposits)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleManageReserve} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reserveAmount">Amount (BTC)</Label>
                  <Input
                    id="reserveAmount"
                    type="number"
                    placeholder="0.00000000"
                    value={reserveAmount}
                    onChange={(e) => setReserveAmount(e.target.value)}
                    step="0.00000001"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reserveTxid">Transaction ID (optional)</Label>
                  <Input
                    id="reserveTxid"
                    type="text"
                    placeholder="Enter Bitcoin transaction ID (optional)"
                    value={reserveTxid}
                    onChange={(e) => setReserveTxid(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: Record the on-chain transaction ID for audit trail
                  </p>
                </div>
                <Button type="submit" disabled={reservePending} className="w-full">
                  {reservePending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Reserve...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Add to Reserve
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="financial-card">
            <CardHeader>
              <CardTitle>Reserve Adjustment History</CardTitle>
              <CardDescription>
                All reserve deposits, withdrawals, and adjustments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reserveAdjustments && reserveAdjustments.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Txid</TableHead>
                        <TableHead>Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reserveAdjustments.map(([id, adjustment]) => (
                        <TableRow key={id.toString()}>
                          <TableCell className="font-mono text-xs">{id.toString()}</TableCell>
                          <TableCell className="font-semibold">{adjustment.amount.toString()} BTC</TableCell>
                          <TableCell>
                            <Badge variant="outline">{formatReserveReason(adjustment.reason)}</Badge>
                          </TableCell>
                          <TableCell>
                            {adjustment.transactionId ? (
                              <div className="flex items-center gap-1">
                                <code className="text-xs font-mono">
                                  {adjustment.transactionId.slice(0, 8)}...
                                </code>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleCopyTxid(adjustment.transactionId!)}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(Number(adjustment.timestamp) / 1_000_000).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No reserve adjustments yet</p>
              )}
            </CardContent>
          </Card>

          <ReserveMultisigConfigPanel />
          <ReserveMultisigSetupExternalNote />
          <ExternalAiReserveManagerMiningPoolNote />
          <BitcoinCoreReserveBalanceExternalNote />
          <AdminBroadcastTroubleshootingCard />
        </TabsContent>

        <TabsContent value="payouts" className="space-y-6">
          <AdminWithdrawalStatusDashboard 
            requests={allWithdrawalRequests || []} 
            onScrollToInbox={handleScrollToInbox}
          />
          <div ref={approvalInboxRef}>
            <AdminWithdrawalRequestsTable requests={allWithdrawalRequests || []} />
          </div>
          <ExternalPayoutApisDeveloperNote context="admin" />
        </TabsContent>

        <TabsContent value="transfers" className="space-y-6">
          {/* Real-time broadcast status */}
          {broadcastStatus && (
            <Alert className="border-chart-1 bg-chart-1/10">
              <Loader2 className="h-4 w-4 animate-spin text-chart-1" />
              <AlertDescription className="text-chart-1">
                <strong>Broadcasting Status</strong>
                <br />
                <span className="text-sm">{broadcastStatus}</span>
              </AlertDescription>
            </Alert>
          )}

          {transferOutcome && getTransferOutcomeAlert()}

          <BroadcastingDetailsNote />

          <Card className="financial-card">
            <CardHeader>
              <CardTitle>Admin Send BTC</CardTitle>
              <CardDescription>
                Send Bitcoin from your admin wallet to any mainnet address
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendBTC} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="destination">Destination Address</Label>
                  <Input
                    id="destination"
                    type="text"
                    placeholder="Enter Bitcoin mainnet address"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sendAmount">Amount (BTC)</Label>
                  <Input
                    id="sendAmount"
                    type="number"
                    placeholder="0.00000000"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    step="0.00000001"
                    min="0"
                  />
                </div>
                {estimatedFee !== undefined && (
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estimated network fee:</span>
                      <span className="font-semibold">{estimatedFee.toString()} BTC</span>
                    </div>
                  </div>
                )}
                <Button type="submit" disabled={sendPending} className="w-full">
                  {sendPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Broadcasting Transaction...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Bitcoin
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
