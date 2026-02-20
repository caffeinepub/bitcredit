import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Wallet } from 'lucide-react';
import SelfCustodySecurityModal from '../components/selfcustody/SelfCustodySecurityModal';
import SelfCustodyEducationPanel from '../components/selfcustody/SelfCustodyEducationPanel';
import GenerateSelfCustodyWalletButton from '../components/selfcustody/GenerateSelfCustodyWalletButton';
import SelfCustodyWalletList from '../components/selfcustody/SelfCustodyWalletList';
import TransferToSelfCustodyForm from '../components/selfcustody/TransferToSelfCustodyForm';
import SelfCustodyTransferHistoryTable from '../components/selfcustody/SelfCustodyTransferHistoryTable';
import { useSelfCustodyEducationAcknowledged } from '../hooks/useSelfCustodyEducationAcknowledged';

export default function SelfCustodyWalletsPage() {
  const { identity } = useInternetIdentity();
  const { acknowledged, markAsAcknowledged } = useSelfCustodyEducationAcknowledged();

  if (!identity) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please sign in with Internet Identity to access self-custody wallet features.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <SelfCustodySecurityModal
        open={!acknowledged}
        onAcknowledge={markAsAcknowledged}
      />

      <div className="flex items-center gap-3">
        <Wallet className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Self-Custody Wallets</h1>
          <p className="text-muted-foreground">
            Manage your self-custody Bitcoin addresses with full control
          </p>
        </div>
      </div>

      <Alert className="border-amber-500/50 bg-amber-500/10">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-900 dark:text-amber-100">Important Security Notice</AlertTitle>
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          Self-custody wallets give you complete control over your Bitcoin, but also complete responsibility for security.
          Unlike threshold ECDSA managed addresses, the platform cannot help recover lost self-custody wallet keys.
        </AlertDescription>
      </Alert>

      <SelfCustodyEducationPanel />

      <Card>
        <CardHeader>
          <CardTitle>Generate New Self-Custody Wallet</CardTitle>
          <CardDescription>
            Create a new Bitcoin address that you control directly. You will be responsible for backing up and securing the private key.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GenerateSelfCustodyWalletButton disabled={!acknowledged} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Self-Custody Wallets</CardTitle>
          <CardDescription>
            All self-custody wallet addresses you've generated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SelfCustodyWalletList />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transfer to Self-Custody Wallet</CardTitle>
          <CardDescription>
            Send BTC from your main balance to one of your self-custody addresses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransferToSelfCustodyForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transfer History</CardTitle>
          <CardDescription>
            All transfers to your self-custody wallets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SelfCustodyTransferHistoryTable />
        </CardContent>
      </Card>
    </div>
  );
}
