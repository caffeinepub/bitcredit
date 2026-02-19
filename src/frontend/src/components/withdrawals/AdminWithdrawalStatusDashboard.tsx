import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetAllWithdrawalRequests, useMarkWithdrawalAsPaid, useRejectWithdrawal } from '../../hooks/useQueries';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import AdminWithdrawalRequestsTable from './AdminWithdrawalRequestsTable';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WithdrawalStatus } from '../../backend';

export default function AdminWithdrawalStatusDashboard() {
  const { data: requests, isLoading } = useGetAllWithdrawalRequests();
  const markPaidMutation = useMarkWithdrawalAsPaid();
  const rejectMutation = useRejectWithdrawal();

  const pendingCount = requests?.filter(r => r.status === WithdrawalStatus.PENDING).length || 0;
  const paidCount = requests?.filter(r => r.status === WithdrawalStatus.PAID).length || 0;
  const rejectedCount = requests?.filter(r => r.status === WithdrawalStatus.REJECTED).length || 0;

  const handleMarkPaid = async (requestId: bigint) => {
    if (!confirm('Mark this withdrawal request as paid? This action cannot be undone.')) {
      return;
    }

    try {
      await markPaidMutation.mutateAsync(requestId);
      toast.success('Withdrawal marked as paid');
    } catch (error: any) {
      toast.error(error.message || 'Failed to mark withdrawal as paid');
    }
  };

  const handleReject = async (requestId: bigint, reason: string) => {
    if (!confirm(`Reject this withdrawal request with reason: "${reason}"?`)) {
      return;
    }

    try {
      await rejectMutation.mutateAsync({ requestId, reason });
      toast.success('Withdrawal rejected');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject withdrawal');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Withdrawal Management</h1>
        <p className="text-muted-foreground">Review and process user withdrawal requests</p>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Manual Processing:</strong> This app does not automatically execute external payment API calls.
          Mark requests as "Paid" after you've manually processed the payment through PayPal, Stripe, or other methods.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <CardTitle>Pending</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-12 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-4xl font-bold">{pendingCount}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <CardTitle>Paid</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-12 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-4xl font-bold">{paidCount}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              <CardTitle>Rejected</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-12 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-4xl font-bold">{rejectedCount}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Requests</CardTitle>
          <CardDescription>All system withdrawal requests</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <AdminWithdrawalRequestsTable
              requests={requests || []}
              onMarkPaid={handleMarkPaid}
              onReject={handleReject}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
