import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useIsCallerAdmin } from '../../hooks/useQueries';
import { Copy, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useState } from 'react';

export default function AdminTroubleshootingCard() {
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isFetched, retryAdminCheck } = useIsCallerAdmin();
  const [isRetrying, setIsRetrying] = useState(false);

  const principalString = identity?.getPrincipal().toString();

  // Only show when authenticated, admin check is complete, and user is not an admin
  if (!identity || !isFetched || isAdmin) {
    return null;
  }

  const handleCopyPrincipal = () => {
    if (principalString) {
      navigator.clipboard.writeText(principalString);
      toast.success('Principal ID copied to clipboard');
    }
  };

  const handleRetryAdminCheck = async () => {
    setIsRetrying(true);
    try {
      await retryAdminCheck();
      toast.info('Admin check completed');
    } catch (error) {
      toast.error('Failed to retry admin check');
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
      <CardHeader>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
          <div className="flex-1">
            <CardTitle className="text-base">Admin Access Restricted</CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-400 mt-1">
              Your principal is not currently recognized as an admin. Admin access is restricted to an allowlist of authorized principals.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-amber-900 dark:text-amber-300">
            Your Principal ID
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-800 rounded text-xs font-mono break-all">
              {principalString}
            </code>
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyPrincipal}
              className="shrink-0"
              title="Copy principal ID"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetryAdminCheck}
            disabled={isRetrying}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Checking...' : 'Retry Admin Check'}
          </Button>
        </div>

        <p className="text-xs text-amber-700 dark:text-amber-400">
          If you believe you should have admin access, please contact the system administrator with your principal ID.
        </p>
      </CardContent>
    </Card>
  );
}
