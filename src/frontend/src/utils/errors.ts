/**
 * Normalizes backend error messages into clear, user-friendly English text.
 * Specifically handles broadcast-related errors for Send BTC flows.
 */
export function normalizeSendBTCError(error: Error): string {
  const message = error.message.toLowerCase();
  
  // Check for broadcast disabled/unavailable
  if (message.includes('btc_api_disabled') || (message.includes('broadcast') && message.includes('disabled'))) {
    return 'The transaction was not posted to the Bitcoin blockchain. The broadcast service is currently unavailable. Your credits have been restored.';
  }
  
  // Check for on-chain submission failure with rollback
  if (message.includes('on-chain submission failed')) {
    return 'The transaction was not posted to the Bitcoin blockchain. Your credits have been restored.';
  }
  
  // Check for rolling back ledger entry
  if (message.includes('rolling back')) {
    return 'The transaction was not posted to the Bitcoin blockchain. Your credits have been restored.';
  }
  
  // Check for insufficient funds
  if (message.includes('insufficient')) {
    return 'Insufficient balance to complete this transfer.';
  }
  
  // Check for generic broadcast/network errors
  if (message.includes('broadcast') || message.includes('network')) {
    return 'Unable to broadcast transaction to the Bitcoin network. Your credits have been restored.';
  }
  
  // Default: return original message with context
  return `Transfer failed: ${error.message}`;
}
