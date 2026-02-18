import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const PYTHON_MINING_SNIPPET = `import requests
import time

# Configuration for your Mining Pool and Wallets
POOL_API_KEY = "your_pool_api_key"
RESERVE_WALLET = "bc1_admin_reserve_address"
DAILY_TARGET_BTC = 3.0

def get_daily_earnings():
    # Connects to mining pool API to check current balance
    response = requests.get(f"https://api.miningpool.com{POOL_API_KEY}")
    data = response.json()
    return data.get('unpaid_balance', 0)

def ai_reserve_manager():
    print("AI Reserve Manager Active: Monitoring Mainnet...")
    while True:
        current_balance = get_daily_earnings()
       
        # Logic: If daily target reached, initiate transfer to reserve
        if current_balance >= DAILY_TARGET_BTC:
            print(f"Daily Target Reached: {current_balance} BTC. Initiating Reserve Transfer...")
            # Note: Real BTC transfer requires a signed transaction via local node or API
            # sign_and_send_btc(RESERVE_WALLET, DAILY_TARGET_BTC)
        else:
            print(f"Current earnings: {current_balance} BTC. Target: {DAILY_TARGET_BTC}")
           
        # Check every hour
        time.sleep(3600)

# Start the AI-driven monitoring
# ai_reserve_manager()`;

export default function ExternalAiReserveManagerMiningPoolNote() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(PYTHON_MINING_SNIPPET);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Card className="financial-card border-blue-500/50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                  External Script: AI Reserve Manager (Mining Pool)
                </CardTitle>
                <CardDescription>
                  Python monitoring script for mining pool earnings (must be run externally)
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
            <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <strong>Critical: This script must be executed externally</strong>
                <br />
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                  <li>This app does not run Python or schedule background jobs</li>
                  <li>This app does not connect to mining pools directly</li>
                  <li>Run this script on your own server or local machine with Python installed</li>
                  <li><strong>Never paste API keys or secrets into this app's UI</strong></li>
                  <li>Replace <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">POOL_API_KEY</code> and <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">RESERVE_WALLET</code> with your actual values before running</li>
                  <li>The script monitors mining pool earnings and alerts when daily targets are reached</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="relative">
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs font-mono border">
                <code>{PYTHON_MINING_SNIPPET}</code>
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
              <p><strong>What this script does:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Connects to your mining pool API to check unpaid balance</li>
                <li>Monitors earnings every hour (3600 seconds)</li>
                <li>Alerts when daily target (3.0 BTC) is reached</li>
                <li>Provides a framework for automated reserve transfers (requires implementation)</li>
              </ul>
              <p className="mt-3">
                <strong>Security reminder:</strong> This is reference code only. Never store private keys, API keys, or wallet secrets in this application. All sensitive credentials must be managed securely on your own infrastructure.
              </p>
              <p className="mt-2">
                <strong>Implementation note:</strong> The actual BTC transfer logic (<code className="bg-muted px-1 rounded">sign_and_send_btc</code>) must be implemented separately using your preferred Bitcoin transaction signing method.
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
