import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Send, AlertCircle, ShieldAlert, Info, CheckCircle2 } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import BroadcastingDetailsNote from '../components/transfers/BroadcastingDetailsNote';
import MainnetTransactionAlert from '../components/transfers/MainnetTransactionAlert';
import ProviderDiagnosticsCard from '../components/transfers/ProviderDiagnosticsCard';
import BestPracticesSection from '../components/transfers/BestPracticesSection';
import TransactionConfirmationProgress from '../components/transfers/TransactionConfirmationProgress';
import { useSendBtc } from '../hooks/useQueries';
import { useGetCallerBalance } from '../hooks/useQueries';
import { normalizeError } from '../utils/errors';
import { isValidSegwitAddress } from '../utils/transactionStatus';
import type { BroadcastAttempt } from '../types/mainnet';

export default function SendBtcPage() {
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState<'mainnet' | 'testnet'>('mainnet');
  const [broadcastAttempts, setBroadcastAttempts] = useState<BroadcastAttempt[]>([]);
  const [errorContext, setErrorContext] = useState<string>('');
  const [successTxId, setSuccessTxId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  
  const navigate = useNavigate();
  const sendBtcMutation = useSendBtc();
  const { data: balance } = useGetCallerBalance();

  const requestedAmount = amount && Number(amount) > 0 ? BigInt(amount) : BigInt(0);
  const trimmedDestination = destination.trim();

  const validateForm = (): boolean => {
    setValidationError('');

    if (!trimmedDestination) {
      setValidationError('Destination address is required');
      return false;
    }

    if (!isValidSegwitAddress(trimmedDestination)) {
      setValidationError('Invalid Bitcoin address format. Only Segwit addresses (P2WPKH/P2WSH) are supported.');
      return false;
    }

    if (requestedAmount <= 0n) {
      setValidationError('Amount must be greater than 0');
      return false;
    }

    if (balance !== undefined && requestedAmount > balance) {
      setValidationError(`Insufficient balance. You have ${balance.toString()} satoshis available.`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setErrorContext('');
    setBroadcastAttempts([]);
    setSuccessTxId(null);

    try {
      const result = await sendBtcMutation.mutateAsync({
        destination: trimmedDestination,
        amount: requestedAmount,
        network,
      });

      if (result.success && result.txid) {
        setSuccessTxId(result.txid);
        setBroadcastAttempts(result.broadcastAttempts || []);
        setDestination('');
        setAmount('');
      } else {
        setErrorContext(result.diagnosticData || 'Transaction failed without specific error');
        setBroadcastAttempts(result.broadcastAttempts || []);
      }
    } catch (error: any) {
      const normalizedError = normalizeError(error);
      setErrorContext(normalizedError);
      
      // Try to extract broadcast attempts from error if available
      if (error.broadcastAttempts) {
        setBroadcastAttempts(error.broadcastAttempts);
      }
    }
  };

  const isLoading = sendBtcMutation.isPending;
  const hasError = !!errorContext || !!sendBtcMutation.error;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Send Bitcoin</h1>
        <p className="text-muted-foreground">Transfer BTC from your credit balance to any Bitcoin address</p>
      </div>

      {/* Success Message */}
      {successTxId && (
        <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800 dark:text-green-200 font-semibold">
            Transaction Broadcast Successful
          </AlertTitle>
          <AlertDescription className="text-green-800 dark:text-green-200">
            Your Bitcoin transaction has been successfully broadcast to the network.
            <div className="mt-2">
              <strong>Transaction ID:</strong> <code className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded">{successTxId}</code>
            </div>
          </AlertDescription>
        </Alert>
      )}

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
                disabled={isLoading}
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
                disabled={isLoading}
              />
              {balance !== undefined && (
                <p className="text-xs text-muted-foreground">
                  Available balance: {balance.toString()} satoshis
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="network">Network</Label>
              <select
                id="network"
                value={network}
                onChange={(e) => setNetwork(e.target.value as 'mainnet' | 'testnet')}
                disabled={isLoading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="mainnet">Mainnet</option>
                <option value="testnet">Testnet</option>
              </select>
            </div>

            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {hasError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Transaction Failed:</strong>
                  <br />
                  {errorContext || sendBtcMutation.error?.message || 'Unknown error occurred'}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              <Send className="mr-2 h-4 w-4" />
              {isLoading ? 'Sending...' : 'Send Bitcoin'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Transaction Confirmation Progress */}
      {successTxId && (
        <div className="mb-6">
          <TransactionConfirmationProgress
            txid={successTxId}
            confirmations={0}
            broadcastStatus="broadcast"
          />
        </div>
      )}

      {/* Provider Diagnostics Panel */}
      {broadcastAttempts.length > 0 && (
        <div className="mb-6">
          <ProviderDiagnosticsCard 
            broadcastAttempts={broadcastAttempts}
            errorContext={errorContext}
          />
        </div>
      )}

      {/* Best Practices & Troubleshooting */}
      {hasError && (
        <div className="mb-6">
          <BestPracticesSection 
            request={{ 
              failureReason: errorContext || sendBtcMutation.error?.message,
              diagnosticData: errorContext 
            }} 
            errorContext={errorContext}
          />
        </div>
      )}

      {/* Technical Implementation Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Bitcoin Transaction Broadcasting
          </CardTitle>
          <CardDescription>
            How Bitcoin transactions are processed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-1">Transaction Signing</h4>
            <p className="text-sm text-muted-foreground">
              The backend signs transactions using threshold ECDSA or managed private keys 
              within the canister to ensure secure transaction signing.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">Broadcasting via HTTP Outcalls</h4>
            <p className="text-sm text-muted-foreground">
              Signed transactions are broadcast to multiple blockchain APIs 
              (e.g., blockstream.info, blockchain.info) using Internet Computer HTTP outcalls.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">Confirmation Tracking</h4>
            <p className="text-sm text-muted-foreground">
              The system tracks transaction confirmations on the blockchain, 
              with full confirmation typically requiring 6 blocks (~60 minutes).
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">Reserve-Funded Fees</h4>
            <p className="text-sm text-muted-foreground">
              Network fees are paid from the reserve balance, not deducted from your transfer amount.
            </p>
          </div>
        </CardContent>
      </Card>

      <BroadcastingDetailsNote />
    </div>
  );
}
