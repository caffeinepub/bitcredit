import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, RefreshCw, QrCode, CheckCircle2, AlertCircle } from 'lucide-react';
import { useGetCallerBitcoinAddress, useCreateBitcoinAddress } from '../../hooks/useQueries';
import { Variant_P2WPKH, Variant_mainnet_testnet } from '../../backend';
import { toast } from 'sonner';

export default function BitcoinAddressDisplay() {
  const { data: bitcoinAddress, isLoading } = useGetCallerBitcoinAddress();
  const createAddress = useCreateBitcoinAddress();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  const handleCopyAddress = async () => {
    if (bitcoinAddress?.address) {
      await navigator.clipboard.writeText(bitcoinAddress.address);
      toast.success('Address copied to clipboard');
    }
  };

  const generateQRCode = (text: string): string => {
    const canvas = document.createElement('canvas');
    const size = 256;
    const margin = 16;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';

    // Simple QR code placeholder - just display the address as text in a box
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(margin, margin, size - margin * 2, size - margin * 2);
    
    // Draw text
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const words = text.match(/.{1,12}/g) || [];
    const lineHeight = 14;
    const startY = size / 2 - (words.length * lineHeight) / 2;
    
    words.forEach((word, i) => {
      ctx.fillText(word, size / 2, startY + i * lineHeight);
    });

    return canvas.toDataURL();
  };

  const handleGenerateQR = () => {
    if (bitcoinAddress?.address && !qrCodeUrl) {
      try {
        const url = generateQRCode(bitcoinAddress.address);
        setQrCodeUrl(url);
        setShowQR(true);
      } catch (error) {
        console.error('Failed to generate QR code:', error);
        toast.error('Failed to generate QR code');
      }
    } else {
      setShowQR(!showQR);
    }
  };

  const handleGenerateAddress = () => {
    createAddress.mutate({
      addressType: Variant_P2WPKH.P2WPKH,
      network: Variant_mainnet_testnet.mainnet
    });
  };

  // Reset QR code when wallet address changes
  useEffect(() => {
    setQrCodeUrl(null);
    setShowQR(false);
  }, [bitcoinAddress?.address]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Receive Bitcoin</CardTitle>
          <CardDescription>Loading your Bitcoin address...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Receive Bitcoin
          {bitcoinAddress?.address && (
            <Badge variant="outline" className="text-xs">
              Segwit (P2WPKH)
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {bitcoinAddress?.address 
            ? 'Your Bitcoin mainnet receiving address' 
            : 'Generate a Bitcoin address to receive funds'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {bitcoinAddress?.address ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Address</span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAddress}
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateQR}
                    className="gap-2"
                  >
                    <QrCode className="h-4 w-4" />
                    {showQR ? 'Hide' : 'Show'} QR
                  </Button>
                </div>
              </div>
              <div className="bg-muted p-3 rounded-lg font-mono text-sm break-all">
                {bitcoinAddress.address}
              </div>
            </div>

            {showQR && qrCodeUrl && (
              <div className="flex flex-col items-center gap-3 py-4">
                <img 
                  src={qrCodeUrl} 
                  alt="Bitcoin Address QR Code" 
                  className="border-4 border-white rounded-lg shadow-lg"
                />
                <p className="text-xs text-muted-foreground text-center">
                  Scan this QR code with a Bitcoin wallet to send funds
                </p>
              </div>
            )}

            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                This is a mainnet Segwit address. Send only Bitcoin (BTC) to this address.
                Sending other cryptocurrencies may result in permanent loss of funds.
              </AlertDescription>
            </Alert>

            <Button
              variant="outline"
              onClick={handleGenerateAddress}
              disabled={createAddress.isPending}
              className="w-full gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${createAddress.isPending ? 'animate-spin' : ''}`} />
              Generate New Address
            </Button>
          </>
        ) : (
          <>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You don't have a Bitcoin address yet. Generate one to start receiving Bitcoin.
              </AlertDescription>
            </Alert>

            <Button
              onClick={handleGenerateAddress}
              disabled={createAddress.isPending}
              className="w-full gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${createAddress.isPending ? 'animate-spin' : ''}`} />
              {createAddress.isPending ? 'Generating...' : 'Generate Bitcoin Address'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
