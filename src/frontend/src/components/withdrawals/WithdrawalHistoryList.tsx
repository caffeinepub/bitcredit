import type { WithdrawalRequest } from '../../backend';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WithdrawalHistoryListProps {
  requests: WithdrawalRequest[];
}

export default function WithdrawalHistoryList({ requests }: WithdrawalHistoryListProps) {
  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'PAID':
        return (
          <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
            <CheckCircle className="h-3 w-3" />
            Paid
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
          <Clock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold mb-1">No payout requests yet</h3>
        <p className="text-muted-foreground text-xs">
          Your payout requests will appear here once you submit one
        </p>
      </div>
    );
  }

  // Sort by timestamp descending (newest first)
  const sortedRequests = [...requests].sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedRequests.map((request) => (
              <TableRow key={request.id.toString()}>
                <TableCell className="font-mono text-xs">{request.id.toString()}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatTimestamp(request.timestamp)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <img
                      src="/assets/generated/credit-coin-icon.dim_128x128.png"
                      alt="Credit"
                      className="h-4 w-4"
                    />
                    <span className="font-semibold">{request.amount.toString()} BTC</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">{request.method}</div>
                    {request.account && (
                      <div className="text-xs text-muted-foreground font-mono">{request.account}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {getStatusBadge(request.status)}
                    {request.status === 'REJECTED' && request.failureReason && (
                      <div className="text-xs text-destructive mt-1">{request.failureReason}</div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {sortedRequests.some((r) => r.status === 'REJECTED') && (
        <Alert>
          <AlertDescription className="text-sm">
            <strong>Note:</strong> Rejected payout requests automatically restore your credits to your available
            balance. The rejection reason is shown above for your reference.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
