import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const PYTHON_SNIPPET = `# Initialize connection to your Bitcoin Core Node (Mainnet)
proxy = RawProxy()

# PUBLIC KEYS: Use real Hex public keys from your secure devices
# AI automated key, Offline Vault key, Emergency Backup key
pubkeys = [
    '03a1...', # AI Key
    '02b4...', # Hardware Wallet
    '03c7...'  # Backup Vault
]

def create_multisig_reserve(keys, threshold=2):
    # 1. Create the Redeem Script (M-of-N)
    # This logic requires 2 signatures from 3 keys to spend
    redeem_script = CScript([OP_2] + [lx(k) for k in keys] + [OP_3, OP_CHECKMULTISIG])
   
    # 2. Add the multisig to your node's wallet to track the 900 BTC balance
    result = proxy.addmultisigaddress(threshold, keys, "btc_reserve_900")
   
    print(f"Reserve Address: {result['address']}")
    print(f"Redeem Script: {result['redeemScript']}")
    return result`;

export default function ReserveMultisigSetupExternalNote() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PYTHON_SNIPPET);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Card className="financial-card border-amber-500/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Reserve Multisig Setup (External)
                </CardTitle>
                <CardDescription>
                  Python code for Bitcoin Core multisig creation (must be run externally)
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Important: This code must be executed outside this application</strong>
                <br />
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>Run this Python script on a machine that can reach your Bitcoin Core node</li>
                  <li>This app does not run Python or connect to localhost Bitcoin Core RPC</li>
                  <li>The Internet Computer cannot connect to <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">http://localhost:18443</code></li>
                  <li>After running externally, save the resulting address and redeem script in the configuration panel below</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono border">
                <code>{PYTHON_SNIPPET}</code>
              </pre>
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>What this code does:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Creates a 2-of-3 multisig redeem script using your public keys</li>
                <li>Registers the multisig address with your Bitcoin Core node for balance tracking</li>
                <li>Returns the reserve address and redeem script for monitoring</li>
              </ul>
              <p className="mt-3">
                <strong>After running:</strong> Copy the resulting address and redeem script into the configuration form below to store them for reference and monitoring purposes.
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
