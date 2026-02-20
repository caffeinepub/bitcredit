import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useGetCallerAddressHistory, useGetCallerPrimaryAddress } from '../../hooks/useQueries';
import { toast } from 'sonner';
import type { BitcoinAddress } from '../../backend';

export default function AddressHistoryView() {
  const { data: addressHistory = [], isLoading } = useGetCallerAddressHistory();
  const { data: primaryAddress } = useGetCallerPrimaryAddress();

  const handleCopyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address);
    toast.success('Address copied to clipboard');
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isActiveAddress = (address: BitcoinAddress) => {
    return primaryAddress?.address === address.address;
  };

  const getStatusBadge = (address: BitcoinAddress) => {
    if (isActiveAddress(address)) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600 text-white gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </Badge>
      );
    }
    return <Badge variant="secondary">Used</Badge>;
  };

  const openBlockchainExplorer = (address: string) => {
    window.open(`https://blockchair.com/bitcoin/address/${address}`, '_blank');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Address History</CardTitle>
          <CardDescription>Loading your address history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (addressHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Address History</CardTitle>
          <CardDescription>Your Bitcoin address history</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No addresses generated yet. Generate your first address above.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort addresses by creation date (newest first)
  const sortedAddresses = [...addressHistory].sort((a, b) => 
    Number(b.createdAt - a.createdAt)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Address History</CardTitle>
        <CardDescription>
          All your Bitcoin addresses ({addressHistory.length} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedAddresses.map((address, index) => (
            <div
              key={address.address}
              className={`border rounded-lg p-4 space-y-3 transition-colors ${
                isActiveAddress(address)
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                  : 'border-border hover:border-muted-foreground/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusBadge(address)}
                    <Badge variant="outline" className="text-xs">
                      {address.addressType}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {address.network}
                    </Badge>
                  </div>
                  <div className="font-mono text-sm break-all text-foreground">
                    {address.address}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Created: {formatDate(address.createdAt)}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyAddress(address.address)}
                  className="gap-2"
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openBlockchainExplorer(address.address)}
                  className="gap-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  View on Explorer
                </Button>
              </div>

              {isActiveAddress(address) && (
                <div className="text-xs text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 p-2 rounded">
                  This is your current active receiving address
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
