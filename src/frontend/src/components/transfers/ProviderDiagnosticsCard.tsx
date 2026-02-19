import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CheckCircle2, XCircle, ChevronDown, Activity } from 'lucide-react';
import type { BroadcastAttempt } from '../../types/mainnet';

interface ProviderDiagnosticsCardProps {
  broadcastAttempts: BroadcastAttempt[];
  errorContext?: string;
}

export default function ProviderDiagnosticsCard({ 
  broadcastAttempts,
  errorContext 
}: ProviderDiagnosticsCardProps) {
  if (broadcastAttempts.length === 0) {
    return null;
  }

  const successfulAttempts = broadcastAttempts.filter(a => a.success);
  const failedAttempts = broadcastAttempts.filter(a => !a.success);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          Provider Broadcast Diagnostics
        </CardTitle>
        <CardDescription>
          Detailed logs from blockchain API providers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>{successfulAttempts.length} successful</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span>{failedAttempts.length} failed</span>
          </div>
        </div>

        {/* Error Context */}
        {errorContext && (
          <Alert variant="destructive">
            <AlertDescription>
              <strong>Error Context:</strong> {errorContext}
            </AlertDescription>
          </Alert>
        )}

        {/* Broadcast Attempts */}
        <div className="space-y-3">
          {broadcastAttempts.map((attempt, index) => (
            <Collapsible key={index}>
              <div className="border rounded-lg p-3">
                <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-muted/50 p-2 rounded">
                  <div className="flex items-center gap-3">
                    {attempt.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    )}
                    <div className="text-left">
                      <div className="font-medium">{attempt.provider}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(attempt.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={attempt.success ? "default" : "destructive"}>
                      HTTP {attempt.httpStatus}
                    </Badge>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent className="pt-3 space-y-2">
                  {attempt.errorMessage && (
                    <div className="bg-red-50 dark:bg-red-950 p-2 rounded text-sm">
                      <strong className="text-red-800 dark:text-red-200">Error:</strong>
                      <p className="text-red-700 dark:text-red-300 mt-1">{attempt.errorMessage}</p>
                    </div>
                  )}
                  
                  {attempt.responseBody && (
                    <div className="bg-muted p-2 rounded">
                      <strong className="text-xs text-muted-foreground">Response Body:</strong>
                      <pre className="text-xs mt-1 overflow-x-auto whitespace-pre-wrap break-words">
                        {attempt.responseBody}
                      </pre>
                    </div>
                  )}
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>

        {/* Guidance */}
        <Alert>
          <AlertDescription className="text-sm">
            <strong>About Provider Fallback:</strong> The system attempts to broadcast transactions 
            to multiple blockchain API providers. If one provider fails, the system automatically 
            tries the next provider in the list. A transaction is considered successful if at least 
            one provider accepts it.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
