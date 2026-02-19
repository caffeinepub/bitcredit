import { SigningStatus, BroadcastStatus } from '../types/mainnet';

export function getStatusMessage(
  signingStatus?: SigningStatus | string,
  broadcastStatus?: BroadcastStatus | string,
  confirmations?: number
): string {
  // Check signing status first
  if (signingStatus === SigningStatus.pending || signingStatus === 'pending') {
    return 'Awaiting signature';
  }
  if (signingStatus === SigningStatus.failed || signingStatus === 'failed') {
    return 'Signing failed';
  }

  // Then check broadcast status
  if (broadcastStatus === BroadcastStatus.pending || broadcastStatus === 'pending') {
    return 'Broadcasting to network';
  }
  if (broadcastStatus === BroadcastStatus.failed || broadcastStatus === 'failed') {
    return 'Broadcast failed';
  }
  if (broadcastStatus === BroadcastStatus.broadcast || broadcastStatus === 'broadcast') {
    if (confirmations && confirmations > 0) {
      return `${confirmations} confirmation${confirmations > 1 ? 's' : ''}`;
    }
    return 'Broadcast - awaiting confirmation';
  }
  if (broadcastStatus === BroadcastStatus.confirmed || broadcastStatus === 'confirmed') {
    return 'Confirmed';
  }

  return 'Unknown status';
}

export function estimateRemainingConfirmationTime(confirmations: number): string {
  if (confirmations >= 6) return 'Complete';
  
  const remaining = 6 - confirmations;
  const minutes = remaining * 10;
  
  if (minutes < 60) {
    return `~${minutes} minutes`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `~${hours} hour${hours > 1 ? 's' : ''}`;
  }
  
  return `~${hours}h ${remainingMinutes}m`;
}

export function calculateConfirmationProgress(confirmations: number): number {
  return Math.min((confirmations / 6) * 100, 100);
}

export function isTransactionFullyConfirmed(confirmations: number): boolean {
  return confirmations >= 6;
}

export function isValidSegwitAddress(address: string): boolean {
  // Basic Segwit address validation
  // P2WPKH: bc1q... (mainnet) or tb1q... (testnet) - 42 or 62 characters
  // P2WSH: bc1q... (mainnet) or tb1q... (testnet) - 62 characters
  
  const p2wpkhMainnetRegex = /^bc1q[a-z0-9]{38,58}$/;
  const p2wpkhTestnetRegex = /^tb1q[a-z0-9]{38,58}$/;
  const p2wshMainnetRegex = /^bc1q[a-z0-9]{58}$/;
  const p2wshTestnetRegex = /^tb1q[a-z0-9]{58}$/;
  
  return (
    p2wpkhMainnetRegex.test(address) ||
    p2wpkhTestnetRegex.test(address) ||
    p2wshMainnetRegex.test(address) ||
    p2wshTestnetRegex.test(address)
  );
}

export function needsStatusPolling(
  signingStatus?: SigningStatus | string,
  broadcastStatus?: BroadcastStatus | string,
  confirmations?: number
): boolean {
  // Poll if signing is pending
  if (signingStatus === SigningStatus.pending || signingStatus === 'pending') {
    return true;
  }

  // Poll if broadcast is pending
  if (broadcastStatus === BroadcastStatus.pending || broadcastStatus === 'pending') {
    return true;
  }

  // Poll if broadcast but not fully confirmed
  if (
    (broadcastStatus === BroadcastStatus.broadcast || broadcastStatus === 'broadcast') &&
    (!confirmations || confirmations < 6)
  ) {
    return true;
  }

  return false;
}
