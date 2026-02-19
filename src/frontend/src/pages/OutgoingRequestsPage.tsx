import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGetCallerPeerTransfers } from '../hooks/useQueries';
import { Badge } from '@/components/ui/badge';
import { Copy, Send, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function OutgoingRequestsPage() {
  const { data: transfers, isLoading } = useGetCallerPeerTransfers();

  const outgoingTransfers = transfers?.filter(t => t.status === 'approved') || [];
  const sortedTransfers = [...outgoingTransfers].sort((a, b) => Number(b.createdAt - a.createdAt));

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="default">Approved</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Outgoing Requests</h1>
        <p className="text-muted-foreground">Credits sent to other users</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Sent Transfers</CardTitle>
          </div>
          <CardDescription>All transfers you've sent to other users</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : sortedTransfers.length === 0 ? (
            <div className="text-center py-12">
              <Send className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No outgoing transfers yet</p>
              <Link to="/send-to-peer">
                <Button>
                  <Send className="mr-2 h-4 w-4" />
                  Send to Peer
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTransfers.map((transfer) => (
                <div key={transfer.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(transfer.status)}
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
                      <span className="text-sm text-muted-foreground">To:</span>
                      <code className="text-xs bg-muted px-2 py-1 rounded flex-1 truncate">
                        {transfer.recipient.toString()}
                      </code>
                      <button
                        onClick={() => copyToClipboard(transfer.recipient.toString())}
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
