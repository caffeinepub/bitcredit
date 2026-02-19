import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGetCallerWithdrawalRequests } from '../../hooks/useQueries';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { WithdrawalStatus } from '../../backend';

export default function WithdrawalHistoryList() {
  const { data: requests, isLoading } = useGetCallerWithdrawalRequests();
  const [statusFilter, setStatusFilter] = useState<WithdrawalStatus | 'ALL'>('ALL');

  const filteredRequests = requests?.filter(r => 
    statusFilter === 'ALL' || r.status === statusFilter
  ) || [];

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

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  return (
    <Tabs value={getStatusValue(statusFilter)} onValueChange={(v) => {
      if (v === 'ALL') {
        setStatusFilter('ALL');
      } else {
        setStatusFilter(v as WithdrawalStatus);
      }
    }}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="ALL">All</TabsTrigger>
        <TabsTrigger value={WithdrawalStatus.PENDING}>Pending</TabsTrigger>
        <TabsTrigger value={WithdrawalStatus.PAID}>Paid</TabsTrigger>
        <TabsTrigger value={WithdrawalStatus.REJECTED}>Rejected</TabsTrigger>
      </TabsList>

      <TabsContent value={getStatusValue(statusFilter)} className="mt-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {statusFilter === 'ALL' 
                  ? 'No withdrawal requests yet'
                  : `No ${statusFilter.toLowerCase()} requests`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(request.status)}
                        <span className="text-sm text-muted-foreground">
                          ID: {request.id.toString()}
                        </span>
                      </div>
                      <p className="text-2xl font-bold">
                        ₿ {(Number(request.amount) / 100_000_000).toFixed(8)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Method:</span>
                      <span className="font-medium">{request.method}</span>
                    </div>
                    {request.account && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Account:</span>
                        <span className="font-mono text-xs">{request.account}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Requested:</span>
                      <span>{new Date(Number(request.timestamp) / 1_000_000).toLocaleString()}</span>
                    </div>
                    {request.failureReason && (
                      <div className="mt-2 p-2 bg-destructive/10 rounded">
                        <p className="text-destructive text-xs">
                          <strong>Rejection Reason:</strong> {request.failureReason}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
