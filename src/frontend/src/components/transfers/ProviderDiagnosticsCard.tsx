import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Placeholder component since backend doesn't provide diagnostic data structures yet
interface ProviderDiagnosticsCardProps {
  request: any;
}

export default function ProviderDiagnosticsCard({ request }: ProviderDiagnosticsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Blockchain Provider Diagnostics</CardTitle>
        <CardDescription>
          Detailed diagnostic information will be available once the backend implements blockchain broadcasting
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="border-muted">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            The backend is currently a stub implementation. Blockchain provider diagnostic information 
            (operations history, error breakdown, network status) will be displayed here once the backend 
            implements actual HTTP outcalls to blockchain APIs.
          </AlertDescription>
        </Alert>
        
        {request?.diagnosticData && (
          <div className="mt-4">
            <div className="text-sm font-medium text-muted-foreground mb-2">Available Diagnostic Data:</div>
            <div className="bg-muted p-3 rounded text-xs font-mono whitespace-pre-wrap break-all">
              {typeof request.diagnosticData === 'string' 
                ? request.diagnosticData 
                : JSON.stringify(request.diagnosticData, null, 2)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
