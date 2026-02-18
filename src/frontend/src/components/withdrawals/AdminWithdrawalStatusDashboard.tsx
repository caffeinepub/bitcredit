import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle, XCircle, ArrowDown, Inbox } from 'lucide-react';
import type { WithdrawalRequest } from '../../backend';

interface AdminWithdrawalStatusDashboardProps {
  requests: WithdrawalRequest[];
  onScrollToInbox: () => void;
}

export default function AdminWithdrawalStatusDashboard({ requests, onScrollToInbox }: AdminWithdrawalStatusDashboardProps) {
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const paidCount = requests.filter((r) => r.status === 'PAID').length;
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-1">Withdrawal Request Overview</h2>
        <p className="text-sm text-muted-foreground">
          Summary of all payout requests across all users
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="financial-card border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Pending Review
              </CardTitle>
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-bold text-amber-900 dark:text-amber-100">{pendingCount}</div>
              <Badge variant="outline" className="border-amber-600 text-amber-700 dark:text-amber-300">
                Needs Action
              </Badge>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
              {pendingCount === 0 
                ? 'No pending requests at this time' 
                : pendingCount === 1 
                ? '1 request awaiting manual processing' 
                : `${pendingCount} requests awaiting manual processing`}
            </p>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Marked as Paid</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-900 dark:text-green-100">{paidCount}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Administrative records of processed payouts
            </p>
          </CardContent>
        </Card>

        <Card className="financial-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Credits automatically restored to users
            </p>
          </CardContent>
        </Card>
      </div>

      {pendingCount > 0 && (
        <Card className="financial-card border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900">
                  <Inbox className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                    {pendingCount} {pendingCount === 1 ? 'Request' : 'Requests'} Awaiting Review
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Review and process pending payout requests below
                  </p>
                </div>
              </div>
              <Button 
                onClick={onScrollToInbox}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <ArrowDown className="h-4 w-4 mr-2" />
                Review Requests
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
