/**
 * Normalizes backend error messages into clear, user-friendly English text.
 * Specifically handles broadcast-related errors and safety-check failures for Send BTC flows.
 */
export function normalizeSendBTCError(error: Error): string {
  const message = error.message.toLowerCase();
  
  // Check for invalid address format
  if (message.includes('invalid') && (message.includes('address') || message.includes('destination'))) {
    return 'Invalid Bitcoin address format. Please check the destination address and try again.';
  }
  
  // Check for insufficient on-chain funds in app wallet
  if (message.includes('insufficient') && message.includes('on-chain')) {
    return 'Insufficient Bitcoin in the app wallet. The app does not have enough BTC on-chain to complete this transfer.';
  }
  
  // Check for BlockCypher or provider-specific errors
  if (message.includes('blockcypher') || message.includes('provider')) {
    return `Bitcoin network provider error: ${error.message}`;
  }
  
  // Check for broadcast or network connection failures
  if (message.includes('broadcast') || message.includes('unable to connect')) {
    return 'Unable to broadcast transaction to the Bitcoin network. The blockchain API may be temporarily unavailable. Please try again later.';
  }
  
  // Check for on-chain submission failure with rollback
  if (message.includes('on-chain submission failed')) {
    return 'The transaction could not be posted to the Bitcoin blockchain. Please try again.';
  }
  
  // Check for rolling back ledger entry
  if (message.includes('rolling back')) {
    return 'The transaction could not be posted to the Bitcoin blockchain. Please try again.';
  }
  
  // Check for insufficient balance (user credits)
  if (message.includes('insufficient')) {
    return 'Insufficient balance to complete this transfer.';
  }
  
  // Check for generic network errors
  if (message.includes('network')) {
    return 'Network error occurred while processing the transaction. Please try again.';
  }
  
  // Default: return original message with context
  return `Transfer failed: ${error.message}`;
}
