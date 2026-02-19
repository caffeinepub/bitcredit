/**
 * Normalizes backend error messages into clear, user-friendly English text.
 * Specifically handles broadcast-related errors and safety-check failures for Send BTC flows.
 */
export function normalizeSendBTCError(error: Error): string {
  const message = error.message.toLowerCase();
  
  // Check for "account not registered" or similar registration errors
  if (message.includes('account') && (message.includes('not registered') || message.includes('registration'))) {
    return 'Unable to process transfer. Please ensure you have entered a valid Bitcoin mainnet address. The recipient does not need to be registered in this app.';
  }
  
  // Check for invalid address format
  if (message.includes('invalid') && (message.includes('address') || message.includes('destination'))) {
    return 'Invalid Bitcoin address format. Please enter a valid Bitcoin mainnet address (starting with 1, 3, or bc1).';
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

/**
 * Normalizes backend error messages for reserve deposit validation into clear, user-friendly English text.
 */
export function normalizeReserveDepositValidationError(error: Error): string {
  const message = error.message.toLowerCase();
  
  // Check for reserve address not configured
  if (message.includes('reserve address not set') || message.includes('reserve multisig config not set')) {
    return 'Reserve wallet address is not configured. Please configure the reserve multisig address before validating deposits.';
  }
  
  // Check for transaction not matching reserve address
  if (message.includes('does not match reserve address')) {
    return 'Transaction does not send funds to the configured reserve wallet address. Please verify the transaction ID and reserve address.';
  }
  
  // Check for amount mismatch
  if (message.includes('does not match') && message.includes('amount')) {
    return 'Transaction amount does not match the specified amount. Please verify the transaction details.';
  }
  
  // Check for blockchain verification failure
  if (message.includes('unable to verify') || message.includes('blockchain')) {
    return 'Unable to verify transaction on the blockchain. The transaction may not be confirmed yet, or the blockchain API may be temporarily unavailable. Please try again later.';
  }
  
  // Check for zero amount
  if (message.includes('cannot validate 0')) {
    return 'Cannot validate a deposit of 0 satoshis. Please enter a valid amount.';
  }
  
  // Check for duplicate validation (if implemented)
  if (message.includes('already validated') || message.includes('duplicate')) {
    return 'This transaction has already been validated and credited to the reserve. Duplicate validation is not allowed.';
  }
  
  // Default: return original message with context
  return `Validation failed: ${error.message}`;
}
