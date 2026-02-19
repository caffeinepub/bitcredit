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
6. Return detailed result information including broadcastAttempts array

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
5. Return broadcastAttempts array with provider name, HTTP status, and error details

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
   • Look for patterns across multiple provider failures
   • Check HTTP status codes (400 = bad request, 429 = rate limit)

<strong>Resolution:</strong>
1. Review broadcastAttempts array for specific error messages from each provider
2. Validate transaction construction and signing process
3. Check current network fee rates and adjust if necessary
4. Ensure transaction follows Bitcoin protocol standards
5. Verify inputs are unspent using blockchain explorer

<strong>Prevention:</strong>
• Implement pre-broadcast validation checks
• Use multiple API providers with fallback logic
• Monitor API health and response patterns
• Log detailed diagnostic information for each attempt`,
    keywords: ['rejected', 'all apis', 'all providers', 'broadcast failed', 'multiple failures', 'api error']
  },
  {
    id: 'rate-limiting',
    category: 'API Management',
    title: 'Rate Limiting and API Quotas',
    body: `<strong>Issue:</strong> Blockchain API provider is rate limiting or rejecting requests due to quota exceeded.

<strong>Symptoms:</strong>
• HTTP 429 (Too Many Requests) status code
• Error message: "Rate limit exceeded"
• Temporary API access denial
• Requests succeed after waiting period

<strong>Common Causes:</strong>
• Too many requests in short time period
• API key quota exhausted
• Free tier limitations
• Shared IP address rate limiting

<strong>Resolution:</strong>
1. <strong>Implement Exponential Backoff:</strong>
   • Wait before retrying failed requests
   • Increase wait time with each retry
   • Example: 1s, 2s, 4s, 8s delays

2. <strong>Use Multiple Providers:</strong>
   • Configure fallback API providers
   • Distribute requests across providers
   • Rotate providers on rate limit errors

3. <strong>Optimize Request Patterns:</strong>
   • Cache blockchain data when possible
   • Batch operations where supported
   • Implement request queuing

4. <strong>Upgrade API Plans:</strong>
   • Consider paid API tiers for higher limits
   • Use authenticated API keys for better quotas
   • Monitor usage against limits

<strong>Best Practices:</strong>
• Track API usage metrics
• Set up alerts for approaching limits
• Implement graceful degradation
• Return clear error messages to users when rate limited`,
    keywords: ['rate limit', '429', 'too many requests', 'quota', 'throttle', 'api limit']
  },
  {
    id: 'malformed-transaction',
    category: 'Transaction Format',
    title: 'Malformed Transaction Errors',
    body: `<strong>Issue:</strong> Blockchain API rejects transaction due to invalid format or encoding.

<strong>Common Causes:</strong>
• Incorrect transaction serialization
• Invalid Segwit encoding
• Missing or malformed witness data
• Incorrect script format
• Invalid signature encoding (DER format issues)

<strong>Symptoms:</strong>
• Error: "malformed transaction"
• Error: "invalid transaction format"
• Error: "bad-txns-inputs-missingorspent"
• HTTP 400 status from API

<strong>Resolution:</strong>
1. <strong>Validate Transaction Structure:</strong>
   • Verify version number (typically 1 or 2)
   • Check input and output counts
   • Validate script formats
   • Ensure proper Segwit witness structure

2. <strong>Segwit Encoding:</strong>
   • Use proper witness serialization for P2WPKH/P2WSH
   • Include witness marker and flag (0x00 0x01)
   • Verify witness data placement
   • Check address type matches transaction type

3. <strong>Signature Validation:</strong>
   • Ensure DER encoding is correct
   • Verify SIGHASH flags
   • Check signature length and format
   • Validate public key format

4. <strong>Testing:</strong>
   • Test transaction format with blockchain explorers
   • Use Bitcoin Core's testmempoolaccept RPC
   • Validate against Bitcoin protocol specifications
   • Check transaction hex encoding

<strong>Prevention:</strong>
• Use well-tested Bitcoin libraries
• Implement comprehensive transaction validation
• Test with small amounts first
• Log transaction hex for debugging`,
    keywords: ['malformed', 'invalid format', 'bad transaction', 'encoding', 'serialization', 'segwit']
  },
  {
    id: 'double-spend',
    category: 'Transaction Validation',
    title: 'Double-Spend Detection',
    body: `<strong>Issue:</strong> Transaction rejected because inputs are already spent or pending in mempool.

