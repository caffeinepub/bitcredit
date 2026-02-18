import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Copy, Check, AlertTriangle, Code } from 'lucide-react';
import { toast } from 'sonner';

const BITCOIN_CORE_RPC_SNIPPET = `from bitcoinrpc.authproxy import AuthServiceProxy

# Connect to your local Bitcoin Core Full Node
rpc_user = "your_rpc_user"
rpc_password = "your_rpc_password"
rpc_connection = AuthServiceProxy(f"http://{rpc_user}:{rpc_password}@127.0.0.1:8332")

def get_mainnet_reserve_balance():
    """
    Returns the total BTC balance of the node's wallet.
    Set include_watchonly=True if using cold storage addresses.
    """
    # getbalances returns an object with 'mine' and 'watchonly' totals
    balances = rpc_connection.getbalances()
   
    # Logic to equate app reserve to mainnet:
    # Total = Spendable + Watch-only (Cold Storage)
    total_on_chain = balances['mine']['trusted'] + balances['watchonly']['trusted']
    return total_on_chain

# Example: AI-driven reconciliation
mainnet_balance = get_mainnet_reserve_balance()
print(f"Current Mainnet Credit: {mainnet_balance} BTC")
# update_app_internal_reserve(mainnet_balance)`;

export default function BitcoinCoreReserveBalanceExternalNote() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(BITCOIN_CORE_RPC_SNIPPET);
      setCopied(true);
      toast.success('Code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy code');
    }
  };

  return (
    <Card className="financial-card border-blue-200 dark:border-blue-900">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-2 text-left">
              <Code className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <CardTitle className="text-blue-900 dark:text-blue-100">
                  Bitcoin Core RPC Reserve Balance Check (External Script)
                </CardTitle>
                <CardDescription>
                  Python snippet for querying Bitcoin Core node balance (must be run externally)
                </CardDescription>
              </div>
            </div>
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Important: External Execution Required</strong>
                <br />
                <span className="text-sm">
                  This Python script must be executed externally on a machine with access to your Bitcoin Core node. 
                  The Internet Computer canister and this web app cannot execute Python code or connect to localhost endpoints.
                </span>
              </AlertDescription>
            </Alert>

            <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                <strong>Security Warning: Never Paste Credentials in This App</strong>
                <br />
                <span className="text-sm">
                  Do not paste RPC credentials, API keys, private keys, or any secrets into this application UI. 
                  This script is provided for reference only and must be configured and run in a secure external environment.
                </span>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-muted-foreground">Python Code (Reference Only)</p>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Code
                    </>
                  )}
                </Button>
              </div>

              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono border">
                  <code>{BITCOIN_CORE_RPC_SNIPPET}</code>
                </pre>
              </div>
            </div>

            <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <strong>Why localhost (127.0.0.1:8332) is not reachable from this app:</strong>
                <br />
                <span className="text-sm">
                  Internet Computer canisters run in a decentralized network and can only make HTTP outcalls to publicly accessible endpoints on the internet. 
                  Local development servers, Bitcoin Core nodes running on localhost, or any service bound to 127.0.0.1 are not accessible from the deployed app.
                </span>
                <br />
                <br />
                <span className="text-sm font-semibold">
                  To use this script: Run it on a machine with direct access to your Bitcoin Core node (e.g., the same machine running the node, or a machine on the same local network).
                </span>
              </AlertDescription>
            </Alert>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
