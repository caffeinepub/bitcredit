import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import type { WithdrawalRequest } from '../../backend';
import { WithdrawalStatus } from '../../backend';

interface AdminWithdrawalRequestsTableProps {
  requests: WithdrawalRequest[];
  onApprove?: (requestId: bigint) => void;
  onReject?: (requestId: bigint, reason: string) => void;
  onMarkPaid?: (requestId: bigint) => void;
}

export default function AdminWithdrawalRequestsTable({
  requests,
  onApprove,
  onReject,
  onMarkPaid,
}: AdminWithdrawalRequestsTableProps) {
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | 'ALL'>(WithdrawalStatus.PENDING);
  const [sortColumn, setSortColumn] = useState<'timestamp' | 'amount'>('timestamp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const filteredRequests = requests.filter(r => 
    statusFilter === 'ALL' || r.status === statusFilter
  );

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const multiplier = sortDirection === 'asc' ? 1 : -1;
    if (sortColumn === 'timestamp') {
      return multiplier * (Number(a.timestamp) - Number(b.timestamp));
    } else {
      return multiplier * (Number(a.amount) - Number(b.amount));
    }
  });

  const toggleSort = (column: 'timestamp' | 'amount') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusBadge = (status: WithdrawalStatus) => {
    switch (status) {
      case WithdrawalStatus.PENDING:
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">Pending</Badge>;
      case WithdrawalStatus.PAID:
        return <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400">Paid</Badge>;
      case WithdrawalStatus.REJECTED:
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusValue = (status: WithdrawalStatus | 'ALL'): string => {
    if (status === 'ALL') return 'ALL';
    return status;
  };

  return (
    <Tabs value={getStatusValue(statusFilter)} onValueChange={(v) => {
      if (v === 'ALL') {
        setStatusFilter('ALL');
      } else {
        setStatusFilter(v as WithdrawalStatus);
      }
    }}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value={WithdrawalStatus.PENDING}>Pending</TabsTrigger>
        <TabsTrigger value={WithdrawalStatus.PAID}>Paid</TabsTrigger>
        <TabsTrigger value={WithdrawalStatus.REJECTED}>Rejected</TabsTrigger>
        <TabsTrigger value="ALL">All</TabsTrigger>
      </TabsList>

      <TabsContent value={getStatusValue(statusFilter)} className="mt-4">
        {sortedRequests.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground">
              No {statusFilter === 'ALL' ? '' : statusFilter.toLowerCase()} requests
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => toggleSort('amount')}
                  >
                    Amount {sortColumn === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => toggleSort('timestamp')}
                  >
                    Date {sortColumn === 'timestamp' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </TableHead>
                  {statusFilter === WithdrawalStatus.PENDING && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-mono">{request.id.toString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <code className="text-xs truncate max-w-[120px]">
                          {request.owner.toString()}
                        </code>
                        <button
                          onClick={() => copyToClipboard(request.owner.toString())}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      ₿ {(Number(request.amount) / 100_000_000).toFixed(8)}
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>{request.method}</TableCell>
                    <TableCell className="font-mono text-xs max-w-[150px] truncate">
                      {request.account || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(Number(request.timestamp) / 1_000_000).toLocaleDateString()}
                    </TableCell>
                    {statusFilter === WithdrawalStatus.PENDING && (
                      <TableCell>
                        <div className="flex gap-1">
                          {onMarkPaid && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => onMarkPaid(request.id)}
                            >
                              Mark Paid
                            </Button>
                          )}
                          {onReject && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                const reason = prompt('Enter rejection reason:');
                                if (reason) onReject(request.id, reason);
                              }}
                            >
                              Reject
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
