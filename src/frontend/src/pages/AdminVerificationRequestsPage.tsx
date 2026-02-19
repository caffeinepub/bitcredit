import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import AdminVerificationRequestsTable from '../components/verification/AdminVerificationRequestsTable';
import { useAdminVerificationRequests, useApproveVerificationRequest, useRejectVerificationRequest } from '../hooks/useQueries';
import { VerificationStatus } from '../backend';
import type { VerificationRequestId } from '../backend';

export default function AdminVerificationRequestsPage() {
  const { data: requests, isLoading } = useAdminVerificationRequests();
  const approveVerification = useApproveVerificationRequest();
  const rejectVerification = useRejectVerificationRequest();

  const allRequests = requests?.map(([id, request]) => ({ ...request, id })) || [];
  const pendingCount = allRequests.filter(r => r.status === VerificationStatus.pending).length;
  const approvedCount = allRequests.filter(r => r.status === VerificationStatus.approved).length;
  const rejectedCount = allRequests.filter(r => r.status === VerificationStatus.rejected).length;

  const handleApprove = async (requestId: VerificationRequestId, comment?: string) => {
    await approveVerification.mutateAsync({ requestId, comment: comment || null });
  };

  const handleReject = async (requestId: VerificationRequestId, comment: string) => {
    await rejectVerification.mutateAsync({ requestId, comment });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">User Verification Requests</h1>
        <p className="text-muted-foreground">
          Review and process user-submitted Bitcoin transaction verifications
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Admin Verification Process</AlertTitle>
        <AlertDescription>
          Users submit Bitcoin transaction IDs for verification. Review each transaction on the blockchain
          using the provided explorer link. Approve valid transactions to credit the user's balance, or reject
          with a reason if the transaction cannot be verified.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Credits issued</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Not verified</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Verification Requests</CardTitle>
          <CardDescription>
            Review and process user-submitted Bitcoin transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminVerificationRequestsTable
            requests={allRequests}
            isLoading={isLoading}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        </CardContent>
      </Card>
    </div>
  );
}
