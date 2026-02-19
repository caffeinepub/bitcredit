import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ReserveMultisigConfigPanel() {
  const [threshold, setThreshold] = useState('');
  const [pubkeysText, setPubkeysText] = useState('');
  const [address, setAddress] = useState('');
  const [redeemScript, setRedeemScript] = useState('');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatPubkey = (pk: Uint8Array): string => {
    return Array.from(pk).map((b: number) => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSave = () => {
    toast.info('Backend multisig configuration not yet implemented');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reserve Multisig Configuration</CardTitle>
        <CardDescription>
          View and update the stored multisig configuration for reserve monitoring
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>Backend Implementation Note:</strong> Multisig configuration storage is not yet implemented in the backend.
            This interface will be functional once the backend implements the reserve management features.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="threshold">Threshold (M of N)</Label>
          <Input
            id="threshold"
            type="number"
            min="1"
            placeholder="e.g., 2"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pubkeys">Public Keys (one per line, hex format)</Label>
          <textarea
            id="pubkeys"
            className="w-full min-h-[120px] p-2 border rounded-md font-mono text-xs"
            placeholder="Enter public keys in hex format, one per line"
            value={pubkeysText}
            onChange={(e) => setPubkeysText(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Multisig Address (optional)</Label>
          <div className="flex gap-2">
            <Input
              id="address"
              type="text"
              placeholder="Bitcoin multisig address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
            {address && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(address, 'Address')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="redeemScript">Redeem Script (optional, hex format)</Label>
          <div className="flex gap-2">
            <Input
              id="redeemScript"
              type="text"
              placeholder="Hex-encoded redeem script"
              value={redeemScript}
              onChange={(e) => setRedeemScript(e.target.value)}
              className="font-mono text-xs"
            />
            {redeemScript && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(redeemScript, 'Redeem Script')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <Button onClick={handleSave} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Save Configuration
        </Button>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> This configuration is stored for monitoring and reference purposes only.
            The app does not create multisig addresses or manage private keys. All multisig setup must be done externally.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
