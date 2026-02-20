import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, Lock, Key, AlertTriangle, Info } from 'lucide-react';

export default function SecurityEducationPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Bitcoin Wallet Security Best Practices
        </CardTitle>
        <CardDescription>
          Essential information about securing your Bitcoin and understanding wallet architecture
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="threshold-ecdsa">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                What is Threshold ECDSA?
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              <p>
                Threshold ECDSA is an advanced cryptographic protocol that distributes private key material
                across multiple parties (in this case, Internet Computer subnet nodes) so that no single
                party ever has access to the complete private key.
              </p>
              <p>
                When you need to sign a Bitcoin transaction, the subnet nodes collaborate through a secure
                multi-party computation protocol to generate a valid signature without ever reconstructing
                the private key in one location.
              </p>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  This provides significantly enhanced security compared to traditional wallets where
                  private keys are stored in one location and can be stolen or lost.
                </AlertDescription>
              </Alert>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="self-custody">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Self-Custody vs Custodial Wallets
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              <p>
                <strong>Custodial Wallets:</strong> A third party (like an exchange) holds your private
                keys and controls your Bitcoin. You trust them to secure your funds.
              </p>
              <p>
                <strong>Self-Custody Wallets:</strong> You control your own private keys and have full
                responsibility for securing your Bitcoin.
              </p>
              <p>
                <strong>This Application:</strong> Uses a hybrid approach with threshold ECDSA. You maintain
                control through your Internet Identity, but private keys are never exposed or stored in a
                traditional format. This combines the security benefits of self-custody with enhanced
                protection against key loss or theft.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="security-tips">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Security Best Practices
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              <ul className="list-disc list-inside space-y-1">
                <li>Secure your Internet Identity with strong authentication methods</li>
                <li>Enable and safely store Internet Identity recovery phrases</li>
                <li>Never share your Internet Identity credentials</li>
                <li>Always verify transaction details before signing</li>
                <li>Be cautious of phishing attempts and fake websites</li>
                <li>Keep your devices secure with updated software and antivirus</li>
                <li>Use hardware security keys for Internet Identity when possible</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="risks">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Understanding the Risks
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    <li>Bitcoin transactions are irreversible - always double-check addresses</li>
                    <li>If you lose access to your Internet Identity, you may lose access to your Bitcoin</li>
                    <li>No customer support can recover lost credentials or reverse transactions</li>
                    <li>You are solely responsible for the security of your authentication methods</li>
                    <li>Smart contract bugs or protocol vulnerabilities could potentially affect funds</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="backup">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Backup and Recovery
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              <p>
                Since this application uses Internet Identity for authentication:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Set up multiple authentication methods in Internet Identity</li>
                <li>Securely store your Internet Identity recovery phrases offline</li>
                <li>Consider using hardware security keys as backup authentication</li>
                <li>Test your recovery methods periodically</li>
                <li>Never store recovery information digitally or in cloud services</li>
              </ul>
              <Alert className="mt-3">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Your ability to access your Bitcoin depends entirely on your ability to authenticate
                  with Internet Identity. Treat your recovery information with the same care you would
                  treat a traditional private key.
                </AlertDescription>
              </Alert>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
