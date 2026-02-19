import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import type { VerificationRequest } from '../../backend';
import { VerificationStatus } from '../../backend';

interface UserVerificationHistoryTableProps {
  requests: VerificationRequest[];
  isLoading: boolean;
}

export default function UserVerificationHistoryTable({ requests, isLoading }: UserVerificationHistoryTableProps) {
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

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case VerificationStatus.pending:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case VerificationStatus.approved:
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case VerificationStatus.rejected:
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const sortedRequests = [...requests].sort((a, b) => {
    return Number(b.submittedAt - a.submittedAt);
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

  if (sortedRequests.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No verification requests yet</p>
        <p className="text-sm mt-2">Submit your first Bitcoin transaction above</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Request ID</TableHead>
            <TableHead>Transaction ID</TableHead>
            <TableHead>Amount (BTC)</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Comment</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRequests.map((request) => (
            <TableRow key={request.id.toString()}>
              <TableCell>
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  #{request.id.toString()}
                </code>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {request.transactionId.slice(0, 8)}...{request.transactionId.slice(-8)}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(request.transactionId, 'Transaction ID')}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <a
                      href={`https://blockstream.info/tx/${request.transactionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm">{formatBTC(request.amount)}</span>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatDate(request.submittedAt)}
                </span>
              </TableCell>
              <TableCell>
                {getStatusBadge(request.status)}
              </TableCell>
              <TableCell>
                {request.reviewComment ? (
                  <span className="text-sm text-muted-foreground">{request.reviewComment}</span>
                ) : (
                  <span className="text-sm text-muted-foreground italic">-</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
