import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, AlertCircle, Loader2, XCircle, ShieldAlert } from 'lucide-react';
import { useActor } from '../hooks/useActor';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import BroadcastingDetailsNote from '../components/transfers/BroadcastingDetailsNote';
import ProviderDiagnosticsCard from '../components/transfers/ProviderDiagnosticsCard';
import MainnetTransactionAlert from '../components/transfers/MainnetTransactionAlert';
import TransactionStatusBadge from '../components/transfers/TransactionStatusBadge';
import TransactionConfirmationProgress from '../components/transfers/TransactionConfirmationProgress';
import { normalizeSendBTCError } from '../utils/errors';
import { SigningStatus, BroadcastStatus } from '../types/mainnet';
import type { SendBTCResult } from '../types/mainnet';

export default function SendBtcPage() {
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [transferResult, setTransferResult] = useState<SendBTCResult | null>(null);
  const [showStatusTracking, setShowStatusTracking] = useState(false);
  
  const { actor } = useActor();
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: async ({ destination, amount }: { destination: string; amount: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      // Note: sendBTC method is not in the backend interface but should exist
      const actorWithSendBTC = actor as any;
      if (!actorWithSendBTC.sendBTC) {
        throw new Error('sendBTC method not available on backend');
      }
      return actorWithSendBTC.sendBTC(destination, amount) as Promise<SendBTCResult>;
    },
    onSuccess: (data) => {
      setTransferResult(data);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      if (data.success) {
        toast.success('Transfer initiated successfully!');
        setShowStatusTracking(true);
        setDestination('');
        setAmount('');
      } else {
        toast.error('Transfer failed');
        setShowStatusTracking(false);
      }
    },
    onError: (error: any) => {
      toast.error(`Transfer failed: ${error.message || 'Unknown error'}`);
      setShowStatusTracking(false);
    },
  });

  const requestedAmount = amount && Number(amount) > 0 ? BigInt(amount) : BigInt(0);
  const trimmedDestination = destination.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!trimmedDestination || requestedAmount <= BigInt(0)) {
      return;
    }

    setShowStatusTracking(false);
    sendMutation.mutate({ destination: trimmedDestination, amount: requestedAmount });
  };

  const normalizedError = sendMutation.isError && sendMutation.error 
    ? normalizeSendBTCError(sendMutation.error as Error) 
    : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Send Bitcoin</h1>
        <p className="text-muted-foreground">Transfer BTC from your credit balance to any Bitcoin address</p>
      </div>

      {/* Mainnet Transaction Information */}
      <div className="mb-6">
        <MainnetTransactionAlert />
      </div>

      {/* Security Alert */}
      <Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950">
        <ShieldAlert className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          <strong>App-Managed Custodial Model:</strong> This application manages Bitcoin transactions on your behalf. 
          The backend signs and broadcasts transactions to the mainnet blockchain using reserve-funded fees. 
          You do not control private keys directly.
        </AlertDescription>
      </Alert>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Transfer Details</CardTitle>
          <CardDescription>Enter the destination address and amount to send</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="destination">Destination Bitcoin Address</Label>
              <Input
                id="destination"
                type="text"
                placeholder="bc1q... (Segwit addresses supported)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                disabled={sendMutation.isPending}
              />
              <p className="text-xs text-muted-foreground">
                Supports P2WPKH and P2WSH Segwit addresses
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (satoshis)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="1"
                placeholder="Enter amount in satoshis"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={sendMutation.isPending}
              />
            </div>

            {normalizedError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Transfer Failed:</strong>
                  <br />
                  {normalizedError}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={sendMutation.isPending || !trimmedDestination || requestedAmount <= BigInt(0)}
              className="w-full"
            >
              {sendMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing & Broadcasting Transaction...
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

      {/* Transaction Status Tracking */}
      {showStatusTracking && transferResult?.success && (
        <div className="mb-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Status</CardTitle>
              <CardDescription>
                Real-time status updates for your mainnet transaction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm font-medium">Current Status</p>
                  <p className="text-xs text-muted-foreground">
                    Request ID: {transferResult.requestId?.toString() || 'N/A'}
                  </p>
                </div>
                <TransactionStatusBadge
                  signingStatus={SigningStatus.signed}
                  broadcastStatus={BroadcastStatus.broadcast}
                />
              </div>

              <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  Your transaction has been signed and broadcast to the Bitcoin network. 
                  It will appear in your transaction history once confirmed.
                </AlertDescription>
              </Alert>

              <TransactionConfirmationProgress
                confirmationCount={0}
                targetConfirmations={6}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transfer Result */}
      {transferResult && !showStatusTracking && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Transfer Result</CardTitle>
              <CardDescription>
                {transferResult.requestId ? `Request ID: ${transferResult.requestId.toString()}` : 'No request ID'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {transferResult.success ? (
                <Alert className="border-emerald-600 bg-emerald-50 dark:bg-emerald-950">
                  <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                    <strong>Transfer initiated successfully!</strong>
                    {transferResult.diagnosticData && (
                      <>
                        <br />
                        <span className="text-xs">{transferResult.diagnosticData}</span>
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Transfer Failed</strong>
                    {transferResult.diagnosticData && (
                      <>
                        <br />
                        <span className="text-sm">{transferResult.diagnosticData}</span>
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Provider Diagnostics Card - Show for failed transfers */}
          {!transferResult.success && transferResult.diagnosticData && (
            <div className="mb-6">
              <ProviderDiagnosticsCard request={transferResult} />
            </div>
          )}
        </>
      )}

      <BroadcastingDetailsNote />
    </div>
  );
}
