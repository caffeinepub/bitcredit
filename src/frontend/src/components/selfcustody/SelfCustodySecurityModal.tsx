import { useState } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield } from 'lucide-react';
import ThresholdEcdsaVsSelfCustodyComparison from './ThresholdEcdsaVsSelfCustodyComparison';
import { SELF_CUSTODY_EDUCATION } from '../../utils/walletEducation';

interface SelfCustodySecurityModalProps {
  open: boolean;
  onAcknowledge: () => void;
}

export default function SelfCustodySecurityModal({ open, onAcknowledge }: SelfCustodySecurityModalProps) {
  const [acknowledgments, setAcknowledgments] = useState({
    security: false,
    backup: false,
    recovery: false,
    funds: false,
  });

  const allAcknowledged = Object.values(acknowledgments).every(Boolean);

  const handleAcknowledge = () => {
    if (allAcknowledged) {
      onAcknowledge();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Shield className="h-6 w-6 text-amber-600" />
            Self-Custody Wallet Security Notice
          </DialogTitle>
          <DialogDescription>
            Please read and acknowledge the following important information before using self-custody wallets.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="font-semibold">
              {SELF_CUSTODY_EDUCATION.CRITICAL_WARNING}
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">What is Self-Custody?</h3>
            <p className="text-sm text-muted-foreground">
              {SELF_CUSTODY_EDUCATION.WHAT_IS_SELF_CUSTODY}
            </p>
          </div>

          <ThresholdEcdsaVsSelfCustodyComparison />

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Your Responsibilities</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-destructive">•</span>
                <span>{SELF_CUSTODY_EDUCATION.RESPONSIBILITY_BACKUP}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-destructive">•</span>
                <span>{SELF_CUSTODY_EDUCATION.RESPONSIBILITY_SECURITY}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-destructive">•</span>
                <span>{SELF_CUSTODY_EDUCATION.RESPONSIBILITY_NO_RECOVERY}</span>
              </li>
              <li className="flex gap-2">
                <span className="text-destructive">•</span>
                <span>{SELF_CUSTODY_EDUCATION.RESPONSIBILITY_VERIFICATION}</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Required Acknowledgments</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="ack-security"
                  checked={acknowledgments.security}
                  onCheckedChange={(checked) =>
                    setAcknowledgments((prev) => ({ ...prev, security: checked === true }))
                  }
                />
                <Label htmlFor="ack-security" className="text-sm cursor-pointer leading-relaxed">
                  {SELF_CUSTODY_EDUCATION.ACK_SECURITY}
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="ack-backup"
                  checked={acknowledgments.backup}
                  onCheckedChange={(checked) =>
                    setAcknowledgments((prev) => ({ ...prev, backup: checked === true }))
                  }
                />
                <Label htmlFor="ack-backup" className="text-sm cursor-pointer leading-relaxed">
                  {SELF_CUSTODY_EDUCATION.ACK_BACKUP}
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="ack-recovery"
                  checked={acknowledgments.recovery}
                  onCheckedChange={(checked) =>
                    setAcknowledgments((prev) => ({ ...prev, recovery: checked === true }))
                  }
                />
                <Label htmlFor="ack-recovery" className="text-sm cursor-pointer leading-relaxed">
                  {SELF_CUSTODY_EDUCATION.ACK_RECOVERY}
                </Label>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="ack-funds"
                  checked={acknowledgments.funds}
                  onCheckedChange={(checked) =>
                    setAcknowledgments((prev) => ({ ...prev, funds: checked === true }))
                  }
                />
                <Label htmlFor="ack-funds" className="text-sm cursor-pointer leading-relaxed">
                  {SELF_CUSTODY_EDUCATION.ACK_FUNDS}
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleAcknowledge} disabled={!allAcknowledged} className="w-full">
            I Understand and Accept the Risks
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
