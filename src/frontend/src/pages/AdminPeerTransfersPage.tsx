import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetAllPeerTransfers } from '../hooks/useQueries';
import { PeerTransferStatus } from '../backend';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPeerTransfersPage() {
  const { data: transfers, isLoading } = useGetAllPeerTransfers();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | PeerTransferStatus>('all');

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(text);
      toast.success(`${label} copied to clipboard`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const filteredTransfers = transfers?.filter(transfer => {
    if (statusFilter === 'all') return true;
    return transfer.status === statusFilter;
  }) || [];

  const sortedTransfers = [...filteredTransfers].sort((a, b) => 
    Number(b.createdAt - a.createdAt)
  );

  const getStatusBadge = (status: PeerTransferStatus) => {
    switch (status) {
      case PeerTransferStatus.pending:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">Pending</Badge>;
      case PeerTransferStatus.approved:
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Approved</Badge>;
      case PeerTransferStatus.rejected:
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Rejected</Badge>;
      case PeerTransferStatus.deleted:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">Deleted</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = transfers?.filter(t => t.status === PeerTransferStatus.pending).length || 0;
  const approvedCount = transfers?.filter(t => t.status === PeerTransferStatus.approved).length || 0;
  const rejectedCount = transfers?.filter(t => t.status === PeerTransferStatus.rejected).length || 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Peer-to-Peer Transfer Management</h1>
        <p className="text-muted-foreground">
          View and monitor all peer-to-peer credit transfers in the system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Declined transfers</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Transfers</CardTitle>
          <CardDescription>Complete history of peer-to-peer credit transfers</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value={PeerTransferStatus.pending}>Pending</TabsTrigger>
              <TabsTrigger value={PeerTransferStatus.approved}>Approved</TabsTrigger>
              <TabsTrigger value={PeerTransferStatus.rejected}>Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter}>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              ) : sortedTransfers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No transfers found
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Sender</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedTransfers.map((transfer) => (
                        <TableRow key={transfer.id.toString()}>
                          <TableCell className="font-mono text-xs">
                            {transfer.id.toString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs truncate max-w-[120px]">
                                {transfer.sender.toString()}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => copyToClipboard(transfer.sender.toString(), 'Sender ID')}
                              >
                                {copiedId === transfer.sender.toString() ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs truncate max-w-[120px]">
                                {transfer.recipient.toString()}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => copyToClipboard(transfer.recipient.toString(), 'Recipient ID')}
                              >
                                {copiedId === transfer.recipient.toString() ? (
                                  <Check className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {transfer.amount.toString()} sats
                          </TableCell>
                          <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(Number(transfer.createdAt) / 1000000).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
