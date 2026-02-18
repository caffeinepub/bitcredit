import { AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function BroadcastingDetailsNote() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Alert className="border-chart-2 bg-chart-2/5">
        <Info className="h-4 w-4 text-chart-2" />
        <AlertDescription>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <strong className="text-chart-2">Developer Note: How Broadcasting Works</strong>
              <p className="text-sm text-muted-foreground mt-1">
                Learn about how this app broadcasts Bitcoin transactions to the blockchain
              </p>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-chart-2 hover:text-chart-2">
                {isOpen ? 'Hide Details' : 'Show Details'}
              </Button>
            </CollapsibleTrigger>
          </div>
        </AlertDescription>
      </Alert>

      <CollapsibleContent className="mt-2">
        <div className="p-4 border rounded-lg bg-muted/30 space-y-3 text-sm">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded space-y-2">
            <h4 className="font-semibold flex items-center gap-2 text-amber-900 dark:text-amber-100">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              Critical Security Warning
            </h4>
            <p className="text-amber-900 dark:text-amber-100 leading-relaxed">
              <strong>Never paste or store private keys (WIF format), seed phrases, or API secrets in this app.</strong> This application does not accept, process, or store any private key material. All transaction creation and signing must be performed externally using your own secure tools and environments.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-chart-2" />
              How Transaction Broadcasting Works
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              This application uses an <strong>app-managed custodial reserve model</strong> to broadcast Bitcoin transactions. The backend canister makes secure HTTP requests (via Internet Computer HTTP outcalls) to publicly accessible blockchain APIs to submit transactions to the Bitcoin network.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Transaction creation and signing requires private keys and must be done externally.</strong> This app focuses on broadcasting already-signed transactions and verifying their status via public blockchain APIs. Broadcasting typically involves submitting raw transaction hex to a public API endpoint. For example, <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">https://blockstream.info/api/tx</code> is a publicly reachable broadcast endpoint.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-chart-2" />
              External Signing vs. App Broadcasting
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              <strong>What this app does:</strong> Uses IC HTTP outcalls to reach publicly accessible blockchain APIs for broadcasting transactions and checking status/confirmation.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>What you must do externally:</strong> Transaction creation and signing (PSBT - Partially Signed Bitcoin Transaction) requires private keys and must be handled outside this application using external tools or scripts run on your own secure systems.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Python scripts (using libraries like <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">bitcoinlib</code> or <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">bit</code>), Node.js scripts using <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">bitcoinjs-lib</code>, or other external tools that interact with Bitcoin Core RPC endpoints <strong>must be run outside of this application</strong>. They cannot be executed by the backend canister or frontend browser environment.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-chart-2" />
              Why Local Node URLs Don't Work
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              URLs like <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">http://localhost:18443</code> or other local network addresses <strong>cannot be reached from the deployed canister environment</strong>. The Internet Computer canisters run in a decentralized network and can only make HTTP outcalls to publicly accessible endpoints on the internet.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              If you see connection errors mentioning localhost or network timeouts, this means the configured blockchain API endpoint is either:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>Not publicly accessible (e.g., running on localhost)</li>
              <li>Temporarily unavailable or experiencing downtime</li>
              <li>Misconfigured in the backend canister settings</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-chart-2" />
              External Script Workflow (For Reference Only)
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              If you need to manually create and broadcast a transaction using external tools (this is <strong>not</strong> part of this app):
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>Create and sign the PSBT using your private keys in a secure external environment (your own machine/server)</li>
              <li>Extract the raw transaction hex from the finalized PSBT</li>
              <li>Submit the raw hex to a public blockchain API (e.g., <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">https://blockstream.info/api/tx</code>)</li>
              <li>Run your Python/Node.js scripts on your local machine or a server with access to a Bitcoin node</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed font-semibold mt-2">
              Remember: Private keys must never be entered into this app. All signing operations must occur externally.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-chart-2" />
              Troubleshooting Connection Failures
            </h4>
            <p className="text-muted-foreground leading-relaxed">
              If a transfer request fails with a connection or network error:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li><strong>Check the configured blockchain API:</strong> Ensure the backend is configured to use a publicly accessible API endpoint (not localhost)</li>
              <li><strong>Verify API availability:</strong> The external blockchain service may be experiencing downtime</li>
              <li><strong>Review diagnostic data:</strong> Check the transfer request details in History for specific error messages</li>
              <li><strong>Credits are restored:</strong> If broadcasting fails, your credits are automatically refunded—no net charge occurs</li>
            </ul>
          </div>

          <div className="p-3 bg-chart-2/10 border border-chart-2/20 rounded text-xs text-muted-foreground">
            <strong className="text-chart-2">Summary:</strong> This app uses IC HTTP outcalls to broadcast transactions via external blockchain APIs (e.g., <code className="bg-muted px-1 py-0.5 rounded font-mono">https://blockstream.info/api/tx</code>). Transaction signing (PSBT) requires private keys and must be done externally—never paste private keys into this app. Local node URLs (localhost) are not accessible from the canister. External scripts must be run separately outside this application on your own secure systems.
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
