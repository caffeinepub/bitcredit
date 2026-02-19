import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import type { SegwitAddressType } from '../../types/mainnet';

interface SegwitTransactionDetailsProps {
  destinationAddress: string;
  amount: bigint;
  estimatedFee: bigint;
  segwitAddressType?: SegwitAddressType;
  txHash?: string;
}

export default function SegwitTransactionDetails({
  destinationAddress,
  amount,
  estimatedFee,
  segwitAddressType,
  txHash,
}: SegwitTransactionDetailsProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatBitcoin = (sats: bigint) => {
    const btc = Number(sats) / 100000000;
    return `${sats.toLocaleString()} sats (${btc.toFixed(8)} BTC)`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Segwit Transaction Details</CardTitle>
          {segwitAddressType && (
            <Badge variant="outline" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {segwitAddressType}
            </Badge>
          )}
        </div>
        <CardDescription>Mainnet Bitcoin transaction information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning about mainnet operations */}
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Mainnet Transaction:</strong> This is a real Bitcoin transaction on the mainnet blockchain. 
            Once confirmed, it cannot be reversed.
          </div>
        </div>

        {/* Destination Address */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Destination Address</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-muted px-3 py-2 rounded break-all">
              {destinationAddress}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(destinationAddress, 'Address')}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Amount</p>
          <p className="text-lg font-semibold text-foreground">
            {formatBitcoin(amount)}
          </p>
        </div>

        {/* Estimated Fee */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Network Fee (Reserve-Funded)</p>
          <p className="text-sm text-muted-foreground">
            {formatBitcoin(estimatedFee)}
          </p>
          <p className="text-xs text-muted-foreground">
            Transaction fees are automatically covered by the application reserve.
          </p>
        </div>

        {/* Transaction Hash */}
        {txHash && (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-sm font-medium">Transaction Hash</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted px-3 py-2 rounded break-all">
                {txHash}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(txHash, 'Transaction hash')}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Segwit Info */}
        {segwitAddressType && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Segwit Address Type:</strong> {segwitAddressType}
              <br />
              {segwitAddressType === 'P2WPKH' && 'Pay-to-Witness-Public-Key-Hash (native SegWit)'}
              {segwitAddressType === 'P2WSH' && 'Pay-to-Witness-Script-Hash (native SegWit)'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
