import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle, ShieldCheck, Wifi, Clock, Code, Server } from 'lucide-react';
import BestPracticesSection from '../components/transfers/BestPracticesSection';

export default function TransferTroubleshootingPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/history' })}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to History
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-2">Transfer Troubleshooting</h1>
        <p className="text-muted-foreground">Detailed diagnostics and troubleshooting guidance for mainnet transactions</p>
      </div>

      {/* Backend Implementation Status */}
      <Alert className="mb-6 border-red-500 bg-red-50 dark:bg-red-950">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-800 dark:text-red-200 font-semibold">
          Backend Implementation Required
        </AlertTitle>
        <AlertDescription className="text-red-800 dark:text-red-200">
          <strong>sendBTC Method Not Available:</strong> The backend canister does not currently implement the <code>sendBTC</code> method 
          required for sending Bitcoin to external addresses. This page provides troubleshooting guidance for when the feature is implemented.
          <div className="mt-2">
            <strong>Current Alternatives:</strong> Use Withdrawal Requests or Send to Peer for transferring credits.
          </div>
        </AlertDescription>
      </Alert>

      {/* Backend Implementation Requirements */}
      <div className="space-y-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-purple-600" />
              Backend Method Missing
            </CardTitle>
            <CardDescription>The sendBTC method is not implemented in the backend</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-1">Error Message</h4>
              <p className="text-sm text-muted-foreground">
                When attempting to send Bitcoin, you may see: <code className="bg-muted px-1 py-0.5 rounded">"sendBTC method not available on backend"</code>
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Root Cause</h4>
              <p className="text-sm text-muted-foreground">
                The backend canister (backend/main.mo) does not export a <code className="bg-muted px-1 py-0.5 rounded">sendBTC</code> public method. 
                The frontend is attempting to call a method that doesn't exist in the backend interface.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Resolution</h4>
              <p className="text-sm text-muted-foreground">
                The backend needs to implement a public method with signature similar to:
              </p>
              <pre className="bg-muted p-2 rounded text-xs mt-2 overflow-x-auto">
{`public shared ({ caller }) func sendBTC(
  destination: Text, 
  amount: BitcoinAmount
) : async SendBTCResult`}
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-600" />
              HTTP Outcall Implementation
            </CardTitle>
            <CardDescription>Broadcasting transactions requires HTTP outcalls to blockchain APIs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-1">Blockchain API Connectivity</h4>
              <p className="text-sm text-muted-foreground">
                The backend must use Internet Computer HTTP outcalls to communicate with public blockchain APIs. 
                Common issues include:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 mt-1">
                <li>Localhost endpoints (127.0.0.1, localhost:18443) are not accessible from IC canisters</li>
                <li>HTTP outcalls require publicly accessible HTTPS endpoints</li>
                <li>API rate limiting may cause intermittent failures</li>
                <li>Network timeouts during high load periods</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Recommended Blockchain APIs</h4>
              <p className="text-sm text-muted-foreground">
                Use public blockchain APIs that support transaction broadcasting:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 mt-1">
                <li><code className="bg-muted px-1 py-0.5 rounded">https://blockstream.info/api/</code> - Blockstream API (mainnet)</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">https://blockchain.info/</code> - Blockchain.info API</li>
                <li><code className="bg-muted px-1 py-0.5 rounded">https://api.blockcypher.com/</code> - BlockCypher API</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Error Handling</h4>
              <p className="text-sm text-muted-foreground">
                The backend should implement retry logic with multiple API providers and return detailed error information 
                including which APIs were attempted and why they failed.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Transaction Signing
            </CardTitle>
            <CardDescription>Backend must sign transactions before broadcasting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-1">Signing Implementation</h4>
              <p className="text-sm text-muted-foreground">
                The backend needs to implement Bitcoin transaction signing using one of these approaches:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 mt-1">
                <li>Internet Computer threshold ECDSA for decentralized key management</li>
                <li>Secure key storage within the canister (less recommended)</li>
                <li>Integration with external signing services (requires additional HTTP outcalls)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Signing Status Tracking</h4>
              <p className="text-sm text-muted-foreground">
                The backend should track signing status (pending, signed, failed) and include this information 
                in transaction records for frontend display.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-orange-600" />
              Broadcasting & Network Issues
            </CardTitle>
            <CardDescription>Common problems when broadcasting to Bitcoin mainnet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-1">Broadcast Status: Pending</h4>
              <p className="text-sm text-muted-foreground">
                The transaction is signed and waiting to be broadcast to the Bitcoin network. 
                This usually takes a few seconds. Extended pending status may indicate:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 mt-1">
                <li>Blockchain API connectivity issues</li>
                <li>HTTP outcall timeouts</li>
                <li>API rate limiting</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Broadcast Status: Failed</h4>
              <p className="text-sm text-muted-foreground">
                The backend was unable to broadcast the signed transaction. Common causes:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 mt-1">
                <li>All configured blockchain APIs rejected the transaction</li>
                <li>Invalid transaction format or signature</li>
                <li>Network fee too low for current mempool conditions</li>
                <li>Destination address format not accepted by APIs</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Multi-Provider Strategy</h4>
              <p className="text-sm text-muted-foreground">
                The backend should attempt broadcasting to multiple blockchain APIs in sequence. 
                If all providers fail, detailed error information should be returned to help diagnose the issue.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Confirmation Delays
            </CardTitle>
            <CardDescription>Understanding Bitcoin network confirmation times</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-1">Expected Confirmation Times</h4>
              <p className="text-sm text-muted-foreground">
                Bitcoin transactions typically confirm in 10-60 minutes depending on network congestion and fee rates:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 mt-1">
                <li>1 confirmation: ~10 minutes (first block)</li>
                <li>3 confirmations: ~30 minutes (recommended for medium-value transactions)</li>
                <li>6 confirmations: ~60 minutes (recommended for high-value transactions)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Stuck Transactions</h4>
              <p className="text-sm text-muted-foreground">
                If a transaction remains unconfirmed for several hours, it may be stuck in the mempool due to:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 mt-1">
                <li>Network fee too low for current conditions</li>
                <li>High network congestion</li>
                <li>Transaction may eventually be dropped (evicted) from mempool</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Monitoring Confirmations</h4>
              <p className="text-sm text-muted-foreground">
                The backend should periodically check transaction status via blockchain APIs and update 
                the confirmation count in transaction records. Users can also monitor transactions on blockchain explorers.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best Practices Section */}
      <BestPracticesSection />
    </div>
  );
}