<strong>Symptoms:</strong>
• Error: "txn-mempool-conflict"
• Error: "bad-txns-inputs-missingorspent"
• Error: "missing inputs"
• Transaction rejected by all providers

<strong>Common Causes:</strong>
• UTXO already spent in confirmed transaction
• Conflicting transaction in mempool
• Incorrect UTXO selection
• Race condition with multiple transaction attempts

<strong>Resolution:</strong>
1. <strong>Verify UTXO Status:</strong>
   • Check if inputs are unspent on blockchain
   • Query mempool for pending transactions
   • Use blockchain explorer to verify UTXO state
   • Ensure UTXO database is up to date

2. <strong>Replace-By-Fee (RBF):</strong>
   • If original transaction is stuck, use RBF
   • Increase fee to replace pending transaction
   • Signal RBF in transaction (nSequence < 0xfffffffe)
   • Ensure new transaction spends same inputs

3. <strong>UTXO Management:</strong>
   • Implement proper UTXO tracking
   • Lock UTXOs during transaction construction
   • Update UTXO set after successful broadcast
   • Handle concurrent transaction requests

4. <strong>Recovery:</strong>
   • Wait for conflicting transaction to confirm or drop
   • Use different UTXOs for new transaction
   • Implement transaction cancellation if needed

<strong>Prevention:</strong>
• Maintain accurate UTXO database
• Implement UTXO locking mechanism
• Use transaction queuing for sequential processing
• Monitor mempool for conflicts`,
    keywords: ['double spend', 'utxo', 'inputs spent', 'mempool conflict', 'missing inputs', 'rbf']
  },
  {
    id: 'insufficient-fee',
    category: 'Fee Management',
    title: 'Insufficient Network Fee',
    body: `<strong>Issue:</strong> Transaction rejected or stuck in mempool due to insufficient network fee.

<strong>Symptoms:</strong>
• Transaction not confirming after extended period
• Error: "min relay fee not met"
• Error: "insufficient priority"
• Transaction dropped from mempool

<strong>Common Causes:</strong>
• Fee rate too low for current network conditions
• Mempool congestion
• Transaction size larger than expected
• Outdated fee estimation

<strong>Resolution:</strong>
1. <strong>Fee Estimation:</strong>
   • Query current fee rates from blockchain APIs
   • Use fee estimation endpoints (e.g., /fee-estimates)
   • Target appropriate confirmation time (1-6 blocks)
   • Account for transaction size (vBytes)

2. <strong>Fee Rate Calculation:</strong>
   • Minimum: 1 sat/vByte (may not confirm quickly)
   • Standard: 10-50 sat/vByte (normal conditions)
   • Priority: 50-100+ sat/vByte (fast confirmation)
   • Check current mempool conditions

3. <strong>Replace-By-Fee (RBF):</strong>
   • Enable RBF when creating transaction
   • Bump fee if transaction is stuck
   • Increase fee by at least 1 sat/vByte
   • Rebroadcast with higher fee

4. <strong>Monitoring:</strong>
   • Track transaction confirmation status
   • Monitor mempool depth and fee rates
   • Set up alerts for stuck transactions
   • Implement automatic fee bumping

<strong>Best Practices:</strong>
• Use dynamic fee estimation
• Add fee buffer for safety (10-20% extra)
• Implement RBF by default
• Monitor network conditions before broadcasting
• Provide fee options to users (slow/medium/fast)`,
    keywords: ['fee', 'insufficient', 'min relay', 'priority', 'stuck', 'mempool', 'sat/vbyte']
  },
  {
    id: 'provider-timeout',
    category: 'Network Issues',
    title: 'Provider Timeout and Connection Issues',
    body: `<strong>Issue:</strong> Blockchain API provider not responding or timing out.

<strong>Symptoms:</strong>
• Request timeout errors
• No response from API
• Connection refused
• Network unreachable

<strong>Common Causes:</strong>
• API endpoint is down or overloaded
• Network connectivity issues
• IC HTTP outcall timeout (default ~30 seconds)
• DNS resolution failures
• Firewall or routing issues

<strong>Resolution:</strong>
1. <strong>Implement Retry Logic:</strong>
   • Retry failed requests with exponential backoff
   • Maximum 3-5 retry attempts
   • Use different providers for retries
   • Log each attempt with timestamp

2. <strong>Multiple Providers:</strong>
   • Configure at least 3 blockchain API providers
   • Implement automatic failover
   • Track provider health and response times
   • Rotate providers on failures

