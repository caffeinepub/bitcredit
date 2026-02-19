import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle, Loader2, Send } from 'lucide-react';
import { SigningStatus, BroadcastStatus } from '../../types/mainnet';

interface TransactionStatusBadgeProps {
  signingStatus?: SigningStatus;
  broadcastStatus?: BroadcastStatus;
  confirmations?: number;
}

export default function TransactionStatusBadge({ 
  signingStatus, 
  broadcastStatus,
  confirmations = 0 
}: TransactionStatusBadgeProps) {
  // Determine the overall status and display
  if (signingStatus === SigningStatus.failed || broadcastStatus === BroadcastStatus.failed) {
    return (
      <Badge variant="destructive" className="gap-1">
        <XCircle className="h-3 w-3" />
        Failed
      </Badge>
    );
  }

  if (signingStatus === SigningStatus.pending) {
    return (
      <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-700 dark:text-yellow-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        Signing
      </Badge>
    );
  }

  if (broadcastStatus === BroadcastStatus.pending) {
    return (
      <Badge variant="outline" className="gap-1 border-blue-500 text-blue-700 dark:text-blue-400">
        <Send className="h-3 w-3" />
        Broadcasting
      </Badge>
    );
  }

  if (broadcastStatus === BroadcastStatus.broadcast) {
    return (
      <Badge variant="outline" className="gap-1 border-orange-500 text-orange-700 dark:text-orange-400">
        <Clock className="h-3 w-3" />
        Awaiting Confirmations ({confirmations}/6)
      </Badge>
    );
  }

  if (broadcastStatus === BroadcastStatus.confirmed || confirmations >= 6) {
    return (
      <Badge variant="default" className="gap-1 bg-green-600 hover:bg-green-700">
        <CheckCircle2 className="h-3 w-3" />
        Confirmed
      </Badge>
    );
  }

  // Default pending state
  return (
    <Badge variant="outline" className="gap-1">
      <Clock className="h-3 w-3" />
      Pending
    </Badge>
  );
}
