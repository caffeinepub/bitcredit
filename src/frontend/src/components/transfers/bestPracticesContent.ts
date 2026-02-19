export interface BestPracticeEntry {
  id: string;
  title: string;
  category: 'Connectivity' | 'Provider' | 'Mempool' | 'Network';
  keywords: string[];
  body: string;
}

export const bestPracticesContent: BestPracticeEntry[] = [
  {
    id: 'localhost-not-accessible',
    title: 'Localhost URLs Cannot Be Reached from IC Canisters',
    category: 'Connectivity',
    keywords: ['localhost', '127.0.0.1', '18443', 'local', 'connection', 'unable to connect', 'network error'],
    body: `**Problem:** URLs like \`http://localhost:18443\` or other local network addresses cannot be reached from deployed Internet Computer canisters.

**Why:** IC canisters run in a decentralized network and can only make HTTP outcalls to publicly accessible endpoints on the internet. Local development servers, Bitcoin Core nodes running on localhost, or any service bound to 127.0.0.1 are not accessible.

**Solution:**
- Use a publicly accessible blockchain API endpoint (e.g., \`https://blockstream.info/api/tx\`, \`https://api.blockcypher.com\`)
- If you need to use a local Bitcoin node for testing, deploy it to a publicly accessible server with a domain name or IP address
- For production, always configure the backend to use reliable public blockchain service providers

**Next Steps:**
- Review the backend canister configuration to ensure it uses a public API endpoint
- Check the diagnostic data for connection error messages mentioning localhost
- If testing locally, consider using Bitcoin testnet with public testnet APIs`,
  },
  {
    id: 'provider-timeout',
    title: 'Blockchain API Provider Timeout or Unavailable',
    category: 'Provider',
    keywords: ['timeout', 'unavailable', 'connection timeout', 'provider', 'api', 'unable to connect', 'network error', 'failed to connect'],
    body: `**Problem:** The external blockchain API provider is not responding or is experiencing downtime.

**Why:** External blockchain service providers (BlockCypher, Blockchain.info, Blockstream, etc.) may experience temporary outages, rate limiting, or network issues.

**Solution:**
- Wait a few minutes and retry the broadcast
- Check the status page of the blockchain API provider being used
- Consider configuring a fallback API provider in the backend
- Verify that the API endpoint URL is correct and publicly accessible

**Next Steps:**
- Use the "Retry Broadcast" button on this page if the transfer failed without a transaction ID
- Check diagnostic data for specific timeout or connection error messages
- If the issue persists, the backend may need to be reconfigured to use a different API provider`,
  },
  {
    id: 'mempool-congestion',
    title: 'Transaction Stuck in Mempool or Low Fee',
    category: 'Mempool',
    keywords: ['mempool', 'confirmation', 'stuck', 'pending', 'low fee', 'not confirmed', 'waiting'],
    body: `**Problem:** A transaction was successfully broadcast (has a txid) but is not confirming on the blockchain.

**Why:** Bitcoin network congestion can cause transactions with lower fees to remain unconfirmed in the mempool for extended periods. During high network activity, miners prioritize transactions with higher fees.

**Solution:**
- Wait for network congestion to decrease (can take hours or days depending on fee rate)
- Check the transaction status on a blockchain explorer (e.g., \`https://blockstream.info/tx/YOUR_TXID\`)
- For future transfers, consider increasing the network fee setting in the backend
- If the transaction has a txid, it will eventually confirm or be dropped from the mempool

**Next Steps:**
- Monitor the transaction on a blockchain explorer
- If the transaction has been broadcast (status IN_PROGRESS with txid), it will auto-update to COMPLETED once confirmed
- The app automatically checks for confirmation status when you refresh the transfer details`,
  },
  {
    id: 'wrong-network',
    title: 'Wrong Network or Invalid Address Format',
    category: 'Network',
    keywords: ['invalid address', 'wrong network', 'testnet', 'mainnet', 'address format', 'invalid', 'format', 'address rejected', 'api rejected'],
    body: `**Problem:** The destination address is invalid or belongs to a different Bitcoin network (testnet vs mainnet).

**Why:** Bitcoin addresses have different formats for mainnet and testnet. Sending to an address from the wrong network will fail validation.

**Solution:**
- Verify the destination address is a valid Bitcoin mainnet address
- Mainnet addresses typically start with \`1\`, \`3\`, or \`bc1\`
- Testnet addresses typically start with \`m\`, \`n\`, \`2\`, or \`tb1\`
- Double-check the address with the recipient before creating a new transfer request

**Next Steps:**
- If the transfer failed due to invalid address, create a new transfer request with the correct address
- Your credits have been restored for the failed transfer
- Ensure you're using the correct network (mainnet) address format`,
  },
  {
    id: 'insufficient-reserve',
    title: 'Insufficient Backend Reserve Balance',
    category: 'Provider',
    keywords: ['insufficient', 'reserve', 'backend', 'funds', 'balance'],
    body: `**Problem:** The backend reserve does not have enough BTC to cover the transfer.

**Why:** The app maintains a reserve of BTC to back issued credits. If the reserve balance is too low, transfers cannot be processed.

**Solution:**
- This is typically an admin-level issue that requires reserve management
- Contact the application administrator to add funds to the reserve
- Your credits have been restored for the failed transfer

**Next Steps:**
- Wait for the administrator to replenish the reserve
- Check back later and retry your transfer
- Your credits remain available in your balance`,
  },
  {
    id: 'fee-too-low-rbf',
    title: 'Low Fee Rate & RBF (Replace-By-Fee) Guidance',
    category: 'Mempool',
    keywords: ['rbf', 'fee too low', 'fee spike', 'mempool', 'replace by fee', 'bump fee', 'insufficient fee', 'borderline', 'fee rate'],
    body: `**Problem:** Your transaction was broadcast with a fee rate that is too low for timely confirmation, or network fees have spiked since broadcast.

**Why:** Bitcoin miners prioritize transactions with higher fees. When the mempool is congested or fees spike suddenly, transactions with lower fees may remain unconfirmed for extended periods or even be dropped.

**What is RBF (Replace-By-Fee)?**
RBF is a Bitcoin protocol feature that allows you to replace an unconfirmed transaction with a new version that pays a higher fee. This requires:
- Creating a new transaction with the same inputs but a higher fee
- Re-signing the transaction with your private key (must be done externally—never paste keys into this app)
- Broadcasting the replacement transaction to the network

**Important Limitations:**
- This app does not currently support automated RBF fee bumping for already-broadcast transactions
- RBF requires access to the original transaction's private keys and the ability to create and sign a replacement transaction externally
- Not all wallets or services support RBF

**What You Can Do:**
1. **Wait it out:** If your transaction has a txid, it may eventually confirm when network congestion decreases
2. **Monitor on a blockchain explorer:** Check \`https://blockstream.info/tx/YOUR_TXID\` to see if your transaction is still in the mempool
3. **If dropped/evicted:** If the transaction is dropped from the mempool (see "Dropped/Evicted Transaction" guidance), you can create a new transfer request with a higher fee
4. **For future transfers:** Consider using a higher network fee setting to ensure faster confirmation during periods of high network activity

**Security Reminder:**
Any RBF re-signing must be performed externally using your own secure tools. Never paste private keys into this app.

**Next Steps:**
- Check the Agent Analysis section above for suggested fee rates
- If the transaction has been dropped, your credits will be restored and you can retry with a higher fee
- Monitor the transaction status and wait for confirmation or eviction`,
  },
  {
    id: 'evicted-dropped-transaction',
    title: 'Dropped or Evicted Transaction Recovery',
    category: 'Mempool',
    keywords: ['evicted', 'dropped', 'not found', 'transaction not found', 'mempool eviction', 'tx not found', 'disappeared'],
    body: `**Problem:** Your transaction was broadcast to the network but is no longer found in the mempool and has not been confirmed on the blockchain.

**Why:** Transactions can be dropped (evicted) from the mempool for several reasons:
- The fee rate was too low and the mempool became full with higher-fee transactions
- The transaction remained unconfirmed for an extended period (typically 2 weeks)
- Network nodes restarted and did not re-broadcast the transaction
- The transaction conflicted with another transaction that was confirmed

**What Happens When a Transaction is Evicted:**
- The transaction is removed from the mempool and will not be confirmed
- The Bitcoin network treats it as if the transaction never happened
- Your credits are automatically restored in this app
- The transaction ID (txid) becomes invalid and cannot be used

**Safe Recovery Steps:**
1. **Verify eviction:** Check a blockchain explorer (\`https://blockstream.info/tx/YOUR_TXID\`) to confirm the transaction is not found
2. **Wait for automatic detection:** This app periodically checks for evicted transactions and updates the status
3. **Credits restored:** Once detected as evicted/dropped, your credits are automatically restored to your balance
4. **Create a new transfer:** You can safely create a new transfer request with a higher fee to ensure faster confirmation

**Important Notes:**
- Do NOT attempt to "retry" a transaction that has a txid and is still in the mempool—this could result in a double-spend attempt
- Only create a new transfer after confirming the original transaction is truly dropped/evicted
- Consider using a higher network fee for the new transfer to avoid the same issue

**Next Steps:**
- Verify the transaction status on a blockchain explorer
- If confirmed as evicted, create a new transfer request with an appropriate fee
- Use the Agent Analysis section above to see suggested fee rates for successful confirmation`,
  },
  {
    id: 'all-apis-rejected',
    title: 'All APIs Rejected - Multi-Provider Failure',
    category: 'Provider',
    keywords: ['all apis', 'all providers', 'multiple failures', 'all rejected', 'every api', 'all attempts failed'],
    body: `**Problem:** The system attempted to broadcast your transaction using multiple blockchain API providers, but all of them rejected the request.

**Why:** When all configured API providers reject a transaction, it typically indicates one of these issues:
- The destination address format is invalid or not recognized by any provider
- The transaction parameters violate Bitcoin protocol rules
- All providers are experiencing simultaneous outages (rare)
- The backend configuration has an issue affecting all providers

**Solution:**
- **Address Format Issues:** If all APIs rejected with address-related errors, verify the destination address is valid for Bitcoin mainnet
- **Connectivity Issues:** If all APIs timed out or failed to connect, check network status and retry after a few minutes
- **Rate Limiting:** If all APIs returned rate limit errors, wait a few minutes before retrying

**Next Steps:**
- Review the "Multi-API Broadcast Attempts" section above to see specific errors from each provider
- Check the "API Error Analysis" section to understand the error pattern
- If all errors are address-related, verify the destination address with the recipient
- If all errors are connectivity-related, wait and retry
- Your credits have been restored and you can create a new transfer request once the issue is resolved`,
  },
  {
    id: 'address-format-across-providers',
    title: 'Address Format Issues Across Multiple Providers',
    category: 'Network',
    keywords: ['address format', 'multiple providers', 'all rejected address', 'invalid address multiple', 'format error'],
    body: `**Problem:** Multiple blockchain API providers rejected the destination address, indicating a consistent address format issue.

**Why:** Different API providers may have varying levels of address validation, but when multiple providers reject the same address, it strongly suggests:
- The address is for a different Bitcoin network (testnet instead of mainnet)
- The address contains typos or formatting errors
- The address uses an unsupported or deprecated format
- The address checksum is invalid

**Solution:**
1. **Verify Network:** Ensure the address is for Bitcoin mainnet (not testnet or other networks)
2. **Check Format:** Valid mainnet addresses start with:
   - \`1\` (P2PKH - Legacy)
   - \`3\` (P2SH - Script Hash)
   - \`bc1\` (Bech32 - SegWit)
3. **Validate Checksum:** Use a Bitcoin address validator tool to verify the address checksum
4. **Confirm with Recipient:** Double-check the address with the recipient to ensure it's correct

**Next Steps:**
- Review the exact address you entered in the transfer request
- Use a blockchain explorer to verify the address format
- If the address is incorrect, create a new transfer request with the corrected address
- Your credits have been restored for the failed transfer`,
  },
  {
    id: 'connectivity-failures',
    title: 'Connectivity Failures Across Multiple APIs',
    category: 'Connectivity',
    keywords: ['connectivity', 'multiple timeouts', 'network error multiple', 'connection failed multiple', 'all timed out'],
    body: `**Problem:** Multiple blockchain API providers experienced connectivity failures when attempting to broadcast your transaction.

**Why:** Simultaneous connectivity failures across multiple providers can indicate:
- Temporary network issues between the Internet Computer and external APIs
- Internet Computer subnet experiencing connectivity problems
- Widespread API provider outages (rare)
- Firewall or network configuration issues

**Solution:**
- **Wait and Retry:** Most connectivity issues are temporary. Wait 5-10 minutes and retry the transfer
- **Check Status Pages:** Visit the status pages of major blockchain API providers to check for known outages
- **Monitor IC Status:** Check the Internet Computer status dashboard for any reported network issues
- **Try Different Time:** If the issue persists, try again during off-peak hours

**Next Steps:**
- Wait a few minutes for network conditions to improve
- Use the "Retry Transfer" button to create a new transfer request
- If the issue persists after multiple attempts, contact support with the request ID and diagnostic data
- Your credits have been restored and remain available in your balance`,
  },
  {
    id: 'rate-limiting',
    title: 'Rate Limiting Across Multiple APIs',
    category: 'Provider',
    keywords: ['rate limit', 'too many requests', 'quota exceeded', 'api limit', 'throttled'],
    body: `**Problem:** One or more blockchain API providers returned rate limit errors, indicating too many requests in a short period.

**Why:** Blockchain API providers implement rate limiting to prevent abuse and ensure fair usage:
- Free tier APIs have lower rate limits
- Multiple users sharing the same backend may hit collective limits
- Rapid retry attempts can trigger rate limiting
- Some providers have stricter limits during high-traffic periods

**Solution:**
- **Wait Before Retrying:** Most rate limits reset after a few minutes (typically 1-5 minutes)
- **Avoid Rapid Retries:** Don't repeatedly retry failed transfers immediately
- **Check Provider Limits:** Review the rate limit policies of the configured API providers
- **Consider Paid Tiers:** For high-volume usage, consider upgrading to paid API tiers with higher limits

**Next Steps:**
- Wait at least 5 minutes before retrying the transfer
- If you need to make multiple transfers, space them out over time
- Contact the administrator if rate limiting is a recurring issue (may need API tier upgrade)
- Your credits have been restored and you can retry once the rate limit window has passed`,
  },
  {
    id: 'general-troubleshooting',
    title: 'General Troubleshooting Steps',
    category: 'Connectivity',
    keywords: ['general', 'help', 'troubleshoot', 'error', 'failed', 'problem'],
    body: `**General troubleshooting steps for failed transfers:**

1. **Check the failure reason:** Review the specific error message in the "Failure Reason" section above
2. **Review diagnostic data:** Look for clues in the diagnostic data (timestamps, connection errors, API responses)
3. **Verify your balance:** Ensure you have sufficient credits to cover the total cost (amount + network fee)
4. **Check the destination address:** Confirm it's a valid Bitcoin mainnet address
5. **Retry if no txid:** If the transfer failed before being broadcast (no transaction ID), use the "Retry Broadcast" button
6. **Monitor if txid exists:** If a transaction ID was generated, the transfer was broadcast—monitor it on a blockchain explorer
7. **Credits are restored:** Failed transfers (without successful broadcast) automatically restore your credits

**When to contact support:**
- Repeated failures with the same error
- Unclear or unexpected error messages
- Issues persisting after following troubleshooting steps`,
  },
];