3. <strong>Timeout Configuration:</strong>
   • Set appropriate timeout values (10-30 seconds)
   • Handle timeout errors gracefully
   • Return partial results when possible
   • Provide user feedback on delays

4. <strong>Health Monitoring:</strong>
   • Ping providers periodically
   • Track success/failure rates
   • Disable unhealthy providers temporarily
   • Alert on provider failures

<strong>Recommended Providers:</strong>
• Primary: Blockstream.info
• Secondary: Blockchain.info
• Tertiary: BlockCypher
• Monitor status pages for known issues

<strong>Prevention:</strong>
• Use multiple providers from different networks
• Implement circuit breaker pattern
• Cache responses when appropriate
• Set up monitoring and alerting`,
    keywords: ['timeout', 'connection', 'unreachable', 'network', 'provider down', 'no response']
  },
  {
    id: 'address-format-issues',
    category: 'Address Validation',
    title: 'Bitcoin Address Format Issues',
    body: `<strong>Issue:</strong> Destination address is invalid or incompatible with transaction type.

<strong>Common Causes:</strong>
• Testnet address used on mainnet (or vice versa)
• Invalid address checksum
• Unsupported address type
• Malformed address string
• Wrong network prefix

<strong>Address Types:</strong>
1. <strong>Legacy (P2PKH):</strong>
   • Mainnet: starts with "1"
   • Testnet: starts with "m" or "n"
   • Example: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa

2. <strong>Script Hash (P2SH):</strong>
   • Mainnet: starts with "3"
   • Testnet: starts with "2"
   • Example: 3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy

3. <strong>Segwit (Bech32):</strong>
   • Mainnet: starts with "bc1"
   • Testnet: starts with "tb1"
   • P2WPKH: 42 characters
   • P2WSH: 62 characters
   • Example: bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq

<strong>Resolution:</strong>
1. <strong>Validation:</strong>
   • Verify address checksum
   • Check network prefix matches target network
   • Validate address length
   • Use Bitcoin address validation library

2. <strong>Network Detection:</strong>
   • Detect address network from prefix
   • Warn if address doesn't match expected network
   • Prevent cross-network transactions
   • Display clear error messages

3. <strong>Address Conversion:</strong>
   • Support multiple address formats
   • Convert between formats when possible
   • Prefer Segwit addresses for lower fees
   • Document supported address types

<strong>Best Practices:</strong>
• Validate addresses before transaction construction
• Display address type to user
• Support all common address formats
• Provide clear error messages for invalid addresses
• Test with addresses from each format type`,
    keywords: ['address', 'invalid', 'format', 'checksum', 'testnet', 'mainnet', 'bc1', 'bech32', 'segwit']
  },
  {
    id: 'reserve-management',
    category: 'System Management',
    title: 'Reserve Balance and Fee Management',
    body: `<strong>Issue:</strong> Insufficient reserve balance to cover network fees for transactions.

<strong>Symptoms:</strong>
• Transaction creation fails
• Error: "insufficient reserve balance"
• Cannot cover network fees
• Reserve coverage ratio below threshold

<strong>Common Causes:</strong>
• Reserve not funded adequately
• High network fees depleting reserve
• Many pending transactions
• Reserve not replenished after withdrawals

<strong>Resolution:</strong>
1. <strong>Monitor Reserve:</strong>
   • Track reserve balance regularly
   • Calculate coverage ratio (reserve / issued credits)
   • Set up alerts for low reserve
   • Monitor pending outflows

2. <strong>Fee Management:</strong>
   • Estimate fees before transaction creation
   • Use dynamic fee calculation
   • Reserve buffer for fee spikes
   • Track fee expenditure

3. <strong>Reserve Replenishment:</strong>
   • Deposit Bitcoin to reserve address
   • Verify deposits on blockchain
   • Update reserve balance in system
   • Maintain minimum coverage ratio (e.g., 110%)

4. <strong>Transaction Prioritization:</strong>
   • Queue transactions when reserve is low
   • Prioritize by user tier or amount
   • Batch transactions to save fees
   • Implement fee limits

<strong>Best Practices:</strong>
• Maintain reserve coverage above 120%
• Monitor network fee trends
• Automate reserve monitoring
• Set up multi-signature reserve wallet
• Document reserve management procedures
• Regular reserve audits`,
    keywords: ['reserve', 'balance', 'insufficient', 'coverage', 'fee management', 'funding']
  }
];
