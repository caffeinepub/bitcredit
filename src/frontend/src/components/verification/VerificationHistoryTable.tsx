import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import type { BitcoinPurchaseRecord } from '../../backend';

interface VerificationHistoryTableProps {
  purchases: Array<[string, BitcoinPurchaseRecord]>;
  isLoading: boolean;
}

export default function VerificationHistoryTable({ purchases, isLoading }: VerificationHistoryTableProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatBTC = (satoshis: bigint): string => {
    const btc = Number(satoshis) / 100000000;
    return btc.toFixed(8);
  };

  const formatDate = (timestamp: bigint): string => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString();
  };

  const truncatePrincipal = (principal: string): string => {
    if (principal.length <= 16) return principal;
    return `${principal.slice(0, 8)}...${principal.slice(-8)}`;
  };

  const sortedPurchases = [...purchases].sort((a, b) => {
    return Number(b[1].verifiedAt - a[1].verifiedAt);
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (sortedPurchases.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No Bitcoin purchases verified yet</p>
        <p className="text-sm mt-2">Use the form above to record your first verification</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Amount (BTC)</TableHead>
            <TableHead>Verified Date</TableHead>
            <TableHead>Verified By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPurchases.map(([txid, record]) => (
            <TableRow key={txid}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {txid.slice(0, 8)}...{txid.slice(-8)}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(txid, 'Transaction ID')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <a
                    href={`https://blockstream.info/tx/${txid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </a>
                </div>
              </TableCell>
              <TableCell className="font-mono">
                {formatBTC(record.amount)} BTC
              </TableCell>
              <TableCell className="text-sm">
                {formatDate(record.verifiedAt)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {truncatePrincipal(record.verifiedBy.toString())}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(record.verifiedBy.toString(), 'Principal ID')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
