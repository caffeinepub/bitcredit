import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Info } from 'lucide-react';
import { toast } from 'sonner';

interface PublicKeyDisplayProps {
  publicKey: Uint8Array;
}

export default function PublicKeyDisplay({ publicKey }: PublicKeyDisplayProps) {
  const publicKeyHex = Array.from(publicKey)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const publicKeyBase64 = btoa(String.fromCharCode(...publicKey));

  const copyToClipboard = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Public key (${format}) copied to clipboard`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Public Key
        </CardTitle>
        <CardDescription>
          Your Bitcoin public key used for address derivation and verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            The public key is safe to share. It's used to derive your Bitcoin addresses and verify signatures.
            It cannot be used to spend your Bitcoin.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Hexadecimal Format</label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(publicKeyHex, 'hex')}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <div className="bg-muted p-3 rounded-md">
              <p className="font-mono text-xs break-all">{publicKeyHex}</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Base64 Format</label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(publicKeyBase64, 'base64')}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
            </div>
            <div className="bg-muted p-3 rounded-md">
              <p className="font-mono text-xs break-all">{publicKeyBase64}</p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            <p><strong>Length:</strong> {publicKey.length} bytes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
