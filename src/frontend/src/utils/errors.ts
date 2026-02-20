export function normalizeError(error: any): string {
  if (!error) return 'An unknown error occurred';

  // Handle string errors
  if (typeof error === 'string') {
    return formatBackendError(error);
  }

  // Handle Error objects
  if (error instanceof Error) {
    return formatBackendError(error.message);
  }

  // Handle objects with message property
  if (error.message) {
    return formatBackendError(error.message);
  }

  // Handle backend trap errors
  if (error.toString) {
    return formatBackendError(error.toString());
  }

  return 'An unexpected error occurred';
}

function formatBackendError(message: string): string {
  // Bitcoin purchase validation errors
  if (message.includes('Transaction ID must be exactly 64 hexadecimal characters')) {
    return 'Invalid transaction ID format. Must be exactly 64 hexadecimal characters (0-9, a-f).';
  }

  if (message.includes('BTC amount must be positive and have at most 8 decimal places')) {
    return 'Invalid BTC amount. Must be positive and have at most 8 decimal places.';
  }

  if (message.includes('already exists') || message.includes('already processed')) {
    return 'This transaction ID has already been processed. Duplicate credits are not allowed.';
  }

  if (message.includes('already pending')) {
    return 'A verification request for this transaction ID is already pending.';
  }

  // Authorization errors
  if (message.includes('Unauthorized')) {
    return 'You do not have permission to perform this action.';
  }

  // Balance errors
  if (message.includes('Insufficient balance') || message.includes('Not enough balance')) {
    return 'Insufficient balance for this transaction.';
  }

  // Withdrawal errors
  if (message.includes('not in PENDING status')) {
    return 'This withdrawal request cannot be modified as it has already been processed.';
  }

  // Peer transfer errors
  if (message.includes('Cannot send credits to yourself')) {
    return 'You cannot send credits to your own account.';
  }

  // Address errors
  if (message.includes('Address already exists')) {
    return 'This Bitcoin address is already registered in your account.';
  }

  if (message.includes('Address not found')) {
    return 'The specified Bitcoin address was not found in your records.';
  }

  // sendBTC backend implementation errors
  if (message.includes('sendBTC method is not implemented') || message.includes('sendBTC method not available')) {
    return 'Bitcoin sending functionality is not yet available. The backend needs to implement transaction signing and broadcasting. Please use Withdrawal Requests or Send to Peer for transferring credits.';
  }

  // Self-custody wallet errors
  if (
    message.includes('Self-custody wallet generation is not yet implemented') ||
    message.includes('generateSelfCustodyWallet')
  ) {
    return 'Self-custody wallet generation is not yet available. The backend needs to implement key derivation using the management canister ECDSA API and wallet metadata storage.';
  }

  if (
    message.includes('Self-custody transfers are not yet implemented') ||
    message.includes('createSelfCustodyTransfer')
  ) {
    return 'Self-custody transfers are not yet available. The backend needs to implement balance debiting, transfer record creation, and status tracking.';
  }

  // Generic backend errors
  if (message.includes('Actor not available')) {
    return 'Backend connection unavailable. Please try again.';
  }

  // Return the original message if no pattern matches
  return message;
}
