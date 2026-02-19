import type { Transaction } from '../backend';
import type { MainnetTransaction, SigningStatus, BroadcastStatus } from '../types/mainnet';

/**
 * Determines if a transaction is pending (not yet confirmed)
 */
export function isTransactionPending(transaction: Transaction): boolean {
  const mtx = transaction as MainnetTransaction;
  
  return (
    mtx.signingStatus === 'pending' ||
    mtx.broadcastStatus === 'pending' ||
    mtx.broadcastStatus === 'broadcast' ||
    (mtx.confirmationCount !== undefined && mtx.confirmationCount < 6)
  );
}

/**
 * Formats a status message for a transaction
 */
export function formatTransactionStatusMessage(transaction: Transaction): string {
  const mtx = transaction as MainnetTransaction;

  if (mtx.signingStatus === 'failed') {
    return 'Signing failed';
  }

  if (mtx.broadcastStatus === 'failed') {
    return 'Broadcast failed';
  }

  if (mtx.broadcastStatus === 'confirmed') {
    return `Confirmed (${mtx.confirmationCount || 0} confirmations)`;
  }

  if (mtx.broadcastStatus === 'broadcast') {
    return 'Broadcasting to network';
  }

  if (mtx.signingStatus === 'signed') {
    return 'Signed, awaiting broadcast';
  }

  if (mtx.signingStatus === 'pending') {
    return 'Signing transaction';
  }

  return 'Pending';
}

/**
 * Calculates estimated time until confirmation (in minutes)
 */
export function calculateEstimatedConfirmationTime(confirmationCount: number = 0, targetConfirmations: number = 6): number {
  const remainingConfirmations = Math.max(0, targetConfirmations - confirmationCount);
  return remainingConfirmations * 10; // Approximately 10 minutes per confirmation
}

/**
 * Validates if a Bitcoin address is a Segwit address
 */
export function isSegwitAddress(address: string): boolean {
  // P2WPKH and P2WSH addresses start with "bc1" for mainnet
  return address.toLowerCase().startsWith('bc1');
}

/**
 * Determines the Segwit address type from an address string
 */
export function getSegwitAddressType(address: string): 'P2WPKH' | 'P2WSH' | null {
  if (!isSegwitAddress(address)) {
    return null;
  }

  // P2WPKH addresses are typically 42 characters (bc1q + 38 chars)
  // P2WSH addresses are typically 62 characters (bc1q + 58 chars)
  if (address.length === 42) {
    return 'P2WPKH';
  } else if (address.length === 62) {
    return 'P2WSH';
  }

  // Default to P2WPKH for other bc1 addresses
  return 'P2WPKH';
}

/**
 * Formats Bitcoin amount from satoshis to BTC
 */
export function formatBitcoinAmount(satoshis: bigint): string {
  const btc = Number(satoshis) / 100000000;
  return `${satoshis.toLocaleString()} sats (${btc.toFixed(8)} BTC)`;
}

/**
 * Determines if a transaction needs status polling
 */
export function needsStatusPolling(transaction: Transaction): boolean {
  const mtx = transaction as MainnetTransaction;
  
  return (
    mtx.signingStatus === 'pending' ||
    mtx.broadcastStatus === 'pending' ||
    mtx.broadcastStatus === 'broadcast'
  );
}
