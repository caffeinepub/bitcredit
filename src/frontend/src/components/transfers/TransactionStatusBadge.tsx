import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle, Loader2 } from 'lucide-react';
import { SigningStatus, BroadcastStatus } from '../../types/mainnet';

interface TransactionStatusBadgeProps {
  signingStatus?: SigningStatus;
  broadcastStatus?: BroadcastStatus;
  confirmationCount?: number;
}

export default function TransactionStatusBadge({
  signingStatus,
  broadcastStatus,
  confirmationCount,
}: TransactionStatusBadgeProps) {
  // Determine overall status
  if (signingStatus === SigningStatus.failed || broadcastStatus === BroadcastStatus.failed) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Failed
      </Badge>
    );
  }

  if (broadcastStatus === BroadcastStatus.confirmed) {
    return (
      <Badge className="gap-1 bg-emerald-600 hover:bg-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        Confirmed {confirmationCount ? `(${confirmationCount})` : ''}
      </Badge>
    );
  }

  if (broadcastStatus === BroadcastStatus.broadcast) {
    return (
      <Badge className="gap-1 bg-blue-600 hover:bg-blue-700">
        <Loader2 className="h-3 w-3 animate-spin" />
        Broadcasting
      </Badge>
    );
  }

  if (signingStatus === SigningStatus.signed) {
    return (
      <Badge className="gap-1 bg-amber-600 hover:bg-amber-700">
        <Clock className="h-3 w-3" />
        Signed
      </Badge>
    );
  }

  if (signingStatus === SigningStatus.pending) {
    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="h-3 w-3" />
        Signing
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1">
      <Clock className="h-3 w-3" />
      Pending
    </Badge>
  );
}
