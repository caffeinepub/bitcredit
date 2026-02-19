import { useState, useEffect } from 'react';
import { useSendBTC, useGetCallerBalance, useGetEstimatedNetworkFee, useTransferRequestStatus } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, AlertCircle, Wallet, Loader2, XCircle, CheckCircle, Wrench, ShieldAlert, Clock, CheckCheck } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import type { SendBTCRequest } from '../backend';
import BroadcastingDetailsNote from '../components/transfers/BroadcastingDetailsNote';
import { normalizeSendBTCError } from '../utils/errors';

// Bitcoin mainnet address validation regex
// Supports Legacy (P2PKH starting with 1), P2SH (starting with 3), and Bech32 (starting with bc1)
const BITCOIN_MAINNET_ADDRESS_REGEX = /^(bc1|[13])[a-km-zA-HJ-NP-Z1-9]{25,87}$/;

function isValidBitcoinMainnetAddress(address: string): boolean {
  return BITCOIN_MAINNET_ADDRESS_REGEX.test(address.trim());
}

export default function SendBtcPage() {
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [transferOutcome, setTransferOutcome] = useState<{
    requestId: bigint;
    request: SendBTCRequest | null;
  } | null>(null);
  const [broadcastStatus, setBroadcastStatus] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const { mutate: sendBTC, isPending, isError, error } = useSendBTC();
  const { data: balance } = useGetCallerBalance();

  // Poll transfer status while broadcasting
  const { data: liveTransferRequest } = useTransferRequestStatus(
    transferOutcome?.requestId || null,
    isPending || (transferOutcome?.request?.status === 'PENDING' || transferOutcome?.request?.status === 'IN_PROGRESS')
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

  const requestedAmount = amount && Number(amount) > 0 ? BigInt(amount) : BigInt(0);
  const trimmedDestination = destination.trim();
  const isValidAddress = trimmedDestination ? isValidBitcoinMainnetAddress(trimmedDestination) : true;
  
  const { data: estimatedFee, isLoading: feeLoading, error: feeError } = useGetEstimatedNetworkFee(
    trimmedDestination,
    requestedAmount
  );

  const availableBalance = balance ? Number(balance) : 0;
  const receiverAmount = Number(requestedAmount);
  const networkFee = estimatedFee ? Number(estimatedFee) : 0;
  const totalDeducted = receiverAmount + networkFee;
  const insufficientFunds = totalDeducted > availableBalance;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValidAddress) {
      return;
    }
    
    if (trimmedDestination && amount && Number(amount) > 0 && !insufficientFunds && !feeError) {
      setBroadcastStatus('Submitting transfer request...');
      sendBTC(
        { destination: trimmedDestination, amount: BigInt(amount) },
        {
          onSuccess: ({ requestId, transferRequest }) => {
            setTransferOutcome({ requestId, request: transferRequest });
            setDestination('');
            setAmount('');

            if (transferRequest?.status === 'PENDING') {
              setBroadcastStatus('Attempting broadcast to blockchain API...');
            } else if (transferRequest?.status === 'IN_PROGRESS') {
              setBroadcastStatus('Broadcast in progress...');
            }

            if (import.meta.env.DEV) {
              console.log('[SendBtcPage] Transfer outcome received:');
              console.log(`  - Request ID: ${requestId.toString()}`);
              console.log(`  - Status: ${transferRequest?.status || 'null'}`);
              console.log(`  - Has txid: ${!!transferRequest?.blockchainTxId}`);
              console.log(`  - Failure reason: ${transferRequest?.failureReason || 'none'}`);
            }
          },
          onError: () => {
            setBroadcastStatus(null);
          },
        }
      );
    }
  };

  const handleViewDetails = () => {
    if (transferOutcome?.requestId) {
      // Store request ID in sessionStorage for History page to auto-open
      sessionStorage.setItem('openTransferRequestId', transferOutcome.requestId.toString());
      navigate({ to: '/history' });
    }
  };

  const handleTroubleshoot = () => {
    if (transferOutcome?.requestId) {
      navigate({ 
        to: '/transfer/$requestId/troubleshoot',
        params: { requestId: transferOutcome.requestId.toString() }
      });
    }
  };

  const getOutcomeAlert = () => {
    if (!transferOutcome || !transferOutcome.request) return null;

    const { requestId, request } = transferOutcome;
    const isFailed = request.status === 'FAILED';
    const isCompleted = request.status === 'COMPLETED';
    const hasTxId = !!request.blockchainTxId;

    if (isFailed) {
      // Display clear English failure reason from persisted request
      const failureMessage = request.failureReason 
        ? request.failureReason 
        : 'The transaction could not be broadcast to the Bitcoin blockchain.';
      
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
            <div className="flex gap-2 mt-2">
              <Button
                variant="default"
                size="sm"
                className="bg-destructive hover:bg-destructive/90"
                onClick={handleTroubleshoot}
              >
                <Wrench className="h-3.5 w-3.5 mr-1" />
                Troubleshoot & Retry
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewDetails}
              >
                View in History
              </Button>
            </div>
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
            Request ID: <code className="font-mono text-xs bg-emerald-100 dark:bg-emerald-900 px-1 py-0.5 rounded">{requestId.toString()}</code>
            <br />
            <span className="text-sm mt-1 block">
              Transaction ID: <code className="font-mono text-xs bg-emerald-100 dark:bg-emerald-900 px-1 py-0.5 rounded">{request.blockchainTxId}</code>
            </span>
            <br />
            <span className="text-sm font-semibold">
              This transaction has been confirmed on the Bitcoin blockchain. The transfer is complete.
            </span>
            <br />
            <Button
              variant="link"
              className="h-auto p-0 text-emerald-700 dark:text-emerald-300 underline mt-1"
              onClick={handleViewDetails}
            >
              View transfer details in History →
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
            <span className="text-sm font-semibold">
              This transaction has been posted to the Bitcoin blockchain. The recipient will receive BTC once the transaction is confirmed on the Bitcoin mainnet.
            </span>
            <br />
            <Button
              variant="link"
              className="h-auto p-0 text-green-700 dark:text-green-300 underline mt-1"
              onClick={handleViewDetails}
            >
              View transfer details and status in History →
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Alert className="border-chart-1 bg-chart-1/10">
        <Clock className="h-4 w-4 text-chart-1" />
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
            onClick={handleViewDetails}
          >
            View transfer details and status in History →
          </Button>
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">Send BTC</h1>
        <p className="text-muted-foreground">
          Transfer Bitcoin from your app wallet balance to any Bitcoin mainnet address
        </p>
      </div>

      <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
        <ShieldAlert className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-900 dark:text-amber-100">
          <strong>App-Managed Custodial Broadcasting:</strong> This app uses an app-managed custodial reserve model to broadcast Bitcoin transactions on-chain. You do not need to provide private keys—the app handles signing and broadcasting using its reserve. <strong className="block mt-1">Never paste private keys (WIF format), seed phrases, or API secrets into this app.</strong> Any Python or Node.js signing examples shown in documentation must be run externally on your own secure systems.
        </AlertDescription>
      </Alert>

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

      {transferOutcome && getOutcomeAlert()}

      <BroadcastingDetailsNote />

      <Card className="financial-card">
        <CardHeader>
          <CardTitle>Create Transfer Request</CardTitle>
          <CardDescription>
            Send Bitcoin to any mainnet wallet address — recipient does not need an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>On-Chain Bitcoin Mainnet Transaction:</strong> This transfer creates a Bitcoin mainnet transaction using the app's custodial reserve. The recipient receives BTC only when the transaction is broadcast and confirmed on the Bitcoin blockchain. Bitcoin network fees are deducted from your credits. <strong>The recipient does not need to be registered in this app.</strong>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="destination">Destination Bitcoin Address</Label>
              <Input
                id="destination"
                type="text"
                placeholder="Enter Bitcoin mainnet address (e.g., bc1q... or 1... or 3...)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className={`font-mono text-sm ${!isValidAddress && trimmedDestination ? 'border-destructive' : ''}`}
              />
              {!isValidAddress && trimmedDestination && (
                <p className="text-xs text-destructive">
                  Please enter a valid Bitcoin mainnet address. Supported formats: Legacy (1...), P2SH (3...), or Bech32 (bc1...)
                </p>
              )}
              {isValidAddress && trimmedDestination && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  ✓ Valid Bitcoin mainnet address format
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Any valid Bitcoin mainnet address — recipient does not need an account in this app
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (BTC)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.00000001"
                min="0"
              />
              <p className="text-xs text-muted-foreground">
                Amount to send to the recipient (in BTC)
              </p>
            </div>

            {feeError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Unable to estimate network fee. Please check the destination address format.
                </AlertDescription>
              </Alert>
            )}

            {!feeError && estimatedFee !== undefined && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Recipient receives:</span>
                  <span className="font-semibold">{receiverAmount} BTC</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Network fee:</span>
                  <span className="font-semibold">{networkFee} BTC</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold">Total deducted from balance:</span>
                  <span className="font-bold text-primary">{totalDeducted} BTC</span>
                </div>
                {insufficientFunds && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Insufficient balance. You need {totalDeducted} BTC but only have {availableBalance} BTC.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {isError && error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error instanceof Error ? normalizeSendBTCError(error) : 'Failed to send BTC'}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={
                isPending ||
                !trimmedDestination ||
                !isValidAddress ||
                !amount ||
                Number(amount) <= 0 ||
                insufficientFunds ||
                feeLoading ||
                !!feeError
              }
            >
              {isPending ? (
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
    </div>
  );
}
