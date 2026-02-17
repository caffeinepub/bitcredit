import { useState, useEffect } from 'react';
import { useVerifyBTCTransfer, useGetTransferRequest } from '../../hooks/useQueries';
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
import { CheckCircle2, Clock, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface VerifyTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: bigint;
}

export default function VerifyTransferDialog({ open, onOpenChange, requestId }: VerifyTransferDialogProps) {
  const [blockchainTxId, setBlockchainTxId] = useState('');
  const { mutate: verifyTransfer, isPending } = useVerifyBTCTransfer();
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

  const getStatusBadge = () => {
    if (!transferRequest) return null;

    switch (transferRequest.status) {
      case 'IN_PROGRESS':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            In Progress
          </Badge>
        );
      case 'VERIFIED':
        return (
          <Badge variant="default" className="gap-1 bg-chart-1">
            <CheckCircle2 className="h-3 w-3" />
            Verified
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="default" className="gap-1 bg-chart-1">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return null;
    }
  };

  const isVerified = transferRequest?.status === 'VERIFIED' || transferRequest?.status === 'COMPLETED';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Transfer Request</DialogTitle>
          <DialogDescription>
            Submit the blockchain transaction ID to verify this transfer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">Request ID</p>
              <p className="text-xs text-muted-foreground font-mono">{requestId.toString()}</p>
            </div>
            {getStatusBadge()}
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

              {isVerified ? (
                <Alert className="border-chart-1 bg-chart-1/10">
                  <CheckCircle2 className="h-4 w-4 text-chart-1" />
                  <AlertDescription className="text-chart-1">
                    This transfer has already been verified.
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Enter the Bitcoin mainnet transaction ID that corresponds to this transfer request. The blockchain will be checked to verify the transaction matches the destination and amount.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="blockchainTxId">Blockchain Transaction ID</Label>
                    <Input
                      id="blockchainTxId"
                      type="text"
                      placeholder="Enter Bitcoin transaction ID"
                      value={blockchainTxId}
                      onChange={(e) => setBlockchainTxId(e.target.value)}
                      required
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      The txid from the Bitcoin blockchain explorer
                    </p>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isPending || !blockchainTxId.trim()}>
                      {isPending ? 'Verifying...' : 'Verify Transfer'}
                    </Button>
                  </DialogFooter>
                </form>
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
