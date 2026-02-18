import { RefreshCw, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useGetReserveStatus } from '../../hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';

interface AdminReserveStatusMonitorProps {
  pollingInterval?: number;
  monitoringEnabled?: boolean;
}

export default function AdminReserveStatusMonitor({ 
  pollingInterval = 10000, 
  monitoringEnabled = true 
}: AdminReserveStatusMonitorProps) {
  const queryClient = useQueryClient();
  const { data: reserveStatus, isLoading, isError, error, dataUpdatedAt, isFetching } = useGetReserveStatus({
    refetchInterval: monitoringEnabled ? pollingInterval : undefined,
  });

  const handleManualRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['reserveStatus'] });
  };

  const formatLastUpdated = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 10) return 'Just now';
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  // Compute readiness indicator based on reserve status
  const computeReadiness = () => {
    if (!reserveStatus) return { ready: false, reason: 'Status unavailable' };

    const { reserveBtcBalance, outstandingIssuedCredits } = reserveStatus;
    
    // Ready if reserve balance is greater than or equal to outstanding credits
    if (reserveBtcBalance >= outstandingIssuedCredits && reserveBtcBalance > BigInt(0)) {
      return { 
        ready: true, 
        reason: 'Reserve balance covers all outstanding credits' 
      };
    }

    if (reserveBtcBalance === BigInt(0)) {
      return { 
        ready: false, 
        reason: 'Reserve balance is zero' 
      };
    }

    return { 
      ready: false, 
      reason: 'Reserve balance is less than outstanding credits' 
    };
  };

  if (isLoading) {
    return (
      <Card className="financial-card">
        <CardHeader>
          <CardTitle>Reserve Status Monitor</CardTitle>
          <CardDescription>
            {monitoringEnabled 
              ? 'Real-time reserve monitoring' 
              : 'Manual reserve monitoring'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" />
            Loading reserve status...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="financial-card">
        <CardHeader>
          <CardTitle>Reserve Status Monitor</CardTitle>
          <CardDescription>
            {monitoringEnabled 
              ? 'Real-time reserve monitoring' 
              : 'Manual reserve monitoring'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-destructive bg-destructive/10">
            <AlertDescription className="text-destructive">
              <strong>Failed to load reserve status</strong>
              <br />
              {error instanceof Error ? error.message : 'An unknown error occurred'}
            </AlertDescription>
          </Alert>
          <Button onClick={handleManualRefresh} variant="outline" className="mt-4 w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const coverageRatio = reserveStatus?.coverageRatio 
    ? (reserveStatus.coverageRatio * 100).toFixed(2) 
    : 'N/A';

  const readiness = computeReadiness();

  return (
    <Card className="financial-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Reserve Status Monitor</CardTitle>
            <CardDescription>
              {monitoringEnabled 
                ? `Real-time reserve monitoring (auto-refreshes every ${pollingInterval / 1000}s)` 
                : 'Manual reserve monitoring (click Refresh Now to update)'}
            </CardDescription>
          </div>
          <Button 
            onClick={handleManualRefresh} 
            variant="outline" 
            size="sm"
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh Now
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Readiness Indicator */}
        <Alert className={readiness.ready ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-amber-500 bg-amber-50 dark:bg-amber-950'}>
          {readiness.ready ? (
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          )}
          <AlertDescription className={readiness.ready ? 'text-green-800 dark:text-green-200' : 'text-amber-800 dark:text-amber-200'}>
            <div className="flex items-center gap-2 mb-1">
              <strong>Mainnet Transfer Readiness:</strong>
              <Badge variant={readiness.ready ? 'default' : 'secondary'} className={readiness.ready ? 'bg-green-600' : 'bg-amber-600'}>
                {readiness.ready ? 'Ready for mainnet transfers' : 'Not ready for mainnet transfers'}
              </Badge>
            </div>
            <span className="text-sm">
              {readiness.reason}
            </span>
            {!readiness.ready && (
              <p className="text-xs mt-2">
                Note: Transfers may fail if reserve balance is insufficient. Broadcasting success depends on network conditions and is not guaranteed.
              </p>
            )}
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Reserve Balance</p>
            <p className="text-2xl font-bold text-chart-1">
              {reserveStatus?.reserveBtcBalance.toString() || '0'} BTC
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Outstanding Credits</p>
            <p className="text-2xl font-bold text-chart-2">
              {reserveStatus?.outstandingIssuedCredits.toString() || '0'} BTC
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Coverage Ratio</p>
            <p className="text-2xl font-bold text-primary">
              {coverageRatio}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
          <Clock className="h-3 w-3" />
          <span>
            {isFetching ? 'Updating...' : `Last updated: ${formatLastUpdated(dataUpdatedAt)}`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
