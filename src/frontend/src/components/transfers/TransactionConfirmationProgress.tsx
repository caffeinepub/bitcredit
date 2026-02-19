import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, CheckCircle2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TransactionConfirmationProgressProps {
  confirmationCount?: number;
  txHash?: string;
  targetConfirmations?: number;
}

export default function TransactionConfirmationProgress({
  confirmationCount = 0,
  txHash,
  targetConfirmations = 6,
}: TransactionConfirmationProgressProps) {
  const progress = Math.min((confirmationCount / targetConfirmations) * 100, 100);
  const isComplete = confirmationCount >= targetConfirmations;
  const isBroadcast = confirmationCount === 0 && txHash;

  // Estimate time remaining (approximately 10 minutes per confirmation)
  const remainingConfirmations = Math.max(0, targetConfirmations - confirmationCount);
  const estimatedMinutes = remainingConfirmations * 10;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isComplete ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Transaction Confirmed
            </>
          ) : isBroadcast ? (
            <>
              <Clock className="h-5 w-5 text-blue-600" />
              Broadcast Successful
            </>
          ) : (
            'Confirmation Progress'
          )}
        </CardTitle>
        <CardDescription>
          {isBroadcast ? (
            'Awaiting first confirmation'
          ) : (
            `${confirmationCount} of ${targetConfirmations} confirmations received`
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isBroadcast && (
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ✓ Transaction successfully broadcast to the blockchain. Waiting for miners to include it in a block.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Progress 
            value={progress} 
            className={`h-2 ${isBroadcast ? 'opacity-50' : ''}`}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{confirmationCount} confirmation{confirmationCount !== 1 ? 's' : ''}</span>
            {!isComplete && estimatedMinutes > 0 && (
              <span>~{estimatedMinutes} min remaining</span>
            )}
          </div>
        </div>

        {txHash && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">Transaction Hash</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-muted px-2 py-1 rounded break-all">
                {txHash}
              </code>
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href={`https://blockstream.info/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  View
                </a>
              </Button>
            </div>
          </div>
        )}

        {isComplete && (
          <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
            <p className="text-sm text-emerald-800 dark:text-emerald-200">
              ✓ Transaction has been confirmed on the blockchain and is now final.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
