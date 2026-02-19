import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function AdminReserveStatusMonitor() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reserve Status Monitor</CardTitle>
        <CardDescription>Bitcoin reserve balance and health indicators</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Reserve monitoring requires backend capabilities not currently exposed in the interface.
            Use external Bitcoin Core RPC or blockchain explorers to monitor reserve addresses.
          </AlertDescription>
        </Alert>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Reserve Balance</p>
            <p className="text-2xl font-bold text-muted-foreground">Not Available</p>
          </div>

          <div className="border rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-1">Health Status</p>
            <p className="text-2xl font-bold text-muted-foreground">Unknown</p>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Recent Activity</h3>
          <p className="text-sm text-muted-foreground">
            Reserve deposit and withdrawal tracking requires external monitoring tools.
          </p>
        </div>

        <Button variant="outline" className="w-full" disabled>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Status (Not Available)
        </Button>
      </CardContent>
    </Card>
  );
}
