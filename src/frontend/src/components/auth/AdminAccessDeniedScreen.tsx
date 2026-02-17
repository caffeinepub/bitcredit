import { AlertCircle, Copy, RefreshCw, LogOut, Home, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

interface AdminAccessDeniedScreenProps {
  principal?: string;
  tokenDetected?: boolean;
  accessControlInitialized?: boolean;
  onRetry?: () => void;
  onSignOut?: () => void;
}

export default function AdminAccessDeniedScreen({ 
  principal, 
  tokenDetected = false,
  accessControlInitialized = false,
  onRetry, 
  onSignOut 
}: AdminAccessDeniedScreenProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const navigate = useNavigate();

  const handleCopyPrincipal = () => {
    if (principal) {
      navigator.clipboard.writeText(principal);
      toast.success('Principal ID copied to clipboard');
    }
  };

  const handleRetry = async () => {
    if (!onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry();
      toast.info('Admin check completed');
    } catch (error) {
      toast.error('Failed to retry admin check');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleGoHome = () => {
    navigate({ to: '/', replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="max-w-2xl w-full border-destructive/50">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl">Admin Access Restricted</CardTitle>
              <CardDescription className="mt-2">
                Your principal is not currently recognized as an admin. Admin access is restricted to an allowlist of authorized principals.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Your Principal ID
            </label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-3 bg-muted border rounded-lg text-sm font-mono break-all">
                {principal || 'Not available'}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyPrincipal}
                className="shrink-0"
                title="Copy principal ID"
                disabled={!principal}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this principal ID with the system administrator to request admin access.
            </p>
          </div>

          <div className="border rounded-lg p-4 bg-muted/30">
            <h3 className="text-sm font-medium mb-3">Session Diagnostics</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                {tokenDetected ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Admin token detected in this session</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-amber-600" />
                    <span>No admin token detected in this session</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                {accessControlInitialized ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Access control initialized</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-amber-600" />
                    <span>Access control not initialized</span>
                  </>
                )}
              </div>
            </div>
            {!tokenDetected && (
              <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                To use the admin token, add <code className="px-1 py-0.5 bg-background rounded text-xs">?caffeineAdminToken=YOUR_TOKEN</code> to the URL before signing in.
              </p>
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="text-sm font-medium mb-3">Troubleshooting</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• If you recently received admin access, try re-running the admin check below.</p>
              <p>• If you believe you should have admin access, contact the system administrator.</p>
              <p>• Admin access is granted through a secure allowlist managed by the backend.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              onClick={handleRetry}
              disabled={isRetrying || !onRetry}
              className="gap-2"
              variant="default"
            >
              <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Checking...' : 'Re-run Admin Check'}
            </Button>
            <Button
              onClick={handleGoHome}
              variant="outline"
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Go to Dashboard
            </Button>
            {onSignOut && (
              <Button
                onClick={onSignOut}
                variant="secondary"
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
