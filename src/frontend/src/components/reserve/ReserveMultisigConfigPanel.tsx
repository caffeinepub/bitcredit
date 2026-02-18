import { useState, useEffect } from 'react';
import { Copy, Check, Save, Loader2, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGetReserveMultisigConfig, useUpdateReserveMultisigConfig } from '../../hooks/useQueries';

export default function ReserveMultisigConfigPanel() {
  const { data: config, isLoading } = useGetReserveMultisigConfig();
  const { mutate: updateConfig, isPending } = useUpdateReserveMultisigConfig();

  const [threshold, setThreshold] = useState('2');
  const [pubkeysText, setPubkeysText] = useState('');
  const [address, setAddress] = useState('');
  const [redeemScript, setRedeemScript] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (config) {
      setThreshold(config.threshold.toString());
      
      // Convert Uint8Array pubkeys to hex strings
      const pubkeysHex = config.pubkeys.map(pk => 
        Array.from(pk).map(b => b.toString(16).padStart(2, '0')).join('')
      );
      setPubkeysText(pubkeysHex.join('\n'));
      
      setAddress(config.address || '');
      setRedeemScript(config.redeemScript || '');
    }
  }, [config]);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const thresholdNum = BigInt(threshold);
    
    // Parse pubkeys from text (one per line, hex format)
    const pubkeyLines = pubkeysText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const pubkeys = pubkeyLines.map(hex => {
      // Convert hex string to Uint8Array
      const bytes = new Uint8Array(hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
      return bytes;
    });

    updateConfig({
      threshold: thresholdNum,
      pubkeys,
      address: address.trim() || null,
      redeemScript: redeemScript.trim() || null,
    });
  };

  if (isLoading) {
    return (
      <Card className="financial-card">
        <CardHeader>
          <CardTitle>Reserve Multisig Configuration</CardTitle>
          <CardDescription>Stored multisig metadata for monitoring and reference</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading configuration...
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasConfig = config && (config.address || config.pubkeys.length > 0);

  return (
    <Card className="financial-card">
      <CardHeader>
        <CardTitle>Reserve Multisig Configuration</CardTitle>
        <CardDescription>
          Store and view multisig metadata for monitoring and reference
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200 text-sm">
            <strong>Important:</strong> This app does not create or sign multisig transactions. It only stores configuration metadata for monitoring and reference purposes. All multisig creation and signing must be handled externally using your Bitcoin Core node or hardware wallet.
          </AlertDescription>
        </Alert>

        {hasConfig && (
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-sm">Current Configuration</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Threshold:</span>
                <span className="font-mono text-sm font-semibold">{config.threshold.toString()}</span>
              </div>

              {config.address && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reserve Address:</span>
                    <Button
                      onClick={() => handleCopy(config.address!, 'address')}
                      variant="ghost"
                      size="sm"
                    >
                      {copiedField === 'address' ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <code className="block text-xs bg-background p-2 rounded border break-all">
                    {config.address}
                  </code>
                </div>
              )}

              {config.pubkeys.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Public Keys ({config.pubkeys.length}):</span>
                    <Button
                      onClick={() => {
                        const pubkeysHex = config.pubkeys.map(pk => 
                          Array.from(pk).map(b => b.toString(16).padStart(2, '0')).join('')
                        ).join('\n');
                        handleCopy(pubkeysHex, 'pubkeys');
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      {copiedField === 'pubkeys' ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="text-xs bg-background p-2 rounded border space-y-1 max-h-32 overflow-y-auto">
                    {config.pubkeys.map((pk, idx) => (
                      <code key={idx} className="block break-all">
                        {Array.from(pk).map(b => b.toString(16).padStart(2, '0')).join('')}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {config.redeemScript && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Redeem Script:</span>
                    <Button
                      onClick={() => handleCopy(config.redeemScript!, 'redeemScript')}
                      variant="ghost"
                      size="sm"
                    >
                      {copiedField === 'redeemScript' ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <code className="block text-xs bg-background p-2 rounded border break-all max-h-20 overflow-y-auto">
                    {config.redeemScript}
                  </code>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t">
          <h3 className="font-semibold text-sm">
            {hasConfig ? 'Update Configuration' : 'Set Configuration'}
          </h3>

          <div className="space-y-2">
            <Label htmlFor="threshold">Threshold (M-of-N)</Label>
            <Input
              id="threshold"
              type="number"
              min="1"
              placeholder="e.g., 2"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Number of signatures required to spend (e.g., 2 for 2-of-3 multisig)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pubkeys">Public Keys (hex, one per line)</Label>
            <Textarea
              id="pubkeys"
              placeholder="03a1b2c3...&#10;02d4e5f6...&#10;03c7d8e9..."
              value={pubkeysText}
              onChange={(e) => setPubkeysText(e.target.value)}
              disabled={isPending}
              rows={4}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Enter public keys in hex format, one per line
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Reserve Address (optional)</Label>
            <Input
              id="address"
              type="text"
              placeholder="bc1q..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isPending}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              The multisig address generated by Bitcoin Core
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="redeemScript">Redeem Script (optional)</Label>
            <Textarea
              id="redeemScript"
              placeholder="522103a1b2c3..."
              value={redeemScript}
              onChange={(e) => setRedeemScript(e.target.value)}
              disabled={isPending}
              rows={3}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              The redeem script generated by Bitcoin Core
            </p>
          </div>

          <Button
            type="submit"
            disabled={isPending || !threshold || Number(threshold) < 1}
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {hasConfig ? 'Update Configuration' : 'Save Configuration'}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
