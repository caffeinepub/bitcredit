import { useState, useEffect } from 'react';
import type { Transaction } from '../../backend';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, Info } from 'lucide-react';
import VerifyTransferDialog from './VerifyTransferDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TransferHistoryTableProps {
  transactions: Transaction[];
  initialRequestId?: bigint | null;
}

export default function TransferHistoryTable({ transactions, initialRequestId }: TransferHistoryTableProps) {
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<bigint | null>(null);

  useEffect(() => {
    // Auto-open dialog if initialRequestId is provided
    if (initialRequestId !== undefined && initialRequestId !== null) {
      setSelectedRequestId(initialRequestId);
      setVerifyDialogOpen(true);
    }
  }, [initialRequestId]);

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'creditPurchase':
        return 'Credit Purchase';
      case 'debit':
        return 'Bitcoin Mainnet Transfer';
      case 'adjustment':
        return 'Adjustment';
      default:
        return type;
    }
  };

  const getTypeVariant = (type: string): 'default' | 'secondary' | 'outline' => {
    switch (type) {
      case 'creditPurchase':
        return 'default';
      case 'debit':
        return 'secondary';
      case 'adjustment':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const handleDetailsClick = (requestId: string) => {
    try {
      setSelectedRequestId(BigInt(requestId));
      setVerifyDialogOpen(true);
    } catch (error) {
      console.error('Invalid request ID:', error);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
        <p className="text-muted-foreground text-sm">
          Your transaction history will appear here once you purchase credits or create transfers
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={`${tx.id}-${tx.timestamp}`}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={getTypeVariant(tx.transactionType)}>
                      {getTransactionTypeLabel(tx.transactionType)}
                    </Badge>
                    {tx.transactionType === 'debit' && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p className="text-xs">
                              On-chain Bitcoin mainnet transfer. Click Details to view status, txid, and troubleshoot if the transaction did not appear on mainnet.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatTimestamp(tx.timestamp)}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground max-w-[200px] truncate">
                  {tx.id}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <img
                      src="/assets/generated/credit-coin-icon.dim_128x128.png"
                      alt="Credit"
                      className="h-4 w-4"
                    />
                    <span
                      className={`font-semibold ${
                        tx.transactionType === 'creditPurchase' || tx.transactionType === 'adjustment'
                          ? 'text-chart-1'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {tx.transactionType === 'creditPurchase' || tx.transactionType === 'adjustment'
                        ? '+'
                        : '-'}
                      {tx.amount.toString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {tx.transactionType === 'debit' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDetailsClick(tx.id)}
                      className="gap-1"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      View Details
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedRequestId !== null && (
        <VerifyTransferDialog
          open={verifyDialogOpen}
          onOpenChange={setVerifyDialogOpen}
          requestId={selectedRequestId}
        />
      )}
    </>
  );
}
