import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Clock, Coins } from 'lucide-react';

export default function MainnetTransactionAlert() {
  return (
    <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
      <ShieldAlert className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-900 dark:text-blue-100">
        Mainnet Transaction Information
      </AlertTitle>
      <AlertDescription className="text-blue-800 dark:text-blue-200 space-y-2">
        <div className="flex items-start gap-2">
          <ShieldAlert className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Irreversible:</strong> Mainnet Bitcoin transactions cannot be reversed once confirmed on the blockchain.
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Coins className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Reserve-Funded Fees:</strong> Network transaction fees are automatically covered by the application reserve. You only pay the transfer amount.
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Confirmation Time:</strong> Transactions typically receive 6 confirmations within 60 minutes. First confirmation usually occurs within 10-20 minutes.
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
          <strong>Segwit Support:</strong> This application supports native Segwit addresses (P2WPKH and P2WSH) for lower fees and better efficiency.
        </div>
      </AlertDescription>
    </Alert>
  );
}
