import { Button } from '@/components/ui/button';
import { Wallet, Loader2, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useGenerateSelfCustodyWallet } from '@/hooks/useQueries';
import { toast } from 'sonner';
import { normalizeError } from '@/utils/errors';

interface GenerateSelfCustodyWalletButtonProps {
  disabled?: boolean;
}

export default function GenerateSelfCustodyWalletButton({ disabled }: GenerateSelfCustodyWalletButtonProps) {
  const generateWallet = useGenerateSelfCustodyWallet();

  const handleGenerate = async () => {
    try {
      const result = await generateWallet.mutateAsync();
      toast.success('Self-Custody Wallet Generated!', {
        description: `New wallet address: ${result.address}`,
        duration: 5000,
      });
    } catch (error: any) {
      const errorMessage = normalizeError(error);
      toast.error('Failed to Generate Wallet', {
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  return (
    <div className="space-y-4">
      <Alert className="border-amber-500/50 bg-amber-500/10">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
          <strong>Backend Implementation Required:</strong> The self-custody wallet generation feature requires backend
          support that is not yet implemented. This includes generating new Bitcoin key pairs using the management
          canister ECDSA API, deriving addresses, storing derivation paths per user, and tracking wallet metadata.
        </AlertDescription>
      </Alert>

      <Button onClick={handleGenerate} disabled={disabled || generateWallet.isPending} className="gap-2">
        {generateWallet.isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating Wallet...
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4" />
            Generate New Self-Custody Wallet
          </>
        )}
      </Button>

      <p className="text-sm text-muted-foreground">
        Once generated, you will receive a Bitcoin address. The private key is derived using threshold ECDSA and stored
        securely by the Internet Computer. Make sure to understand the security model before transferring funds.
      </p>
    </div>
  );
}
