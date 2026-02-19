import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Send, AlertCircle, XCircle, ShieldAlert, Info } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import BroadcastingDetailsNote from '../components/transfers/BroadcastingDetailsNote';
import MainnetTransactionAlert from '../components/transfers/MainnetTransactionAlert';
import ProviderDiagnosticsCard from '../components/transfers/ProviderDiagnosticsCard';
import BestPracticesSection from '../components/transfers/BestPracticesSection';
import type { BroadcastAttempt } from '../types/mainnet';

export default function SendBtcPage() {
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');
  const [broadcastAttempts, setBroadcastAttempts] = useState<BroadcastAttempt[]>([]);
  const [errorContext, setErrorContext] = useState<string>('');
  const navigate = useNavigate();

  const requestedAmount = amount && Number(amount) > 0 ? BigInt(amount) : BigInt(0);
  const trimmedDestination = destination.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Prevent submission - feature not implemented
    // When backend is implemented, this would:
    // 1. Call actor.sendBTC(destination, amount)
    // 2. Extract broadcastAttempts from result
    // 3. Update state: setBroadcastAttempts(result.broadcastAttempts || [])
    // 4. Set error context if needed
  };

  // Mock error for demonstration (remove when backend is implemented)
  const mockError = {
    failureReason: 'sendBTC method not available on backend',
    diagnosticData: 'Backend method missing: The sendBTC function does not exist in the current backend implementation.'
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Send Bitcoin</h1>
        <p className="text-muted-foreground">Transfer BTC from your credit balance to any Bitcoin address</p>
      </div>

      {/* Backend Implementation Status Alert */}
      <Alert className="mb-6 border-red-500 bg-red-50 dark:bg-red-950">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800 dark:text-red-200 font-semibold">
          Feature Not Available
        </AlertTitle>
        <AlertDescription className="text-red-800 dark:text-red-200">
          <strong>Backend Implementation Missing:</strong> The <code>sendBTC</code> method is not currently implemented in the backend canister. 
          This feature requires backend support for:
          <ul className="list-disc list-inside mt-2 ml-2 space-y-1">
            <li>Transaction signing with backend-managed keys</li>
            <li>Broadcasting signed transactions to Bitcoin mainnet via HTTP outcalls</li>
            <li>Transaction status tracking and confirmation monitoring</li>
            <li>Reserve balance management for network fees</li>
          </ul>
          <div className="mt-3 pt-3 border-t border-red-300 dark:border-red-800">
            <strong>Available Alternatives:</strong>
            <div className="mt-2 space-y-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: '/withdraw' })}
                className="mr-2"
              >
                Request Withdrawal
              </Button>
              <span className="text-sm">Submit a withdrawal request for admin processing</span>
            </div>
            <div className="mt-2 space-y-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: '/send-to-peer' })}
                className="mr-2"
              >
                Send to Peer
              </Button>
              <span className="text-sm">Transfer credits to another user within the platform</span>
            </div>
          </div>
        </AlertDescription>
      </Alert>

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

      <Card className="mb-6 opacity-60">
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
                disabled={true}
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
                disabled={true}
              />
            </div>

            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Backend Method Not Available:</strong>
                <br />
                The <code>sendBTC</code> method does not exist in the current backend implementation. 
                This form is disabled until the backend functionality is added.
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              disabled={true}
              className="w-full"
            >
              <Send className="mr-2 h-4 w-4" />
              Send Bitcoin (Not Available)
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Provider Diagnostics Panel */}
      <div className="mb-6">
        <ProviderDiagnosticsCard 
          broadcastAttempts={broadcastAttempts}
          errorContext={errorContext}
        />
      </div>

      {/* Best Practices & Troubleshooting */}
      <div className="mb-6">
        <BestPracticesSection request={mockError} />
      </div>

      {/* Technical Implementation Details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Required Backend Implementation
          </CardTitle>
          <CardDescription>
            Technical requirements for enabling Bitcoin sending functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-1">Missing Backend Method</h4>
            <p className="text-sm text-muted-foreground">
              The backend needs to implement a <code className="bg-muted px-1 py-0.5 rounded">sendBTC(destination: Text, amount: BitcoinAmount)</code> method 
              that returns transaction status information including broadcast attempts.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">HTTP Outcalls Required</h4>
            <p className="text-sm text-muted-foreground">
              The backend must use Internet Computer HTTP outcalls to broadcast signed transactions to blockchain APIs 
              (e.g., blockstream.info, blockchain.info). Localhost endpoints are not accessible from IC canisters.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">Transaction Signing</h4>
            <p className="text-sm text-muted-foreground">
              The backend needs to implement Bitcoin transaction signing using threshold ECDSA or manage private keys securely 
              within the canister to sign transactions before broadcasting.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-1">Status Tracking</h4>
            <p className="text-sm text-muted-foreground">
              The backend should track transaction signing status, broadcast status, and confirmation count, 
              storing this information in the transaction record for frontend display.
            </p>
          </div>
        </CardContent>
      </Card>

      <BroadcastingDetailsNote />
    </div>
  );
}
