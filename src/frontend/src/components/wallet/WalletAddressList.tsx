import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import type { BitcoinAddress } from '../../backend';

interface WalletAddressListProps {
  addresses: BitcoinAddress[];
  primaryAddress: BitcoinAddress | null;
  isLoading: boolean;
}

export default function WalletAddressList({ addresses, primaryAddress, isLoading }: WalletAddressListProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const getExplorerUrl = (address: string, network: string) => {
    const baseUrl = network === 'mainnet' 
      ? 'https://blockchair.com/bitcoin/address/'
      : 'https://blockchair.com/bitcoin/testnet/address/';
    return `${baseUrl}${address}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bitcoin Addresses</CardTitle>
          <CardDescription>Loading your addresses...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (addresses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bitcoin Addresses</CardTitle>
          <CardDescription>No addresses found</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You don't have any Bitcoin addresses yet. Addresses are created automatically when you use the application.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Bitcoin Addresses
        </CardTitle>
        <CardDescription>
          All Bitcoin addresses associated with your wallet
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {addresses.map((addr, index) => {
            const isPrimary = primaryAddress?.address === addr.address;
            const networkLabel = addr.network === 'mainnet' ? 'Mainnet' : 'Testnet';
            const createdDate = new Date(Number(addr.createdAt) / 1_000_000).toLocaleDateString();

            return (
              <div
                key={addr.address}
                className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={isPrimary ? 'default' : 'secondary'}>
                        {isPrimary ? 'Primary' : `Address ${index + 1}`}
                      </Badge>
                      <Badge variant="outline">{addr.addressType}</Badge>
                      <Badge variant="outline">{networkLabel}</Badge>
                    </div>
                    <p className="font-mono text-sm break-all mb-1">{addr.address}</p>
                    <p className="text-xs text-muted-foreground">Created: {createdDate}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(addr.address, 'Address')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <a
                        href={getExplorerUrl(addr.address, addr.network)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
