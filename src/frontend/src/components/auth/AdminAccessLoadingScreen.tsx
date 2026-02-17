import { Loader2, RefreshCw, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface AdminAccessLoadingScreenProps {
  principal?: string;
  onRetry?: () => void;
  onSignOut?: () => void;
}

export default function AdminAccessLoadingScreen({ 
  principal, 
  onRetry, 
  onSignOut 
}: AdminAccessLoadingScreenProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);
      
      // Show recovery actions after 10 seconds
      if (elapsed >= 10 && !showActions) {
        setShowActions(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showActions]);

  const maskPrincipal = (p: string) => {
    if (p.length <= 12) return p;
    return `${p.slice(0, 8)}...${p.slice(-4)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-6 max-w-lg w-full">
        <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto" />
        
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold">Verifying Admin Access</h2>
          <p className="text-muted-foreground">
            Please wait while we verify your principal and check admin permissions
          </p>
          
          {principal && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Verifying Principal</p>
              <code className="text-sm font-mono break-all">
                {maskPrincipal(principal)}
              </code>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground mt-2">
            Elapsed time: {elapsedSeconds}s
          </div>
        </div>

        {showActions && (
          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Taking longer than expected?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {onRetry && (
                <Button
                  onClick={onRetry}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry Admin Check
                </Button>
              )}
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
          </div>
        )}
      </div>
    </div>
  );
}
