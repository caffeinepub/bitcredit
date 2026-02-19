import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { BroadcastStatus } from '../../types/mainnet';
import { useTransactionConfirmations } from '../../hooks/useQueries';
import { estimateRemainingConfirmationTime, calculateConfirmationProgress } from '../../utils/transactionStatus';

interface TransactionConfirmationProgressProps {
  txid: string | null;
  confirmations?: number;
  broadcastStatus?: BroadcastStatus | string;
}

export default function TransactionConfirmationProgress({
  txid,
  confirmations: propConfirmations,
  broadcastStatus,
}: TransactionConfirmationProgressProps) {
  // Poll for real-time confirmation data
  const { data: polledConfirmations, isLoading } = useTransactionConfirmations(txid);
  
  // Use polled confirmations if available, otherwise fall back to prop
  const confirmations = polledConfirmations !== undefined ? polledConfirmations : (propConfirmations || 0);
  
  const isFullyConfirmed = confirmations >= 6;
  const isBroadcast = broadcastStatus === 'broadcast' || broadcastStatus === BroadcastStatus.broadcast;
  const isConfirmed = broadcastStatus === 'confirmed' || broadcastStatus === BroadcastStatus.confirmed;
  
  const progress = calculateConfirmationProgress(confirmations);
  const remainingTime = estimateRemainingConfirmationTime(confirmations);

  // Show broadcast successful state even before first confirmation
  const showBroadcastSuccess = isBroadcast && confirmations === 0 && txid;

  const explorerUrl = txid ? `https://blockstream.info/tx/${txid}` : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isFullyConfirmed || isConfirmed ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Transaction Confirmed
            </>
          ) : showBroadcastSuccess ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
              Broadcast Successful - Awaiting Confirmation
            </>
          ) : (
            <>
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              ) : (
                <Clock className="h-5 w-5 text-blue-600" />
              )}
              Confirmation Progress
            </>
          )}
        </CardTitle>
        <CardDescription>
          {isFullyConfirmed || isConfirmed
            ? 'Your transaction has been fully confirmed on the blockchain'
            : showBroadcastSuccess
            ? 'Your transaction has been broadcast to the network and is awaiting its first confirmation'
            : `Waiting for blockchain confirmations (${confirmations}/6)`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isFullyConfirmed && !isConfirmed && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Confirmations</span>
                <span className="font-medium">{confirmations}/6</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {confirmations > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Estimated time remaining</span>
                <span className="font-medium">{remainingTime}</span>
              </div>
            )}

            {confirmations === 0 && !showBroadcastSuccess && (
              <div className="text-sm text-muted-foreground">
                Waiting for the first confirmation. This typically takes ~10 minutes.
              </div>
            )}
          </>
        )}

        {(isFullyConfirmed || isConfirmed) && (
          <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ Transaction has received {confirmations} confirmations and is considered final.
            </p>
          </div>
        )}

        {showBroadcastSuccess && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ✓ Your transaction has been successfully broadcast to the Bitcoin network. 
              The first confirmation typically arrives within 10 minutes.
            </p>
          </div>
        )}

        {explorerUrl && (
          <div className="pt-2 border-t">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <ExternalLink className="h-4 w-4" />
              View on Blockchain Explorer
            </a>
          </div>
        )}

        {isLoading && confirmations === 0 && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" />
            Checking confirmation status...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
