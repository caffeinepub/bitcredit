import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Copy, ExternalLink, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import type { VerificationRequest, VerificationRequestId } from '../../backend';
import { VerificationStatus } from '../../backend';

interface AdminVerificationRequestsTableProps {
  requests: VerificationRequest[];
  isLoading: boolean;
  onApprove: (requestId: VerificationRequestId, comment?: string) => Promise<void>;
  onReject: (requestId: VerificationRequestId, comment: string) => Promise<void>;
}

export default function AdminVerificationRequestsTable({ 
  requests, 
  isLoading, 
  onApprove, 
  onReject 
}: AdminVerificationRequestsTableProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<VerificationRequestId | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | VerificationStatus>('all');

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
    const principalStr = principal.toString();
    if (principalStr.length <= 16) return principalStr;
    return `${principalStr.slice(0, 8)}...${principalStr.slice(-8)}`;
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

  const handleRejectClick = (requestId: VerificationRequestId) => {
    setSelectedRequestId(requestId);
    setRejectComment('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedRequestId || !rejectComment.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    await onReject(selectedRequestId, rejectComment);
    setRejectDialogOpen(false);
    setSelectedRequestId(null);
    setRejectComment('');
  };

  const filteredRequests = statusFilter === 'all' 
    ? requests 
    : requests.filter(r => r.status === statusFilter);

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (a.status === VerificationStatus.pending && b.status !== VerificationStatus.pending) return -1;
    if (a.status !== VerificationStatus.pending && b.status === VerificationStatus.pending) return 1;
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

  return (
    <>
      <div className="mb-4 flex gap-2">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          All
        </Button>
        <Button
          variant={statusFilter === VerificationStatus.pending ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter(VerificationStatus.pending)}
        >
          Pending
        </Button>
        <Button
          variant={statusFilter === VerificationStatus.approved ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter(VerificationStatus.approved)}
        >
          Approved
        </Button>
        <Button
          variant={statusFilter === VerificationStatus.rejected ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter(VerificationStatus.rejected)}
        >
          Rejected
        </Button>
      </div>

      {sortedRequests.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No verification requests found</p>
          <p className="text-sm mt-2">
            {statusFilter === 'all' 
              ? 'Users can submit Bitcoin transactions for verification' 
              : `No ${statusFilter} requests`}
          </p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Amount (BTC)</TableHead>
                <TableHead>Requester</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
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
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {truncatePrincipal(request.requester.toString())}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(request.requester.toString(), 'Principal ID')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
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
                    {request.status === VerificationStatus.pending ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => onApprove(request.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRejectClick(request.id)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {request.reviewComment || '-'}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Verification Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this verification request. This will be visible to the user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-comment">Rejection Reason</Label>
            <Textarea
              id="reject-comment"
              placeholder="e.g., Transaction not found on blockchain, incorrect amount, etc."
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm}>
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
