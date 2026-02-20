import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

interface PrivateKeyRevealConfirmationProps {
  onReveal: () => void;
}

export default function PrivateKeyRevealConfirmation({ onReveal }: PrivateKeyRevealConfirmationProps) {
  const [acknowledgments, setAcknowledgments] = useState({
    understand: false,
    secure: false,
    irreversible: false,
    responsibility: false,
  });

  const allAcknowledged = Object.values(acknowledgments).every(v => v);

  const handleCheckboxChange = (key: keyof typeof acknowledgments) => {
    setAcknowledgments(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription>
          Before viewing information about threshold ECDSA security, please acknowledge the following:
        </AlertDescription>
      </Alert>

      <div className="space-y-3 border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="understand"
            checked={acknowledgments.understand}
            onCheckedChange={() => handleCheckboxChange('understand')}
          />
          <Label htmlFor="understand" className="text-sm cursor-pointer leading-relaxed">
            I understand that private keys enable full control and spending of Bitcoin, and that anyone with
            access to a private key can control those funds
          </Label>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="secure"
            checked={acknowledgments.secure}
            onCheckedChange={() => handleCheckboxChange('secure')}
          />
          <Label htmlFor="secure" className="text-sm cursor-pointer leading-relaxed">
            I understand that traditional private keys should be stored securely offline and never shared with anyone
          </Label>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="irreversible"
            checked={acknowledgments.irreversible}
            onCheckedChange={() => handleCheckboxChange('irreversible')}
          />
          <Label htmlFor="irreversible" className="text-sm cursor-pointer leading-relaxed">
            I understand that Bitcoin transactions are irreversible and lost keys cannot be recovered
          </Label>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="responsibility"
            checked={acknowledgments.responsibility}
            onCheckedChange={() => handleCheckboxChange('responsibility')}
          />
          <Label htmlFor="responsibility" className="text-sm cursor-pointer leading-relaxed">
            I understand that this application uses threshold ECDSA, which provides enhanced security by
            never exposing private keys in exportable form
          </Label>
        </div>
      </div>

      <Button
        onClick={onReveal}
        disabled={!allAcknowledged}
        variant="destructive"
        className="w-full"
      >
        I Acknowledge - View Security Information
      </Button>
    </div>
  );
}
