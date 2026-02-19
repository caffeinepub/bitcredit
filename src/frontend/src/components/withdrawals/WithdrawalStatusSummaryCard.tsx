import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGetCallerWithdrawalRequests } from '../../hooks/useQueries';
import { ArrowDownRight } from 'lucide-react';

export default function WithdrawalStatusSummaryCard() {
  const { data: requests, isLoading } = useGetCallerWithdrawalRequests();

  const pendingCount = requests?.filter(r => r.status === 'PENDING').length || 0;
  const paidCount = requests?.filter(r => r.status === 'PAID').length || 0;
  const rejectedCount = requests?.filter(r => r.status === 'REJECTED').length || 0;
  const totalCount = requests?.length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdrawal Status</CardTitle>
        <CardDescription>Your withdrawal request summary</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-6 w-full bg-muted animate-pulse rounded" />
            <div className="h-6 w-full bg-muted animate-pulse rounded" />
            <div className="h-6 w-full bg-muted animate-pulse rounded" />
          </div>
        ) : totalCount === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">No withdrawal requests yet</p>
            <Link to="/withdraw">
              <Button size="sm">
                <ArrowDownRight className="mr-2 h-4 w-4" />
                Request Withdrawal
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Pending:</span>
              <span className="font-semibold text-yellow-600 dark:text-yellow-400">{pendingCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Paid:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">{paidCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Rejected:</span>
              <span className="font-semibold text-red-600 dark:text-red-400">{rejectedCount}</span>
            </div>
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground italic">
                "Paid" is an administrative audit record. Actual payment processing is handled externally.
              </p>
            </div>
            <Link to="/withdraw">
              <Button variant="outline" size="sm" className="w-full mt-2">
                View Details
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
