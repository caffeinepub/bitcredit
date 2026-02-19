export interface BestPracticeEntry {
  id: string;
  category: string;
  title: string;
  body: string;
  keywords: string[];
}

export const bestPracticesContent: BestPracticeEntry[] = [
  {
    id: 'backend-method-missing',
    category: 'Backend Implementation',
    title: 'sendBTC Method Not Available',
    body: `<strong>Issue:</strong> The backend canister does not implement the sendBTC method required for sending Bitcoin to external addresses.

<strong>Symptoms:</strong>
• Error message: "sendBTC method not available on backend"
• Send Bitcoin form is disabled
• Cannot initiate Bitcoin transfers to external addresses

<strong>Root Cause:</strong>
The backend/main.mo file does not export a public sendBTC function. The frontend is attempting to call a method that doesn't exist in the backend interface.

<strong>Resolution:</strong>
The backend needs to implement a public method with this signature:
<code>public shared ({ caller }) func sendBTC(destination: Text, amount: BitcoinAmount) : async SendBTCResult</code>

This method should:
1. Validate the destination address format
2. Check user balance and reserve availability
3. Sign the Bitcoin transaction
4. Broadcast to blockchain APIs via HTTP outcalls
5. Track signing and broadcast status
6. Return detailed result information

<strong>Workarounds:</strong>
• Use Withdrawal Requests for admin-processed transfers
• Use Send to Peer for internal credit transfers between users`,
    keywords: ['backend', 'sendBTC', 'method', 'not available', 'implementation', 'missing', 'function']
  },
  {
    id: 'http-outcall-failures',
    category: 'Backend Implementation',
    title: 'HTTP Outcall Failures',
    body: `<strong>Issue:</strong> Internet Computer HTTP outcalls to blockchain APIs are failing or being rejected.

<strong>Common Causes:</strong>
• Localhost endpoints (127.0.0.1, localhost:18443) are not accessible from IC canisters
• HTTP outcalls require publicly accessible HTTPS endpoints
• API rate limiting or quota exceeded
• Network timeouts during high load
• API endpoint is down or unreachable

<strong>Resolution:</strong>
1. Configure backend to use public blockchain APIs:
   • https://blockstream.info/api/ (Blockstream)
   • https://blockchain.info/ (Blockchain.info)
   • https://api.blockcypher.com/ (BlockCypher)

2. Implement retry logic with multiple providers
3. Add proper timeout handling (IC HTTP outcalls have time limits)
4. Include detailed error logging for diagnostics

<strong>Testing:</strong>
• Test HTTP outcalls from IC canister environment, not local development
• Verify API endpoints are publicly accessible
• Check API documentation for rate limits and authentication requirements`,
    keywords: ['http', 'outcall', 'api', 'blockchain', 'connectivity', 'network', 'timeout', 'localhost']
  },
  {
    id: 'localhost-not-accessible',
    category: 'Network Configuration',
    title: 'Localhost Endpoints Not Accessible from IC',
    body: `<strong>Issue:</strong> Cannot connect to localhost Bitcoin Core node or local blockchain APIs from IC canisters.

<strong>Why This Happens:</strong>
Internet Computer canisters run in a distributed network and cannot access localhost (127.0.0.1) or private network endpoints. HTTP outcalls can only reach publicly accessible HTTPS endpoints.

<strong>Error Messages:</strong>
• "Cannot connect to localhost endpoints from IC canisters"
• "Connection refused to 127.0.0.1:18443"
• "HTTP outcall failed: unreachable endpoint"

<strong>Resolution:</strong>
1. <strong>For Development:</strong>
   • Use public testnet APIs (e.g., https://blockstream.info/testnet/api/)
   • Deploy a publicly accessible Bitcoin node with HTTPS endpoint
   • Use ngrok or similar tunneling service (not recommended for production)

2. <strong>For Production:</strong>
   • Use established public blockchain APIs
   • Configure multiple API providers for redundancy
   • Implement proper error handling and fallback logic

<strong>Recommended Public APIs:</strong>
• Blockstream: https://blockstream.info/api/
• Blockchain.info: https://blockchain.info/
• BlockCypher: https://api.blockcypher.com/v1/btc/main`,
    keywords: ['localhost', '127.0.0.1', 'local', 'bitcoin core', 'rpc', 'connection', 'unreachable', '18443']
  },
  {
    id: 'signing-failures',
    category: 'Transaction Signing',
    title: 'Transaction Signing Failures',
    body: `<strong>Issue:</strong> Backend unable to sign Bitcoin transactions before broadcasting.

<strong>Common Causes:</strong>
• Private key not available or not properly initialized
• Invalid transaction parameters (amount, destination address)
• Insufficient reserve balance to cover network fees
• Threshold ECDSA signing errors (if using IC threshold signatures)

<strong>Resolution:</strong>
1. <strong>Key Management:</strong>
   • Ensure private keys are securely stored in canister stable memory
   • Consider using IC threshold ECDSA for decentralized key management
   • Verify key initialization during canister deployment

2. <strong>Transaction Validation:</strong>
   • Validate destination address format before signing
   • Check that amount + fees don't exceed available balance
   • Verify transaction inputs and outputs are properly constructed

3. <strong>Error Handling:</strong>
   • Return specific error messages for different signing failure types
   • Log signing attempts for debugging
   • Track signing status (pending, signed, failed) in transaction records

<strong>Security Considerations:</strong>
• Never expose private keys in error messages or logs
• Implement rate limiting on signing operations
• Validate all transaction parameters before signing`,
    keywords: ['signing', 'signature', 'private key', 'ecdsa', 'threshold', 'failed', 'sign']
  },
  {
    id: 'all-apis-rejected',
    category: 'Broadcasting',
    title: 'All Blockchain APIs Rejected Transaction',
    body: `<strong>Issue:</strong> All configured blockchain API providers rejected the transaction broadcast.

<strong>Common Causes:</strong>
• Invalid destination address format (testnet address on mainnet, or vice versa)
• Transaction signature is invalid or malformed
• Network fee too low for current mempool conditions
• Transaction size exceeds API limits
• Duplicate transaction (same inputs already spent)

<strong>Diagnosis:</strong>
1. Check destination address:
   • Mainnet addresses start with 1, 3, or bc1
   • Testnet addresses start with m, n, or tb1
   • Verify address checksum is valid

2. Verify transaction format:
   • Ensure transaction is properly serialized
   • Check that signature is valid
   • Verify all inputs are unspent

3. Review API error responses:
   • Each API may provide specific rejection reasons
   • Look for patterns across multiple API failures
   • Check API documentation for error codes

<strong>Resolution:</strong>
• Validate address format before signing
• Implement transaction format validation
• Increase network fee if mempool is congested
• Add detailed error logging for each API attempt
• Consider implementing transaction pre-validation`,
    keywords: ['all apis', 'rejected', 'broadcast', 'failed', 'multiple', 'providers', 'address format']
  },
  {
    id: 'address-format-issues',
    category: 'Address Validation',
    title: 'Address Format Issues Across Providers',
    body: `<strong>Issue:</strong> Blockchain APIs rejecting transactions due to address format problems.

<strong>Common Problems:</strong>
• Using testnet address on mainnet (or vice versa)
• Invalid address checksum
• Unsupported address type (some APIs don't support all Segwit formats)
• Malformed address string

<strong>Address Format Guide:</strong>
<strong>Mainnet:</strong>
• Legacy (P2PKH): Starts with 1
• Script (P2SH): Starts with 3
• Segwit (P2WPKH): Starts with bc1q
• Taproot (P2TR): Starts with bc1p

<strong>Testnet:</strong>
• Legacy: Starts with m or n
• Script: Starts with 2
• Segwit: Starts with tb1q
• Taproot: Starts with tb1p

<strong>Resolution:</strong>
1. Implement address validation before signing:
   • Check address prefix matches network (mainnet vs testnet)
   • Verify address checksum
   • Validate address length

2. Support multiple address formats:
   • Ensure backend can handle Legacy, P2SH, and Segwit addresses
   • Document which address types are supported

3. Provide clear error messages:
   • Tell users which address format was rejected
   • Suggest correct address format for the network`,
    keywords: ['address', 'format', 'invalid', 'testnet', 'mainnet', 'segwit', 'bc1', 'validation']
  },
  {
    id: 'provider-timeout',
    category: 'Network Issues',
    title: 'Blockchain API Provider Timeouts',
    body: `<strong>Issue:</strong> HTTP outcalls to blockchain APIs are timing out before completing.

<strong>Common Causes:</strong>
• API provider experiencing high load
• Network connectivity issues
• IC HTTP outcall time limits exceeded
• API endpoint is slow or unresponsive

<strong>Resolution:</strong>
1. <strong>Implement Timeout Handling:</strong>
   • Set reasonable timeout values (e.g., 10-30 seconds)
   • Implement retry logic with exponential backoff
   • Try alternative API providers on timeout

2. <strong>Multi-Provider Strategy:</strong>
   • Configure multiple blockchain API providers
   • Attempt providers in priority order
   • Fall back to alternative providers on timeout

3. <strong>Optimize Requests:</strong>
   • Use efficient API endpoints
   • Minimize request payload size
   • Cache API responses when appropriate

<strong>Monitoring:</strong>
• Track API response times
• Log timeout occurrences for each provider
• Alert when all providers are timing out (indicates broader issue)`,
    keywords: ['timeout', 'slow', 'api', 'provider', 'network', 'connectivity', 'unresponsive']
  },
  {
    id: 'rate-limiting',
    category: 'API Management',
    title: 'API Rate Limiting',
    body: `<strong>Issue:</strong> Blockchain API providers are rate limiting or rejecting requests due to quota exceeded.

<strong>Symptoms:</strong>
• Error messages: "rate limit exceeded", "too many requests", "quota exceeded"
• HTTP 429 status codes
• Intermittent failures during high usage periods

<strong>Resolution:</strong>
1. <strong>Implement Rate Limit Handling:</strong>
   • Detect rate limit errors (HTTP 429, specific error messages)
   • Implement exponential backoff retry logic
   • Respect Retry-After headers from APIs

2. <strong>Use Multiple API Providers:</strong>
   • Distribute requests across multiple providers
   • Implement round-robin or weighted load balancing
   • Track rate limit status per provider

3. <strong>Optimize API Usage:</strong>
   • Cache API responses when possible
   • Batch requests where supported
   • Implement request queuing to avoid bursts

4. <strong>Consider API Keys:</strong>
   • Many providers offer higher rate limits with API keys
   • Implement API key rotation if needed
   • Monitor usage against quotas

<strong>Best Practices:</strong>
• Monitor rate limit usage proactively
• Implement graceful degradation when limits are reached
• Provide clear user feedback when rate limited`,
    keywords: ['rate limit', 'quota', 'too many requests', '429', 'throttle', 'api key']
  },
  {
    id: 'wrong-network',
    category: 'Configuration',
    title: 'Wrong Network Configuration',
    body: `<strong>Issue:</strong> Attempting to use testnet addresses on mainnet or vice versa.

<strong>Symptoms:</strong>
• Address validation failures
• APIs rejecting transactions
• "Invalid address" errors

<strong>Network Identification:</strong>
<strong>Mainnet Addresses:</strong>
• Legacy: 1...
• P2SH: 3...
• Segwit: bc1...

<strong>Testnet Addresses:</strong>
• Legacy: m... or n...
• P2SH: 2...
• Segwit: tb1...

<strong>Resolution:</strong>
1. <strong>Verify Network Configuration:</strong>
   • Check backend is configured for correct network (mainnet vs testnet)
   • Ensure blockchain API endpoints match network
   • Validate address prefixes match network

2. <strong>Implement Network Detection:</strong>
   • Detect network from address prefix
   • Warn users if address doesn't match configured network
   • Prevent cross-network transactions

3. <strong>Clear Documentation:</strong>
   • Document which network the application uses
   • Provide examples of valid addresses for the network
   • Explain differences between mainnet and testnet

<strong>Testing:</strong>
• Use testnet for development and testing
• Switch to mainnet only for production
• Never mix testnet and mainnet addresses`,
    keywords: ['network', 'testnet', 'mainnet', 'wrong', 'address', 'bc1', 'tb1', 'configuration']
  },
  {
    id: 'mempool-stuck',
    category: 'Confirmation Issues',
    title: 'Transaction Stuck in Mempool',
    body: `<strong>Issue:</strong> Transaction broadcast successfully but not confirming for extended period.

<strong>Common Causes:</strong>
• Network fee too low for current mempool conditions
• High network congestion
• Transaction may be evicted if fee is too low

<strong>Expected Confirmation Times:</strong>
• 1 confirmation: ~10 minutes (first block)
• 3 confirmations: ~30 minutes
• 6 confirmations: ~60 minutes

<strong>What to Do:</strong>
1. <strong>Monitor Transaction:</strong>
   • Check transaction on blockchain explorer
   • Verify it's in the mempool
   • Check current mempool fee rates

2. <strong>Wait for Confirmation:</strong>
   • Transactions with adequate fees will eventually confirm
   • During high congestion, may take several hours
   • Don't attempt to re-send (will create duplicate)

3. <strong>If Transaction is Evicted:</strong>
   • Transaction will be dropped from mempool after ~72 hours
   • Credits will be restored to user balance
   • Can create new transaction with higher fee

<strong>Prevention:</strong>
• Implement dynamic fee estimation based on current mempool
• Provide fee options (slow/medium/fast)
• Monitor mempool conditions before broadcasting`,
    keywords: ['mempool', 'stuck', 'unconfirmed', 'pending', 'slow', 'confirmation', 'fee']
  },
  {
    id: 'insufficient-reserve',
    category: 'Balance Management',
    title: 'Insufficient Reserve Balance',
    body: `<strong>Issue:</strong> Backend reserve doesn't have enough Bitcoin to cover transaction fees.

<strong>Symptoms:</strong>
• "Insufficient reserve" error messages
• Transactions failing during signing phase
• Cannot initiate new transfers

<strong>Understanding Reserve:</strong>
The backend maintains a Bitcoin reserve to cover:
• Network transaction fees
• User withdrawal requests
• Mainnet transaction broadcasting

<strong>Resolution:</strong>
1. <strong>For Administrators:</strong>
   • Deposit Bitcoin to reserve address
   • Monitor reserve balance regularly
   • Set up alerts for low reserve levels

2. <strong>For Users:</strong>
   • Contact administrator to replenish reserve
   • Use alternative transfer methods (peer-to-peer)
   • Wait for reserve to be replenished

<strong>Prevention:</strong>
• Implement reserve monitoring and alerts
• Maintain reserve buffer above minimum operational level
• Track reserve usage trends
• Plan for fee rate increases during network congestion`,
    keywords: ['reserve', 'insufficient', 'balance', 'fee', 'deposit', 'low']
  }
];
