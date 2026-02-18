import { useState, useEffect } from 'react';
import { useVerifyBTCTransfer, useGetTransferRequest, useConfirmOnChain } from '../../hooks/useQueries';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Clock, XCircle, AlertCircle, Loader2, Copy, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface VerifyTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: bigint;
}

export default function VerifyTransferDialog({ open, onOpenChange, requestId }: VerifyTransferDialogProps) {
  const [blockchainTxId, setBlockchainTxId] = useState('');
  const [copiedTxId, setCopiedTxId] = useState(false);
  const { mutate: verifyTransfer, isPending: isVerifying } = useVerifyBTCTransfer();
  const { mutate: confirmOnChain, isPending: isConfirming } = useConfirmOnChain();
  const { data: transferRequest, refetch: refetchRequest, isLoading: requestLoading } = useGetTransferRequest(requestId);

  useEffect(() => {
    if (open) {
      refetchRequest();
    }
  }, [open, refetchRequest]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (blockchainTxId.trim()) {
      verifyTransfer(
        { requestId, blockchainTxId: blockchainTxId.trim() },
        {
          onSuccess: () => {
            setBlockchainTxId('');
            onOpenChange(false);
          },
        }
      );
    }
  };

  const handleConfirmOnChain = () => {
    confirmOnChain(requestId);
  };

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
  const isCompleted = transferRequest?.status === 'COMPLETED';
  const isFailed = transferRequest?.status === 'FAILED';
  const canConfirm = transferRequest?.status === 'IN_PROGRESS' || transferRequest?.status === 'VERIFIED';
  const hasTxId = transferRequest?.blockchainTxId !== undefined && transferRequest?.blockchainTxId !== null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Transfer Details</DialogTitle>
          <DialogDescription>
            View transfer status and blockchain transaction information
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
                    <span className="font-semibold">Total deducted:</span>
                    <span className="font-bold">{transferRequest.totalCost.toString()} BTC</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">Status</h4>
                <p className="text-sm text-muted-foreground">{statusInfo?.description}</p>
              </div>

              {hasTxId && (
                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">On-chain Transaction ID (txid)</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyTxId(transferRequest.blockchainTxId!)}
                      className="h-6 w-6"
                    >
                      {copiedTxId ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs font-mono bg-background p-2 rounded border break-all">
                    {transferRequest.blockchainTxId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This transaction has been posted to the Bitcoin blockchain
                  </p>
                </div>
              )}

              {isFailed && transferRequest.failureReason && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Transfer Failed:</strong>
                    <br />
                    <span className="text-sm mt-1 block">
                      {transferRequest.failureReason}
                    </span>
                    <br />
                    <span className="text-sm font-semibold">
                      The transaction was not posted to the Bitcoin blockchain. Your credits have been restored.
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {isFailed && !transferRequest.failureReason && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Transfer Failed</strong>
                    <br />
                    <span className="text-sm mt-1 block">
                      {statusInfo?.description}
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {canConfirm && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    You can re-check the on-chain status to confirm if this transfer has been completed on the Bitcoin blockchain.
                  </AlertDescription>
                </Alert>
              )}

              {!isCompleted && !isFailed && !hasTxId && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      If you have a Bitcoin transaction ID for this transfer, you can submit it here to verify the transaction on the blockchain.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="blockchainTxId">Blockchain Transaction ID (optional)</Label>
                    <Input
                      id="blockchainTxId"
                      type="text"
                      placeholder="Enter Bitcoin transaction ID"
                      value={blockchainTxId}
                      onChange={(e) => setBlockchainTxId(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      The txid from the Bitcoin blockchain explorer
                    </p>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                      Close
                    </Button>
                    {canConfirm && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleConfirmOnChain}
                        disabled={isConfirming}
                      >
                        {isConfirming ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Confirm On-Chain
                          </>
                        )}
                      </Button>
                    )}
                    <Button type="submit" disabled={isVerifying || !blockchainTxId.trim()}>
                      {isVerifying ? 'Verifying...' : 'Verify Transfer'}
                    </Button>
                  </DialogFooter>
                </form>
              )}

              {(isCompleted || isFailed || (hasTxId && !canConfirm)) && (
                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Close
                  </Button>
                  {canConfirm && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleConfirmOnChain}
                      disabled={isConfirming}
                    >
                      {isConfirming ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Confirm On-Chain
                        </>
                      )}
                    </Button>
                  )}
                </DialogFooter>
              )}
            </>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to load transfer request details.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
