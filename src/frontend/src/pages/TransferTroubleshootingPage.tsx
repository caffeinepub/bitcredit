import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, AlertCircle, ShieldCheck, Wifi, Clock } from 'lucide-react';
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

      {/* Notice about backend implementation */}
      <Alert className="mb-6 border-amber-500 bg-amber-50 dark:bg-amber-950">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          <strong>Backend Implementation Note:</strong> The backend now handles mainnet transaction signing and broadcasting. 
          Full transfer troubleshooting features including request history, status tracking, and detailed 
          diagnostics are available for mainnet Segwit transactions.
        </AlertDescription>
      </Alert>

      {/* Mainnet Transaction Troubleshooting Sections */}
      <div className="space-y-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              Mainnet Signing Issues
            </CardTitle>
            <CardDescription>Troubleshooting transaction signing failures</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-1">Signing Status: Pending</h4>
              <p className="text-sm text-muted-foreground">
                The transaction is waiting to be signed by the backend. This usually takes a few seconds. 
                If it remains pending for more than 30 seconds, there may be a backend processing issue.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Signing Status: Failed</h4>
              <p className="text-sm text-muted-foreground">
                The backend was unable to sign the transaction. Common causes include:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 mt-1">
                <li>Invalid destination address format</li>
                <li>Insufficient reserve balance to cover fees</li>
                <li>Backend key management issues</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-emerald-600" />
              Broadcasting & Network Issues
            </CardTitle>
            <CardDescription>Troubleshooting blockchain broadcast problems</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-1">Broadcast Status: Pending</h4>
              <p className="text-sm text-muted-foreground">
                The signed transaction is being broadcast to the Bitcoin network. This typically takes 5-15 seconds.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Broadcast Status: Failed</h4>
              <p className="text-sm text-muted-foreground">
                The transaction could not be broadcast to the network. Common causes:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 mt-1">
                <li>Network connectivity issues with blockchain APIs</li>
                <li>Transaction rejected by mempool (fee too low, double-spend, etc.)</li>
                <li>API rate limiting or service outages</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Broadcast Timeout</h4>
              <p className="text-sm text-muted-foreground">
                If broadcasting takes longer than expected, the backend will retry with alternative API providers. 
                Check the transaction history for updated status.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Confirmation Delays
            </CardTitle>
            <CardDescription>Understanding blockchain confirmation times</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-1">Normal Confirmation Time</h4>
              <p className="text-sm text-muted-foreground">
                Bitcoin blocks are mined approximately every 10 minutes. A transaction typically receives:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 mt-1">
                <li>1st confirmation: 10-20 minutes</li>
                <li>6 confirmations: 60-90 minutes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Delayed Confirmations</h4>
              <p className="text-sm text-muted-foreground">
                If your transaction is taking longer than expected:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 mt-1">
                <li>Check the transaction hash on a blockchain explorer (e.g., blockstream.info)</li>
                <li>Verify the transaction is in the mempool</li>
                <li>Network congestion may cause delays during high-traffic periods</li>
                <li>Reserve-funded fees are optimized for timely confirmation</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-600" />
              Segwit Address Issues
            </CardTitle>
            <CardDescription>Troubleshooting Segwit address format problems</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-1">Supported Address Formats</h4>
              <p className="text-sm text-muted-foreground">
                This application supports native Segwit addresses:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 mt-1">
                <li><strong>P2WPKH:</strong> Addresses starting with "bc1q" (most common)</li>
                <li><strong>P2WSH:</strong> Addresses starting with "bc1q" (multisig/script)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Unsupported Formats</h4>
              <p className="text-sm text-muted-foreground">
                Legacy address formats may not be supported:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground ml-4 mt-1">
                <li>Legacy addresses (starting with "1")</li>
                <li>P2SH addresses (starting with "3")</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">
                If you need to send to a legacy address, ask the recipient for a Segwit address or contact support.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best Practices and Troubleshooting Guide */}
      <BestPracticesSection />
    </div>
  );
}
