import { useEffect, useState } from 'react';
import { useGetTransferRequest } from '../../hooks/useQueries';
import { useNavigate } from '@tanstack/react-router';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Clock, XCircle, AlertCircle, Loader2, Copy, Check, RefreshCw, Wrench } from 'lucide-react';
import { toast } from 'sonner';

interface VerifyTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: bigint;
}

export default function VerifyTransferDialog({ open, onOpenChange, requestId }: VerifyTransferDialogProps) {
  const [copiedTxId, setCopiedTxId] = useState(false);
  const navigate = useNavigate();
  
  // Enable live refresh when dialog is open
  const { 
    data: transferRequest, 
    refetch: refetchRequest, 
    isLoading: requestLoading,
    isFetching: requestFetching 
  } = useGetTransferRequest(requestId, open);

  useEffect(() => {
    if (open) {
      refetchRequest();
    }
  }, [open, refetchRequest]);

  const handleCopyTxId = async (txid: string) => {
    try {
      await navigator.clipboard.writeText(txid);
      setCopiedTxId(true);
      toast.success('Transaction ID copied to clipboard');
      setTimeout(() => setCopiedTxId(false), 2000);
    } catch (error) {
      toast.error('Failed to copy transaction ID');
    }
  };

  const handleManualRefresh = () => {
    refetchRequest();
    toast.info('Refreshing transfer status...');
  };

  const handleTroubleshoot = () => {
    onOpenChange(false);
    navigate({ 
      to: '/transfer/$requestId/troubleshoot',
      params: { requestId: requestId.toString() }
    });
  };

  const getStatusInfo = () => {
    if (!transferRequest) return null;

    switch (transferRequest.status) {
      case 'IN_PROGRESS':
        return {
          badge: (
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              In Progress
            </Badge>
          ),
          text: 'In Progress',
          description: 'The transfer request has been broadcast to the Bitcoin network and is awaiting confirmation.',
        };
      case 'VERIFIED':
        return {
          badge: (
            <Badge variant="default" className="gap-1 bg-chart-1">
              <CheckCircle2 className="h-3 w-3" />
              Verified
            </Badge>
          ),
          text: 'Verified',
          description: 'The blockchain transaction has been verified and posted on-chain.',
        };
      case 'COMPLETED':
        return {
          badge: (
            <Badge variant="default" className="gap-1 bg-chart-1">
              <CheckCircle2 className="h-3 w-3" />
              Completed
            </Badge>
          ),
          text: 'Completed',
          description: 'The transfer has been successfully completed on the Bitcoin blockchain.',
        };
      case 'FAILED':
        return {
          badge: (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" />
              Failed
            </Badge>
          ),
          text: 'Failed',
          description: 'The transfer could not be posted to the Bitcoin blockchain. Your credits have been restored.',
        };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();
  const isFailed = transferRequest?.status === 'FAILED';
  const isInProgress = transferRequest?.status === 'IN_PROGRESS';
  const hasTxId = transferRequest?.blockchainTxId !== undefined && transferRequest?.blockchainTxId !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Request Details</DialogTitle>
          <DialogDescription>
            View transfer status and on-chain transaction ID
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Request ID</p>
              <p className="text-xs text-muted-foreground font-mono">{requestId.toString()}</p>
            </div>
            {statusInfo?.badge}
          </div>

          {isInProgress && (
            <Alert className="border-chart-1 bg-chart-1/10">
              <Loader2 className="h-4 w-4 animate-spin text-chart-1" />
              <AlertDescription className="text-chart-1">
                <strong>Auto-updating</strong>
                <br />
                <span className="text-sm">
                  This transfer is in progress. Status updates automatically every 3 seconds.
                </span>
              </AlertDescription>
            </Alert>
          )}

          {requestLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : transferRequest ? (
            <>
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Transaction Breakdown</h4>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Receiver gets:</span>
                    <span className="font-semibold">{transferRequest.amount.toString()} BTC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network fee:</span>
                    <span className="font-semibold">{transferRequest.networkFee.toString()} BTC</span>
                  </div>
                  <div className="pt-1.5 border-t flex justify-between">
                    <span className="font-semibold">Total cost:</span>
                    <span className="font-bold">{transferRequest.totalCost.toString()} BTC</span>
                  </div>
                </div>
              </div>

              {hasTxId && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">On-Chain Transaction ID</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted p-2 rounded font-mono break-all">
                      {transferRequest.blockchainTxId}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyTxId(transferRequest.blockchainTxId!)}
                    >
                      {copiedTxId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}

              {isFailed && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Transfer Failed</strong>
                    <br />
                    <span className="text-sm">
                      {transferRequest.failureReason || 'The transaction could not be broadcast to the Bitcoin blockchain.'}
                    </span>
                    {!hasTxId && (
                      <>
                        <br />
                        <br />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={handleTroubleshoot}
                        >
                          <Wrench className="h-3.5 w-3.5 mr-1" />
                          Troubleshoot & Retry
                        </Button>
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {transferRequest.diagnosticData && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Diagnostic Data</p>
                  <p className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono">
                    {transferRequest.diagnosticData}
                  </p>
                </div>
              )}
            </>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to load transfer request details. Please try again.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleManualRefresh}
            disabled={requestFetching}
            className="w-full sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${requestFetching ? 'animate-spin' : ''}`} />
            Refresh Status
          </Button>
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
