import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { useGetSelfCustodyTransferHistory } from '@/hooks/useQueries';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { SelfCustodyTransferStatus } from '@/types/selfcustody';
import UsdEstimateLine from '@/components/balance/UsdEstimateLine';

export default function SelfCustodyTransferHistoryTable() {
  const { data: transfers, isLoading } = useGetSelfCustodyTransferHistory();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const formatBtc = (satoshis: bigint) => {
    return (Number(satoshis) / 100000000).toFixed(8);
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: SelfCustodyTransferStatus) => {
    switch (status) {
      case SelfCustodyTransferStatus.Pending:
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/50">Pending</Badge>;
      case SelfCustodyTransferStatus.Confirmed:
        return <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/50">Confirmed</Badge>;
      case SelfCustodyTransferStatus.Failed:
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!transfers || transfers.length === 0) {
    return (
      <div className="space-y-4">
        <Alert className="border-blue-500/50 bg-blue-500/10">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Backend Implementation Required:</strong> The self-custody transfer history feature requires backend
            support that is not yet implemented. This includes querying transfer records, tracking transfer status, and
            returning transfer history sorted by timestamp.
          </AlertDescription>
        </Alert>

        <div className="border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">No transfer history yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Your transfers to self-custody wallets will appear here once you make your first transfer.
          </p>
        </div>
      </div>
    );
  }

  // Sort transfers by timestamp descending (newest first)
  const sortedTransfers = [...transfers].sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Transfer History ({sortedTransfers.length})</h3>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transfer ID</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedTransfers.map((transfer) => (
              <TableRow key={transfer.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="text-xs">{transfer.id.slice(0, 8)}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(transfer.id, 'Transfer ID')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="text-xs">{truncateAddress(transfer.destination)}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(transfer.destination, 'Address')}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{formatBtc(transfer.amount)} BTC</p>
                    <UsdEstimateLine btcAmount={transfer.amount} btcPriceUsd={null} />
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{formatDate(transfer.timestamp)}</p>
                </TableCell>
                <TableCell>{getStatusBadge(transfer.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
