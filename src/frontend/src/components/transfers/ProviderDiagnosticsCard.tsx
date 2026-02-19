import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, XCircle, ChevronDown, ChevronUp, Clock, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { BroadcastAttempt } from '../../types/mainnet';

interface ProviderDiagnosticsCardProps {
  broadcastAttempts?: BroadcastAttempt[];
  errorContext?: string;
}

export default function ProviderDiagnosticsCard({ broadcastAttempts, errorContext }: ProviderDiagnosticsCardProps) {
  const [expandedAttempts, setExpandedAttempts] = useState<{ [key: number]: boolean }>({});

  const toggleAttempt = (index: number) => {
    setExpandedAttempts(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // If no broadcast attempts, show placeholder
  if (!broadcastAttempts || broadcastAttempts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Blockchain Provider Diagnostics</CardTitle>
          <CardDescription>
            Real-time broadcast attempt logs and provider responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-muted">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No broadcast attempts recorded yet. Diagnostic information will appear here once the backend 
              attempts to broadcast transactions to blockchain APIs.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const successfulAttempts = broadcastAttempts.filter(a => a.success);
  const failedAttempts = broadcastAttempts.filter(a => !a.success);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          Blockchain Provider Diagnostics
        </CardTitle>
        <CardDescription>
          {broadcastAttempts.length} provider{broadcastAttempts.length !== 1 ? 's' : ''} attempted • 
          {successfulAttempts.length > 0 ? (
            <span className="text-emerald-600 ml-1">
              {successfulAttempts.length} successful
            </span>
          ) : (
            <span className="text-red-600 ml-1">
              {failedAttempts.length} failed
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Summary Alert */}
        {successfulAttempts.length > 0 ? (
          <Alert className="border-emerald-500 bg-emerald-50 dark:bg-emerald-950">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertDescription className="text-emerald-800 dark:text-emerald-200">
              <strong>Broadcast Successful:</strong> Transaction was successfully broadcast by {successfulAttempts[0].provider}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <strong>All Providers Failed:</strong> {failedAttempts.length} provider{failedAttempts.length !== 1 ? 's' : ''} rejected the transaction. 
              Review the error details below and check the troubleshooting guide.
            </AlertDescription>
          </Alert>
        )}

        {/* Broadcast Attempt Logs */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Provider Attempt Logs</h4>
          {broadcastAttempts.map((attempt, index) => (
            <Collapsible key={index} open={expandedAttempts[index] || !attempt.success}>
              <div className={`border rounded-lg p-3 ${
                attempt.success 
                  ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-950' 
                  : 'border-red-200 bg-red-50 dark:bg-red-950'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {attempt.success ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-semibold text-sm">{attempt.provider}</span>
                      <Badge variant={attempt.success ? "default" : "destructive"} className="text-xs">
                        HTTP {attempt.httpStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(attempt.timestamp).toLocaleString()}
                    </div>
                    {attempt.errorMessage && (
                      <div className="mt-2 text-xs text-red-800 dark:text-red-200">
                        <strong>Error:</strong> {attempt.errorMessage}
                      </div>
                    )}
                  </div>
                  {attempt.responseBody && (
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAttempt(index)}
                      >
                        {expandedAttempts[index] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  )}
                </div>
                {attempt.responseBody && (
                  <CollapsibleContent>
                    <div className="mt-3 pt-3 border-t border-current/20">
                      <div className="text-xs font-medium mb-1">Response Body:</div>
                      <div className="bg-muted/50 p-2 rounded text-xs font-mono whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                        {attempt.responseBody}
                      </div>
                    </div>
                  </CollapsibleContent>
                )}
              </div>
            </Collapsible>
          ))}
        </div>

        {/* Error Context */}
        {errorContext && (
          <div className="pt-3 border-t">
            <div className="text-xs font-medium mb-1 text-muted-foreground">Additional Context:</div>
            <div className="bg-muted p-2 rounded text-xs whitespace-pre-wrap break-all">
              {errorContext}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
