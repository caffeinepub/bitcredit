import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetCallerPeerTransfers } from '../hooks/useQueries';
import { Badge } from '@/components/ui/badge';
import { Copy, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function IncomingRequestsPage() {
  const { data: transfers, isLoading } = useGetCallerPeerTransfers();

  const incomingTransfers = transfers?.filter(t => t.status === 'approved') || [];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Incoming Requests</h1>
        <p className="text-muted-foreground">Credits received from other users</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Received Transfers</CardTitle>
          </div>
          <CardDescription>All approved transfers sent to you</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : incomingTransfers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No incoming transfers yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incomingTransfers.map((transfer) => (
                <div key={transfer.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="default">Approved</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(Number(transfer.createdAt) / 1_000_000).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-2xl font-bold">
                        ₿ {(Number(transfer.amount) / 100_000_000).toFixed(8)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">From:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                        {transfer.sender.toString()}
                      </code>
                      <button
                        onClick={() => copyToClipboard(transfer.sender.toString())}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
