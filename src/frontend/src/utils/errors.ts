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

  // Generic backend errors
  if (message.includes('Actor not available')) {
    return 'Backend connection unavailable. Please try again.';
  }

  // Return the original message if no pattern matches
  return message;
}
