import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, ArrowRight, Info } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { WithdrawalRequest } from '../../backend';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WithdrawalStatusSummaryCardProps {
  requests: WithdrawalRequest[];
}

export default function WithdrawalStatusSummaryCard({ requests }: WithdrawalStatusSummaryCardProps) {
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const paidCount = requests.filter((r) => r.status === 'PAID').length;
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length;

  if (requests.length === 0) {
    return (
      <Card className="financial-card">
        <CardHeader>
          <CardTitle>Withdrawal Status</CardTitle>
          <CardDescription>Track your payout requests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No withdrawal requests yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Submit a payout request to convert your credits to external funds.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link to="/withdraw">
              Request Withdrawal
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle>Withdrawal Status</CardTitle>
        <CardDescription>Your payout request summary</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <Clock className="h-5 w-5 text-amber-600 mb-2" />
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-100">{pendingCount}</div>
            <div className="text-xs text-amber-700 dark:text-amber-300 font-medium">Pending</div>
          </div>

          <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
            <CheckCircle className="h-5 w-5 text-green-600 mb-2" />
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{paidCount}</div>
            <div className="text-xs text-green-700 dark:text-green-300 font-medium">Paid</div>
          </div>

          <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted border">
            <XCircle className="h-5 w-5 text-muted-foreground mb-2" />
            <div className="text-2xl font-bold">{rejectedCount}</div>
            <div className="text-xs text-muted-foreground font-medium">Rejected</div>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>What "Paid" means:</strong> When a withdrawal is marked as "Paid," it means an administrator has recorded in the app that your payout has been processed externally. This is an administrative audit record only—the app does not automatically send funds. Payouts are processed manually by administrators outside of this application.
          </AlertDescription>
        </Alert>

        <Button asChild variant="outline" className="w-full">
          <Link to="/withdraw">
            View All Withdrawals
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
