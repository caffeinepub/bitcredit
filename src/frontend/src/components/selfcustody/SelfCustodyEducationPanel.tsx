import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card } from '@/components/ui/card';
import { BookOpen, Shield, Key, AlertTriangle } from 'lucide-react';

export default function SelfCustodyEducationPanel() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Learn About Self-Custody Wallets</h3>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="what-is">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              What are Self-Custody Wallets?
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-2">
            <p>
              Self-custody wallets are Bitcoin addresses where you directly control the private keys. This means you have
              complete ownership and responsibility for the funds stored at these addresses.
            </p>
            <p>
              Unlike the platform's threshold ECDSA managed addresses, self-custody wallets give you the private key,
              which you must securely backup and protect yourself.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="security">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security Best Practices
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-2">
            <ul className="list-disc list-inside space-y-1">
              <li>Write down your private key on paper and store it in a secure location like a safe</li>
              <li>Never store private keys in cloud services, email, or take photos of them</li>
              <li>Create multiple encrypted backups in different secure locations</li>
              <li>Verify that you can access your backup keys periodically</li>
              <li>Be cautious of phishing attempts - always verify you're on the correct website</li>
              <li>Consider using a hardware wallet for maximum security</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="risks">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Risks and Responsibilities
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-2">
            <p className="font-semibold text-destructive">
              Important: The platform cannot recover lost self-custody wallet keys.
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>If you lose your private key, your Bitcoin is permanently lost</li>
              <li>Anyone with access to your private key can spend your Bitcoin</li>
              <li>Bitcoin transactions are irreversible - there's no "undo" button</li>
              <li>You are solely responsible for the security of your private keys</li>
              <li>There is no customer support to recover lost or stolen funds</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="comparison">
          <AccordionTrigger className="text-left">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Threshold ECDSA vs Self-Custody
            </div>
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground space-y-2">
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-foreground mb-1">Threshold ECDSA (Recommended for most users):</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Keys are distributed across multiple parties - no single point of failure</li>
                  <li>Platform can assist with account recovery through Internet Identity</li>
                  <li>Enhanced security through cryptographic distribution</li>
                  <li>Easier to use for everyday transactions</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Self-Custody (For advanced users):</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>You hold the private keys directly - complete control</li>
                  <li>No platform recovery possible - you're on your own</li>
                  <li>Requires careful key management and backup procedures</li>
                  <li>Best for users who want maximum sovereignty over their funds</li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
