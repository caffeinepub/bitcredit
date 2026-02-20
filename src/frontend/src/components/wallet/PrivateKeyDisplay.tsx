import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Lock, ShieldAlert, ShieldCheck } from 'lucide-react';
import PrivateKeyRevealConfirmation from './PrivateKeyRevealConfirmation';
import KeyExportInstructions from './KeyExportInstructions';

export default function PrivateKeyDisplay() {
  const [hasRevealed, setHasRevealed] = useState(false);

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Lock className="h-5 w-5" />
          Private Key Access
        </CardTitle>
        <CardDescription>
          Understanding threshold ECDSA security architecture
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">
            Enhanced Security Through Threshold ECDSA
          </AlertTitle>
          <AlertDescription className="text-blue-800 dark:text-blue-200 space-y-2">
            <p>
              This application uses the Internet Computer's threshold ECDSA protocol for Bitcoin signing.
              This provides <strong>enhanced security</strong> compared to traditional private key storage.
            </p>
            <p className="font-semibold">
              Private keys never exist in reconstructed form - they exist only as secret shares distributed
              across IC subnet nodes.
            </p>
          </AlertDescription>
        </Alert>

        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>No Direct Private Key Access</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              For security reasons, this application <strong>cannot</strong> provide direct access to private keys.
              This is not a limitation - it's a fundamental security feature of threshold ECDSA.
            </p>
            <p>
              All Bitcoin transactions are signed using distributed cryptography across multiple IC nodes,
              without ever reconstructing the private key.
            </p>
          </AlertDescription>
        </Alert>

        {!hasRevealed ? (
          <PrivateKeyRevealConfirmation onReveal={() => setHasRevealed(true)} />
        ) : (
          <div className="space-y-4">
            <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 dark:text-amber-200">
                Why Private Keys Are Not Available
              </AlertTitle>
              <AlertDescription className="text-amber-800 dark:text-amber-200 space-y-2">
                <p>
                  The Internet Computer's threshold ECDSA protocol is specifically designed so that private keys
                  <strong> never exist in a form that can be exported or viewed</strong>.
                </p>
                <p>
                  Instead of a single private key that could be stolen or lost, your Bitcoin is secured by:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Secret shares distributed across 13+ independent IC subnet nodes</li>
                  <li>Threshold cryptography requiring consensus to sign transactions</li>
                  <li>Your Internet Identity authentication</li>
                  <li>Byzantine fault tolerance protecting against node compromise</li>
                </ul>
                <p className="font-semibold mt-2">
                  This architecture provides <em>greater security</em> than traditional private key storage,
                  where a single compromised key means total loss of funds.
                </p>
              </AlertDescription>
            </Alert>

            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <ShieldCheck className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">
                You Still Have Full Control
              </AlertTitle>
              <AlertDescription className="text-green-800 dark:text-green-200 space-y-2">
                <p>
                  Even without direct private key access, you maintain complete control over your Bitcoin:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Only you can authorize transactions through your Internet Identity</li>
                  <li>You can send Bitcoin to any address at any time</li>
                  <li>Your public Bitcoin address is yours alone</li>
                  <li>No third party can access or freeze your funds</li>
                </ul>
                <p className="font-semibold mt-2">
                  The difference: Instead of protecting a single private key, you're protected by
                  distributed cryptography across a decentralized network.
                </p>
              </AlertDescription>
            </Alert>

            <KeyExportInstructions />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
