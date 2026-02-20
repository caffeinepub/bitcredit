import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, ShieldCheck, Lock, Key } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function KeyExportInstructions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Understanding Threshold ECDSA Security
        </CardTitle>
        <CardDescription>
          How your Bitcoin is secured without traditional private key storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="what-is-threshold">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                What is Threshold ECDSA?
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              <p>
                Threshold ECDSA is an advanced cryptographic protocol where a private key exists only as
                secret shares distributed across multiple independent nodes (in this case, IC subnet replicas).
              </p>
              <p>
                When you need to sign a Bitcoin transaction:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Your request is authenticated via Internet Identity</li>
                <li>Multiple IC nodes participate in a distributed signing protocol</li>
                <li>Each node uses its secret share to contribute to the signature</li>
                <li>The final signature is mathematically valid, as if signed by a single private key</li>
                <li>The private key is never reconstructed at any point</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="why-more-secure">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Why is this MORE secure than traditional wallets?
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              <p className="font-semibold">
                Traditional wallet vulnerabilities:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Single point of failure: if your private key is stolen, all funds are lost</li>
                <li>Phishing attacks can trick users into revealing their seed phrases</li>
                <li>Malware can steal private keys from devices</li>
                <li>Physical theft of hardware wallets or paper wallets</li>
                <li>Lost keys mean permanently lost funds</li>
              </ul>
              <p className="font-semibold mt-3">
                Threshold ECDSA advantages:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>No single point of failure: private key never exists in one place</li>
                <li>Byzantine fault tolerance: system remains secure even if some nodes are compromised</li>
                <li>No phishing risk: there's no seed phrase to steal</li>
                <li>No malware risk: there's no private key on your device to steal</li>
                <li>Recovery through Internet Identity, not vulnerable seed phrases</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="what-you-control">
            <AccordionTrigger className="text-left">
              <div className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                What do I actually control?
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              <p>
                You have complete control over your Bitcoin through your Internet Identity:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Your Bitcoin address:</strong> Publicly visible, uniquely yours, derived from your identity</li>
                <li><strong>Transaction authorization:</strong> Only you can sign transactions via Internet Identity</li>
                <li><strong>Fund access:</strong> Send Bitcoin to any address at any time</li>
                <li><strong>No third-party control:</strong> No company or individual can freeze or access your funds</li>
              </ul>
              <p className="mt-3">
                The key difference: Instead of protecting a vulnerable private key file, you're protected by
                distributed cryptography across a decentralized network of nodes.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="migration">
            <AccordionTrigger className="text-left">
              Can I export my Bitcoin to another wallet?
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              <p>
                <strong>Yes!</strong> You can always send your Bitcoin to any other wallet address:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Use the "Send BTC" feature to transfer to any Bitcoin address</li>
                <li>Send to a hardware wallet (Ledger, Trezor, etc.)</li>
                <li>Send to a software wallet (Electrum, BlueWallet, etc.)</li>
                <li>Send to an exchange address</li>
              </ul>
              <p className="mt-3">
                What you <strong>cannot</strong> do is export the private key itself, because it doesn't exist
                in exportable form. But you don't need to - you can always move your Bitcoin via standard
                Bitcoin transactions.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="trust">
            <AccordionTrigger className="text-left">
              Do I have to trust the Internet Computer?
            </AccordionTrigger>
            <AccordionContent className="space-y-2 text-sm">
              <p>
                The Internet Computer is a <strong>decentralized network</strong>, not a company or single entity:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Threshold ECDSA subnets consist of 13+ independent node providers</li>
                <li>Nodes are distributed globally across different data centers</li>
                <li>Byzantine fault tolerance: up to 1/3 of nodes can fail or be malicious</li>
                <li>All code is open source and verifiable</li>
                <li>Cryptographic proofs ensure correct execution</li>
              </ul>
              <p className="mt-3">
                This is fundamentally different from trusting a centralized exchange or custodial wallet service.
                The security comes from mathematics and decentralization, not trust in a company.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800 dark:text-blue-200">
            Learn More
          </AlertTitle>
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <p className="mb-2">
              For technical details about threshold ECDSA on the Internet Computer:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <a
                  href="https://internetcomputer.org/docs/current/references/t-ecdsa-how-it-works"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-600"
                >
                  Threshold ECDSA Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://eprint.iacr.org/2021/1330"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-600"
                >
                  Research Paper: Threshold ECDSA Protocol
                </a>
              </li>
              <li>
                <a
                  href="https://wiki.internetcomputer.org/wiki/Chain_key_cryptography"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-600"
                >
                  Chain-Key Cryptography Overview
                </a>
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
