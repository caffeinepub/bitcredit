import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useGetBitcoinPurchases } from '../../hooks/useQueries';
import { Copy, ExternalLink, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import UsdEstimateLine from '../balance/UsdEstimateLine';

export default function BuyBitcoinHistoryTable() {
  const { data: purchases, isLoading } = useGetBitcoinPurchases();

  const handleCopyTxid = (txid: string) => {
    navigator.clipboard.writeText(txid);
    toast.success('Transaction ID copied to clipboard');
  };

  const handleViewOnBlockchain = (txid: string) => {
    window.open(`https://blockstream.info/tx/${txid}`, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!purchases || purchases.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-muted-foreground">
            No purchase history yet. Submit your first Bitcoin purchase above.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by verification time (most recent first)
  const sortedPurchases = [...purchases].sort((a, b) => {
    return Number(b[1].verifiedAt) - Number(a[1].verifiedAt);
  });

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Funded Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPurchases.map(([txid, record]) => {
                const btcAmount = Number(record.amount) / 100_000_000;
                const date = new Date(Number(record.verifiedAt) / 1_000_000);

                return (
                  <TableRow key={txid}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {txid.slice(0, 8)}...{txid.slice(-8)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyTxid(txid)}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-mono font-semibold">
                          ₿ {btcAmount.toFixed(8)}
                        </p>
                        <div className="text-xs">
                          <UsdEstimateLine btcAmount={record.amount} btcPriceUsd={null} />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{date.toLocaleDateString()}</p>
                        <p className="text-muted-foreground text-xs">
                          {date.toLocaleTimeString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-500 hover:bg-green-600 text-white">
                        Verified
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewOnBlockchain(txid)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
