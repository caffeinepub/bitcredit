import { AlertCircle, Info, Copy, Check } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ExternalPayoutApisDeveloperNoteProps {
  context?: 'user' | 'admin';
}

export default function ExternalPayoutApisDeveloperNote({ context = 'user' }: ExternalPayoutApisDeveloperNoteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(label);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const paypalOAuthExample = `// PayPal OAuth2 Token Request
const auth = Buffer.from(\`\${CLIENT_ID}:\${CLIENT_SECRET}\`).toString('base64');
const tokenRes = await axios.post(
  'https://api-m.sandbox.paypal.com/v1/oauth2/token',
  'grant_type=client_credentials',
  { headers: { Authorization: \`Basic \${auth}\` } }
);
const accessToken = tokenRes.data.access_token;`;

  const paypalPayoutExample = `// PayPal Payout Request
const payoutData = {
  sender_batch_header: {
    sender_batch_id: \`withdraw_\${Date.now()}\`,
    email_subject: "Your Credit Withdrawal",
  },
  items: [{
    recipient_type: "EMAIL",
    amount: { value: monetaryValue.toFixed(2), currency: "USD" },
    receiver: userEmail,
    note: "Withdrawal from app credits"
  }]
};

const response = await axios.post(
  'https://api-m.sandbox.paypal.com/v1/payments/payouts',
  payoutData,
  { headers: { Authorization: \`Bearer \${accessToken}\` } }
);`;

  const stripeBalanceExample = `# Stripe: Configure manual payouts
curl https://api.stripe.com/v1/balance_settings \\
  -u "sk_test_YOUR_SECRET_KEY:" \\
  -H "Stripe-Account: {{CONNECTED_ACCOUNT_ID}}" \\
  -d "payments[payouts][schedule][interval]"=manual`;

  const stripePayoutExample = `# Stripe: Create payout
curl https://api.stripe.com/v1/payouts \\
  -u "sk_test_YOUR_SECRET_KEY:" \\
  -H "Stripe-Account: {{CONNECTED_ACCOUNT_ID}}" \\
  -d amount=1000 \\
  -d currency=usd`;

  const stripePayoutBankExample = `# Stripe: Create payout to bank account
curl https://api.stripe.com/v1/payouts \\
  -u "sk_test_YOUR_SECRET_KEY:" \\
  -H "Stripe-Account: {{CONNECTED_ACCOUNT_ID}}" \\
  -d amount=24784 \\
  -d currency=usd \\
  -d source_type=bank_account`;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
        <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <strong className="text-amber-800 dark:text-amber-200">Developer Note: External Payout APIs (PayPal/Stripe)</strong>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Reference examples for external payout integrations
              </p>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300">
                {isOpen ? 'Hide Details' : 'Show Details'}
              </Button>
            </CollapsibleTrigger>
          </div>
        </AlertDescription>
      </Alert>

      <CollapsibleContent className="mt-2">
        <div className="p-4 border border-amber-200 dark:border-amber-800 rounded-lg bg-amber-50/50 dark:bg-amber-950/10 space-y-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2 text-amber-900 dark:text-amber-100">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Important: No Automated Payout Integrations
            </h4>
            <p className="text-amber-800 dark:text-amber-200 leading-relaxed">
              This application <strong>does not execute automated PayPal, Stripe, Venmo, or bank payouts</strong>. All withdrawal requests are processed manually by administrators. The examples below are provided as reference material for external payout implementations that must be run outside of this application.
            </p>
            {context === 'admin' && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded mt-2">
                <p className="text-destructive font-semibold text-xs">
                  ⚠️ SECURITY WARNING: Never paste API secrets (including the provided Stripe test key <code className="bg-destructive/20 px-1 py-0.5 rounded font-mono">sk_test_...</code>) into this app's UI or commit them to the repository. Secrets must be stored securely in environment variables or secret management systems.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-amber-900 dark:text-amber-100">PayPal Sandbox API Reference</h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">1. OAuth2 Token Request</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(paypalOAuthExample, 'PayPal OAuth example')}
                  className="h-7 text-xs"
                >
                  {copiedSnippet === 'PayPal OAuth example' ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <Copy className="h-3 w-3 mr-1" />
                  )}
                  Copy
                </Button>
              </div>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto border">
                <code>{paypalOAuthExample}</code>
              </pre>
              <p className="text-xs text-muted-foreground">
                Endpoint: <code className="bg-muted px-1 py-0.5 rounded font-mono">https://api-m.sandbox.paypal.com/v1/oauth2/token</code>
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">2. Execute Payout</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(paypalPayoutExample, 'PayPal payout example')}
                  className="h-7 text-xs"
                >
                  {copiedSnippet === 'PayPal payout example' ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <Copy className="h-3 w-3 mr-1" />
                  )}
                  Copy
                </Button>
              </div>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto border">
                <code>{paypalPayoutExample}</code>
              </pre>
              <p className="text-xs text-muted-foreground">
                Endpoint: <code className="bg-muted px-1 py-0.5 rounded font-mono">https://api-m.sandbox.paypal.com/v1/payments/payouts</code>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-amber-900 dark:text-amber-100">Stripe API Reference (cURL Examples)</h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">1. Configure Manual Payouts</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(stripeBalanceExample, 'Stripe balance settings')}
                  className="h-7 text-xs"
                >
                  {copiedSnippet === 'Stripe balance settings' ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <Copy className="h-3 w-3 mr-1" />
                  )}
                  Copy
                </Button>
              </div>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto border">
                <code>{stripeBalanceExample}</code>
              </pre>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">2. Create Payout</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(stripePayoutExample, 'Stripe payout')}
                  className="h-7 text-xs"
                >
                  {copiedSnippet === 'Stripe payout' ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <Copy className="h-3 w-3 mr-1" />
                  )}
                  Copy
                </Button>
              </div>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto border">
                <code>{stripePayoutExample}</code>
              </pre>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">3. Create Payout to Bank Account</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(stripePayoutBankExample, 'Stripe bank payout')}
                  className="h-7 text-xs"
                >
                  {copiedSnippet === 'Stripe bank payout' ? (
                    <Check className="h-3 w-3 mr-1" />
                  ) : (
                    <Copy className="h-3 w-3 mr-1" />
                  )}
                  Copy
                </Button>
              </div>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto border">
                <code>{stripePayoutBankExample}</code>
              </pre>
            </div>

            <div className="p-3 bg-muted/50 border rounded text-xs text-muted-foreground">
              <strong>Note:</strong> Replace <code className="bg-muted px-1 py-0.5 rounded font-mono">sk_test_YOUR_SECRET_KEY</code> and <code className="bg-muted px-1 py-0.5 rounded font-mono">{'{{CONNECTED_ACCOUNT_ID}}'}</code> with your actual credentials when running these commands externally. <strong className="text-destructive">Never store these values in the app or commit them to version control.</strong>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2 text-amber-900 dark:text-amber-100">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              How to Use These Examples
            </h4>
            <p className="text-amber-800 dark:text-amber-200 leading-relaxed">
              These API calls must be executed from an external Node.js script, server environment, or command-line tool with access to your payment provider credentials. The examples use:
            </p>
            <ul className="list-disc list-inside text-amber-800 dark:text-amber-200 space-y-1 ml-2">
              <li><strong>axios</strong> (Node.js HTTP client) for PayPal examples</li>
              <li><strong>cURL</strong> (command-line tool) for Stripe examples</li>
              <li><strong>Environment variables or secure secret storage</strong> for API credentials</li>
            </ul>
            <p className="text-amber-800 dark:text-amber-200 leading-relaxed mt-2">
              This app does not run Node.js/axios code or execute shell commands. Payout automation requires a separate backend service or manual execution of these API calls by administrators.
            </p>
          </div>

          <div className="p-3 bg-amber-100 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded text-xs">
            <strong className="text-amber-900 dark:text-amber-100">Summary:</strong>
            <span className="text-amber-800 dark:text-amber-200"> This app does not execute PayPal or Stripe payouts automatically. The examples above are reference material for external implementations. All secrets must be stored securely outside of this application and never committed to the codebase.</span>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
