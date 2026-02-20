import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerPrimaryAddress, useGetCallerAddressHistory } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Key, ShieldAlert, Info, ShieldCheck } from 'lucide-react';
import LoggedOutSignInPanel from '../components/auth/LoggedOutSignInPanel';
import WalletAddressList from '../components/wallet/WalletAddressList';
import PublicKeyDisplay from '../components/wallet/PublicKeyDisplay';
import PrivateKeyDisplay from '../components/wallet/PrivateKeyDisplay';
import CustodialWarningModal from '../components/wallet/CustodialWarningModal';
import SecurityEducationPanel from '../components/wallet/SecurityEducationPanel';

export default function WalletKeysPage() {
  const { identity } = useInternetIdentity();
  const { data: primaryAddress, isLoading: primaryLoading } = useGetCallerPrimaryAddress();
  const { data: addressHistory, isLoading: historyLoading } = useGetCallerAddressHistory();
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [hasAcknowledgedWarning, setHasAcknowledgedWarning] = useState(false);

  const isAuthenticated = !!identity;

  useEffect(() => {
    const warningKey = `wallet-keys-warning-${identity?.getPrincipal().toString()}`;
    const hasAcknowledged = localStorage.getItem(warningKey);
    
    if (!hasAcknowledged && isAuthenticated) {
      setShowWarningModal(true);
    } else {
      setHasAcknowledgedWarning(true);
    }
  }, [identity, isAuthenticated]);

  const handleWarningAcknowledged = () => {
    const warningKey = `wallet-keys-warning-${identity?.getPrincipal().toString()}`;
    localStorage.setItem(warningKey, 'true');
    setHasAcknowledgedWarning(true);
    setShowWarningModal(false);
  };

  if (!isAuthenticated) {
    return <LoggedOutSignInPanel />;
  }

  const isLoading = primaryLoading || historyLoading;

  return (
    <>
      <CustodialWarningModal
        open={showWarningModal}
        onAcknowledge={handleWarningAcknowledged}
      />

      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Key className="h-8 w-8" />
              Wallet Keys & Security
            </h1>
            <p className="text-muted-foreground">
              View your Bitcoin wallet information and understand threshold ECDSA security
            </p>
          </div>

          <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-800 dark:text-blue-200">
              Enhanced Security Through Threshold ECDSA
            </AlertTitle>
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              This application uses the Internet Computer's threshold ECDSA protocol for Bitcoin signing.
              Your Bitcoin is secured by distributed cryptography across multiple IC nodes, providing
              enhanced security compared to traditional private key storage. Private keys never exist in
              exportable form - they exist only as secret shares distributed across the network.
            </AlertDescription>
          </Alert>

          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Important Security Notice</AlertTitle>
            <AlertDescription>
              This page displays sensitive cryptographic information. While private keys are not directly
              accessible (by design), your public keys and addresses should still be handled carefully.
              Never share your Internet Identity credentials with anyone.
            </AlertDescription>
          </Alert>

          {!hasAcknowledgedWarning && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Access Restricted
                </CardTitle>
                <CardDescription>
                  You must acknowledge the security warnings before viewing wallet information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setShowWarningModal(true)} variant="destructive">
                  Review Security Warnings
                </Button>
              </CardContent>
            </Card>
          )}

          {hasAcknowledgedWarning && (
            <>
              <SecurityEducationPanel />

              <WalletAddressList
                addresses={addressHistory || []}
                primaryAddress={primaryAddress ?? null}
                isLoading={isLoading}
              />

              {primaryAddress && (
                <>
                  <PublicKeyDisplay publicKey={primaryAddress.publicKey} />
                  <PrivateKeyDisplay />
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
