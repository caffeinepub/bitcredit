import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface SelfCustodyTransferSuccessProps {
  onReset: () => void;
  transferData: {
    transferId: string;
    address: string;
    amount: string;
  };
}

export default function SelfCustodyTransferSuccess({ onReset, transferData }: SelfCustodyTransferSuccessProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const openBlockchainExplorer = (address: string) => {
    // This would open a blockchain explorer - placeholder for now
    window.open(`https://blockstream.info/address/${address}`, '_blank');
  };

  return (
    <div className="space-y-4">
      <Alert className="border-green-500/50 bg-green-500/10">
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-900 dark:text-green-100">Transfer Successful!</AlertTitle>
        <AlertDescription className="text-green-800 dark:text-green-200">
          Your Bitcoin has been successfully transferred to your self-custody wallet. The transfer is now pending
          confirmation.
        </AlertDescription>
      </Alert>

      <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
        <div>
          <p className="text-sm font-medium mb-1">Transfer ID</p>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-background px-2 py-1 rounded flex-1 truncate">{transferData.transferId}</code>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(transferData.transferId, 'Transfer ID')}
              className="gap-1"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-1">Destination Address</p>
          <div className="flex items-center gap-2">
            <code className="text-xs bg-background px-2 py-1 rounded flex-1 truncate">{transferData.address}</code>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(transferData.address, 'Address')}
              className="gap-1"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openBlockchainExplorer(transferData.address)}
              className="gap-1"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-1">Amount Transferred</p>
          <p className="text-sm">{transferData.amount} BTC</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={onReset} variant="outline" className="flex-1">
          Make Another Transfer
        </Button>
      </div>
    </div>
  );
}
