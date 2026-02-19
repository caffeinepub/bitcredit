export function normalizeSendBTCError(error: Error): string {
  const message = error.message || '';

  // Blockchain API provider-specific errors
  if (message.includes('API rejected') || 
      message.includes('address format not accepted') || 
      message.includes('API did not accept') ||
      message.includes('address rejected')) {
    return 'The blockchain API provider rejected the destination address. Please verify the address is a valid Bitcoin mainnet address (starting with 1, 3, or bc1) and not a testnet address.';
  }

  // Connection and network errors
  if (message.includes('Cannot connect to blockchain API') || 
      message.includes('unable to connect') ||
      message.includes('connection failed') ||
      message.includes('network error')) {
    return 'Unable to connect to the blockchain API provider. This may be due to network issues or the API endpoint being unreachable. If using localhost, note that IC canisters cannot access local endpoints.';
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'The blockchain API provider request timed out. The provider may be experiencing high load or network connectivity issues. Please try again in a few minutes.';
  }

  // Rate limiting
  if (message.includes('rate limit') || 
      message.includes('too many requests') ||
      message.includes('quota exceeded')) {
    return 'The blockchain API provider rate limit has been exceeded. Please wait a few minutes before retrying your transfer.';
  }

  // Multiple provider failures
  if (message.includes('all apis') || 
      message.includes('all providers') ||
      message.includes('multiple failures')) {
    return 'All configured blockchain API providers failed to process the transaction. This may indicate an issue with the destination address format or widespread provider connectivity problems. Please check the Provider Diagnostics section for detailed error information.';
  }

  // Localhost/local network errors
  if (message.includes('localhost') || 
      message.includes('127.0.0.1') ||
      message.includes('18443')) {
    return 'Cannot connect to localhost endpoints from IC canisters. Please configure the backend to use a publicly accessible blockchain API endpoint (e.g., https://blockstream.info/api/).';
  }

  // Invalid address format
  if (message.includes('invalid address') || 
      message.includes('address format') ||
      message.includes('malformed address')) {
    return 'The destination address format is invalid. Please verify you are using a valid Bitcoin mainnet address.';
  }

  // Insufficient balance/reserve
  if (message.includes('insufficient') || 
      message.includes('not enough balance') ||
      message.includes('reserve')) {
    return 'Insufficient balance or backend reserve to complete this transfer. Please check your balance or contact the administrator.';
  }

  // Fee-related errors
  if (message.includes('fee too low') || 
      message.includes('insufficient fee')) {
    return 'The network fee is too low for the current Bitcoin network conditions. The transaction may take longer to confirm or may not be accepted by miners.';
  }

  // Mempool/confirmation errors
  if (message.includes('mempool') || 
      message.includes('not confirmed') ||
      message.includes('stuck')) {
    return 'The transaction is in the mempool but has not been confirmed yet. This is normal during periods of high network congestion. Monitor the transaction on a blockchain explorer.';
  }

  // Evicted/dropped transactions
  if (message.includes('evicted') || 
      message.includes('dropped') ||
      message.includes('not found')) {
    return 'The transaction was dropped from the mempool and will not be confirmed. Your credits have been restored. You can create a new transfer with a higher fee.';
  }

  // Generic unauthorized/permission errors
  if (message.includes('Unauthorized') || message.includes('permission')) {
    return 'You do not have permission to perform this action. Please ensure you are logged in with the correct account.';
  }

  // Generic trap/runtime errors
  if (message.includes('trap') || message.includes('runtime error')) {
    return 'A backend error occurred while processing your request. Please try again or contact support if the issue persists.';
  }

  // Default: return the original message if no pattern matches
  return message || 'An unknown error occurred. Please try again or contact support.';
}
