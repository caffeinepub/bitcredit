export function normalizeError(error: any): string {
  if (!error) return 'An unknown error occurred';

  // Extract error message from various error formats
  let errorMessage = '';

  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error.message) {
    errorMessage = error.message;
  } else if (error.toString) {
    errorMessage = error.toString();
  }

  // Backend method missing errors
  if (errorMessage.includes('has no method') || 
      errorMessage.includes('does not exist') ||
      errorMessage.includes('not implemented')) {
    return 'This feature is not yet implemented in the backend. The required method is missing from the canister.';
  }

  // sendBTC specific errors
  if (errorMessage.includes('sendBTC')) {
    if (errorMessage.includes('not implemented') || errorMessage.includes('not available')) {
      return 'Bitcoin sending is not yet available. The backend needs to implement transaction signing, broadcasting via HTTP outcalls, and confirmation tracking.';
    }
  }

  // Insufficient balance
  if (errorMessage.toLowerCase().includes('insufficient balance') ||
      errorMessage.toLowerCase().includes('not enough balance')) {
    return 'Insufficient balance. Please ensure you have enough credits to complete this transaction.';
  }

  // Invalid address format
  if (errorMessage.toLowerCase().includes('invalid address') ||
      errorMessage.toLowerCase().includes('address format')) {
    return 'Invalid Bitcoin address format. Please provide a valid Segwit address (P2WPKH or P2WSH).';
  }

  // HTTP outcall failures
  if (errorMessage.includes('HTTP outcall') || 
      errorMessage.includes('outcall failed') ||
      errorMessage.includes('network error')) {
    return 'Network communication error. The Internet Computer HTTP outcall to the blockchain API failed. This may be due to API rate limits, network issues, or provider downtime.';
  }

  // Signing errors
  if (errorMessage.toLowerCase().includes('signing') ||
      errorMessage.toLowerCase().includes('signature')) {
    return 'Transaction signing failed. The backend was unable to sign the transaction. This may indicate a key management issue or threshold ECDSA problem.';
  }

  // Broadcasting errors
  if (errorMessage.toLowerCase().includes('broadcast') ||
      errorMessage.toLowerCase().includes('propagation')) {
    return 'Transaction broadcasting failed. The signed transaction could not be broadcast to the Bitcoin network. Check provider diagnostics for details.';
  }

  // Blockchain provider errors
  if (errorMessage.includes('blockchain.info') ||
      errorMessage.includes('blockstream.info') ||
      errorMessage.includes('blockcypher')) {
    return 'Blockchain API provider error. The external blockchain service returned an error or is unavailable. Try again later or check provider diagnostics.';
  }

  // Mainnet-specific errors
  if (errorMessage.toLowerCase().includes('mainnet') ||
      errorMessage.toLowerCase().includes('testnet')) {
    return 'Network configuration error. There may be a mismatch between the requested network (mainnet/testnet) and the transaction parameters.';
  }

  // Confirmation tracking errors
  if (errorMessage.toLowerCase().includes('confirmation') ||
      errorMessage.toLowerCase().includes('mempool')) {
    return 'Confirmation tracking error. Unable to retrieve transaction confirmation status from the blockchain. The transaction may still be valid.';
  }

  // Fee calculation errors
  if (errorMessage.toLowerCase().includes('fee') ||
      errorMessage.toLowerCase().includes('reserve')) {
    return 'Fee calculation or reserve balance error. The system may not have sufficient reserve funds to cover network fees.';
  }

  // Authorization errors
  if (errorMessage.includes('Unauthorized') || 
      errorMessage.includes('permission') ||
      errorMessage.includes('not allowed')) {
    return 'You do not have permission to perform this action. Please ensure you are logged in with the correct account.';
  }

  // Trap errors from backend
  if (errorMessage.includes('trap') || errorMessage.includes('Runtime.trap')) {
    // Try to extract the actual trap message
    const trapMatch = errorMessage.match(/trap[:\s]+(.+?)(?:\n|$)/i);
    if (trapMatch && trapMatch[1]) {
      return trapMatch[1].trim();
    }
    return 'Backend error: ' + errorMessage;
  }

  // Generic network errors
  if (errorMessage.toLowerCase().includes('network') ||
      errorMessage.toLowerCase().includes('timeout') ||
      errorMessage.toLowerCase().includes('connection')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Return the original error message if no pattern matches
  return errorMessage || 'An unexpected error occurred';
}
