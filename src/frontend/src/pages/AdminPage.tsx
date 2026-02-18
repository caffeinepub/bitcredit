import { useState, useRef } from 'react';
import { useGetCallerBalance, useGetTransactionHistory, useSendBTC, useGetEstimatedNetworkFee, useGetReserveStatus, useManageReserve, useSubmitWithdrawalRequest, useGetAllWithdrawalRequests, useGetCurrentBtcPriceUsd } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Send, AlertCircle, TrendingUp, Wallet, CheckCircle, XCircle, Loader2, DollarSign, Inbox } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SendBTCRequest } from '../backend';
import AdminWithdrawalRequestsTable from '../components/withdrawals/AdminWithdrawalRequestsTable';
import AdminWithdrawalStatusDashboard from '../components/withdrawals/AdminWithdrawalStatusDashboard';
import BroadcastingDetailsNote from '../components/transfers/BroadcastingDetailsNote';
import ExternalPayoutApisDeveloperNote from '../components/withdrawals/ExternalPayoutApisDeveloperNote';
import UsdEstimateLine from '../components/balance/UsdEstimateLine';
import { toast } from 'sonner';

export default function AdminPage() {
  const [destination, setDestination] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [reserveAmount, setReserveAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('');
  const [withdrawAccount, setWithdrawAccount] = useState('');
  const [transferOutcome, setTransferOutcome] = useState<{
    requestId: bigint;
    request: SendBTCRequest | null;
  } | null>(null);
  const [withdrawalRequestId, setWithdrawalRequestId] = useState<bigint | null>(null);

  const inboxRef = useRef<HTMLDivElement>(null);

  const { data: balance } = useGetCallerBalance();
  const { data: transactions } = useGetTransactionHistory();
  const { data: reserveStatus } = useGetReserveStatus();
  const { data: allWithdrawalRequests } = useGetAllWithdrawalRequests();
  const { data: btcPriceUsd, isLoading: priceLoading } = useGetCurrentBtcPriceUsd();
  const { mutate: sendBTC, isPending: isSending } = useSendBTC();
  const { mutate: manageReserve, isPending: isManagingReserve } = useManageReserve();
  const { mutate: submitWithdrawal, isPending: isSubmittingWithdrawal } = useSubmitWithdrawalRequest();

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
      manageReserve(
        { __kind: 'deposit', deposit: amount },
        {
          onSuccess: () => {
            setReserveAmount('');
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

  const handleScrollToInbox = () => {
    inboxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
            <CardTitle className="text-sm font-medium">Reserve Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-chart-1">{reserveStatus?.reserveBtcBalance.toString() || '0'} BTC</div>
            <p className="text-xs text-muted-foreground mt-1">Total BTC in reserve</p>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Outstanding Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="stat-value text-chart-2">{reserveStatus?.outstandingIssuedCredits.toString() || '0'} BTC</div>
            <p className="text-xs text-muted-foreground mt-1">Total issued to users</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payouts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
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
          <TabsTrigger value="reserve">
            <Wallet className="h-4 w-4 mr-2" />
            Reserve
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payouts" className="space-y-6 mt-6">
          <AdminWithdrawalStatusDashboard 
            requests={allWithdrawalRequests || []} 
            onScrollToInbox={handleScrollToInbox}
          />

          <div ref={inboxRef} id="withdrawal-inbox" className="scroll-mt-6">
            <div className="space-y-2 mb-4">
              <h2 className="text-2xl font-bold tracking-tight">Withdrawal Approval Inbox</h2>
              <p className="text-sm text-muted-foreground">
                Review and process pending payout requests from users
              </p>
            </div>

            {allWithdrawalRequests && allWithdrawalRequests.length > 0 ? (
              <AdminWithdrawalRequestsTable requests={allWithdrawalRequests} context="admin" />
            ) : (
              <Card className="financial-card">
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                      <Inbox className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold mb-1">No withdrawal requests yet</h3>
                    <p className="text-muted-foreground text-xs">
                      Payout requests from users will appear here
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <ExternalPayoutApisDeveloperNote context="admin" />

          <Card className="financial-card">
            <CardHeader>
              <CardTitle>Test: Submit Withdrawal Request (Admin)</CardTitle>
              <CardDescription>
                Create a test payout request from your admin account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitWithdrawal} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdrawAmount">Amount (BTC credits)</Label>
                  <Input
                    id="withdrawAmount"
                    type="number"
                    placeholder="e.g., 100000000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    disabled={isSubmittingWithdrawal}
                  />
                  {insufficientWithdrawFunds && (
                    <p className="text-sm text-destructive">Insufficient balance</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="withdrawMethod">Payout Method</Label>
                  <Input
                    id="withdrawMethod"
                    type="text"
                    placeholder="e.g., PayPal, Bank Transfer, Venmo"
                    value={withdrawMethod}
                    onChange={(e) => setWithdrawMethod(e.target.value)}
                    disabled={isSubmittingWithdrawal}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="withdrawAccount">Account/Email (optional)</Label>
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
                  disabled={
                    isSubmittingWithdrawal ||
                    !withdrawAmount ||
                    Number(withdrawAmount) <= 0 ||
                    !withdrawMethod.trim() ||
                    insufficientWithdrawFunds
                  }
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
                      Submit Test Withdrawal Request
                    </>
                  )}
                </Button>
              </form>

              {withdrawalRequestId !== null && (
                <Alert className="mt-4 border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <strong>Withdrawal request created!</strong>
                    <br />
                    Request ID: <code className="font-mono text-xs bg-green-100 dark:bg-green-900 px-1 py-0.5 rounded">{withdrawalRequestId.toString()}</code>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers" className="space-y-6 mt-6">
          <Card className="financial-card">
            <CardHeader>
              <CardTitle>Send BTC to Mainnet</CardTitle>
              <CardDescription>
                Broadcast a Bitcoin transaction from the app's reserve
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendBTC} className="space-y-4">
                {transferOutcome && getOutcomeAlert()}

                <div className="space-y-2">
                  <Label htmlFor="destination">Destination Address</Label>
                  <Input
                    id="destination"
                    type="text"
                    placeholder="Bitcoin mainnet address"
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
                    placeholder="e.g., 100000000"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    disabled={isSending}
                  />
                </div>

                {feeLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Estimating network fee...
                  </div>
                )}

                {estimatedFee && !feeError && (
                  <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Receiver gets:</span>
                      <span className="font-semibold">{receiverAmount.toLocaleString()} sats</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Network fee:</span>
                      <span className="font-semibold">{networkFee.toLocaleString()} sats</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="font-semibold">Total deducted:</span>
                      <span className="font-bold text-primary">{totalDeducted.toLocaleString()} sats</span>
                    </div>
                  </div>
                )}

                {insufficientFunds && (
                  <Alert className="border-destructive bg-destructive/10">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-destructive">
                      Insufficient balance. You need {totalDeducted.toLocaleString()} sats but only have {availableBalance.toLocaleString()} sats.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={isSending || !destination.trim() || !sendAmount || Number(sendAmount) <= 0 || insufficientFunds || !!feeError}
                  className="w-full"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Broadcasting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send BTC
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <BroadcastingDetailsNote />
        </TabsContent>

        <TabsContent value="reserve" className="space-y-6 mt-6">
          <Card className="financial-card">
            <CardHeader>
              <CardTitle>Manage Reserve</CardTitle>
              <CardDescription>
                Add or adjust the Bitcoin reserve balance
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
                </div>

                <Button
                  type="submit"
                  disabled={isManagingReserve || !reserveAmount || Number(reserveAmount) <= 0}
                  className="w-full"
                >
                  {isManagingReserve ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Deposit to Reserve
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-muted/50 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Reserve Status</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reserve Balance:</span>
                    <span className="font-semibold">{reserveStatus?.reserveBtcBalance.toString() || '0'} BTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Outstanding Credits:</span>
                    <span className="font-semibold">{reserveStatus?.outstandingIssuedCredits.toString() || '0'} BTC</span>
                  </div>
                  {reserveStatus?.coverageRatio !== undefined && reserveStatus?.coverageRatio !== null && (
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="font-semibold">Coverage Ratio:</span>
                      <span className="font-bold">{(reserveStatus.coverageRatio * 100).toFixed(2)}%</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
