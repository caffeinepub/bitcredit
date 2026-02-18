import { useState } from 'react';
import type { WithdrawalRequest } from '../../backend';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, Copy, Check, Inbox } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMarkWithdrawalPaid, useRejectWithdrawalRequest } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface AdminWithdrawalRequestsTableProps {
  requests: WithdrawalRequest[];
  context?: 'admin' | 'user';
}

export default function AdminWithdrawalRequestsTable({ requests, context = 'admin' }: AdminWithdrawalRequestsTableProps) {
  const [confirmPaidDialog, setConfirmPaidDialog] = useState<bigint | null>(null);
  const [rejectDialog, setRejectDialog] = useState<bigint | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [copiedPrincipal, setCopiedPrincipal] = useState<string | null>(null);

  const { mutate: markPaid, isPending: isMarkingPaid } = useMarkWithdrawalPaid();
  const { mutate: rejectRequest, isPending: isRejecting } = useRejectWithdrawalRequest();

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

  const handleCopyPrincipal = (principal: string) => {
    navigator.clipboard.writeText(principal);
    setCopiedPrincipal(principal);
    toast.success('Principal ID copied to clipboard');
    setTimeout(() => setCopiedPrincipal(null), 2000);
  };

  const handleMarkPaid = (requestId: bigint) => {
    markPaid(requestId, {
      onSuccess: () => {
        setConfirmPaidDialog(null);
      },
      onError: (error: any) => {
        toast.error(`Failed to mark as paid: ${error.message || 'Unknown error'}`);
      },
    });
  };

  const handleReject = (requestId: bigint) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    rejectRequest(
      { requestId, reason: rejectionReason.trim() },
      {
        onSuccess: () => {
          setRejectDialog(null);
          setRejectionReason('');
        },
        onError: (error: any) => {
          toast.error(`Failed to reject request: ${error.message || 'Unknown error'}`);
        },
      }
    );
  };

  // Sort by timestamp descending (newest first), with PENDING requests prioritized
  const sortedRequests = [...requests].sort((a, b) => {
    // Prioritize PENDING status
    if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
    if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
    // Then sort by timestamp descending
    return Number(b.timestamp - a.timestamp);
  });

  // Filter requests by status
  const pendingRequests = sortedRequests.filter((r) => r.status === 'PENDING');
  const paidRequests = sortedRequests.filter((r) => r.status === 'PAID');
  const rejectedRequests = sortedRequests.filter((r) => r.status === 'REJECTED');

  const renderRequestsTable = (filteredRequests: WithdrawalRequest[], emptyMessage: string) => {
    if (filteredRequests.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
            <Inbox className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold mb-1">No requests found</h3>
          <p className="text-muted-foreground text-xs">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method / Account</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.map((request) => {
              const principalStr = request.owner.toString();
              const isPending = request.status === 'PENDING';

              return (
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
                    <div className="flex items-center gap-1">
                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded max-w-[120px] truncate">
                        {principalStr}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopyPrincipal(principalStr)}
                      >
                        {copiedPrincipal === principalStr ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getStatusBadge(request.status)}
                      {request.status === 'REJECTED' && request.failureReason && (
                        <div className="text-xs text-destructive mt-1 max-w-[200px]">
                          {request.failureReason}
                        </div>
                      )}
                      {request.status === 'PAID' && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Administrative record only
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {isPending && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setConfirmPaidDialog(request.id)}
                          disabled={isMarkingPaid || isRejecting}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Mark as Paid
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setRejectDialog(request.id)}
                          disabled={isMarkingPaid || isRejecting}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-4">
        <Alert>
          <AlertDescription className="text-sm">
            <strong>⚠️ Manual External Processing Required:</strong> This app does <strong>NOT</strong> automatically
            call or fund external payment APIs (PayPal, Stripe, Venmo, bank transfers, etc.). You must process payouts
            externally before marking them as "Paid" in this system. Marking a request as "Paid" only updates the
            app's internal audit trail—it does not send funds.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              Pending
              {pendingRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                  {pendingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="paid" className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Paid
              {paidRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                  {paidRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <XCircle className="h-4 w-4" />
              Rejected
              {rejectedRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                  {rejectedRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <Inbox className="h-4 w-4" />
              All
              {requests.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                  {requests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-4">
            {renderRequestsTable(pendingRequests, 'No pending payout requests at this time')}
          </TabsContent>

          <TabsContent value="paid" className="space-y-4 mt-4">
            {renderRequestsTable(paidRequests, 'No paid payout requests yet')}
            {paidRequests.length > 0 && (
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Note:</strong> These requests have been marked as paid in the system. This is an
                  administrative record only and does not indicate that funds were automatically transferred.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4 mt-4">
            {renderRequestsTable(rejectedRequests, 'No rejected payout requests')}
            {rejectedRequests.length > 0 && (
              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Note:</strong> Rejected payout requests automatically restore credits to the user's available
                  balance. The rejection reason is shown in the table above.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4 mt-4">
            {renderRequestsTable(sortedRequests, 'No payout requests have been submitted yet')}
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirm Mark as Paid Dialog */}
      <AlertDialog open={confirmPaidDialog !== null} onOpenChange={(open) => !open && setConfirmPaidDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Mark as Paid</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to mark request{' '}
                <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                  #{confirmPaidDialog?.toString()}
                </code>{' '}
                as PAID?
              </p>
              <Alert className="mt-2">
                <AlertDescription className="text-xs">
                  <strong>⚠️ Important:</strong> This action only updates the status in the app's records. Make sure
                  you have already sent the funds to the user via your external payment method (PayPal, Stripe, bank
                  transfer, etc.) before confirming. This app does not automatically execute or fund any external
                  payment API calls.
                </AlertDescription>
              </Alert>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isMarkingPaid}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmPaidDialog && handleMarkPaid(confirmPaidDialog)}
              disabled={isMarkingPaid}
              className="bg-green-600 hover:bg-green-700"
            >
              {isMarkingPaid ? 'Processing...' : 'Confirm - Mark as Paid'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Request Dialog */}
      <AlertDialog
        open={rejectDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRejectDialog(null);
            setRejectionReason('');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Payout Request</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to reject request{' '}
                <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">#{rejectDialog?.toString()}</code>.
                The user's credits will be automatically restored.
              </p>
              <div className="space-y-2">
                <Label htmlFor="rejectionReason" className="text-sm font-semibold">
                  Rejection Reason (Required)
                </Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Enter a clear reason for rejecting this request..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[100px]"
                  disabled={isRejecting}
                />
                <p className="text-xs text-muted-foreground">
                  This reason will be visible to the user and stored in the transaction history.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRejecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => rejectDialog && handleReject(rejectDialog)}
              disabled={isRejecting || !rejectionReason.trim()}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRejecting ? 'Processing...' : 'Confirm Rejection'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
