import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Info } from 'lucide-react';
import { useState } from 'react';

interface CustodialWarningModalProps {
  open: boolean;
  onAcknowledge: () => void;
}

export default function CustodialWarningModal({ open, onAcknowledge }: CustodialWarningModalProps) {
  const [hasReadEducation, setHasReadEducation] = useState(false);
  const [understandsThreshold, setUnderstandsThreshold] = useState(false);

  const canProceed = hasReadEducation && understandsThreshold;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShieldAlert className="h-6 w-6 text-amber-600" />
            Important: Wallet Security Information
          </DialogTitle>
          <DialogDescription>
            Please read and understand the following information about how your Bitcoin wallet works
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Threshold ECDSA Architecture</AlertTitle>
            <AlertDescription>
              This application uses the Internet Computer's threshold ECDSA protocol for Bitcoin signing.
              This is a fundamentally different approach from traditional wallet software.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">What This Means:</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <span className="font-semibold min-w-[120px]">Private Keys:</span>
                <span>Never stored in plaintext or exposed to users. Distributed across IC subnet nodes.</span>
              </div>
              
              <div className="flex gap-2">
                <span className="font-semibold min-w-[120px]">Signing:</span>
                <span>Performed through secure multi-party computation without exposing key material.</span>
              </div>
              
              <div className="flex gap-2">
                <span className="font-semibold min-w-[120px]">Security:</span>
                <span>Enhanced protection against theft, loss, and single points of failure.</span>
              </div>
              
              <div className="flex gap-2">
                <span className="font-semibold min-w-[120px]">Control:</span>
                <span>You maintain full control through your Internet Identity authentication.</span>
              </div>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Your Responsibility</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1 mt-2">
                <li>Secure your Internet Identity credentials</li>
                <li>Verify transaction details before signing</li>
                <li>Understand that Bitcoin transactions are irreversible</li>
                <li>Keep your recovery phrases for Internet Identity safe</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="space-y-3 border rounded-lg p-4 bg-muted/50">
            <div className="flex items-start gap-3">
              <Checkbox
                id="education"
                checked={hasReadEducation}
                onCheckedChange={(checked) => setHasReadEducation(checked as boolean)}
              />
              <Label htmlFor="education" className="text-sm cursor-pointer leading-relaxed">
                I have read and understand how threshold ECDSA works and that private keys are not
                directly accessible in this system
              </Label>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="threshold"
                checked={understandsThreshold}
                onCheckedChange={(checked) => setUnderstandsThreshold(checked as boolean)}
              />
              <Label htmlFor="threshold" className="text-sm cursor-pointer leading-relaxed">
                I understand that this provides enhanced security compared to traditional private key
                storage and I maintain control through my Internet Identity
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onAcknowledge} disabled={!canProceed} className="w-full">
            I Understand - Continue to Wallet Keys
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
