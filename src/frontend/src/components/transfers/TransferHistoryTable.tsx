import { useState } from 'react';
import { useGetTransactionHistory } from '../../hooks/useQueries';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import TransactionStatusBadge from './TransactionStatusBadge';
import SegwitTransactionDetails from './SegwitTransactionDetails';
import TransactionConfirmationProgress from './TransactionConfirmationProgress';
import type { Transaction } from '../../backend';
import type { MainnetTransaction } from '../../types/mainnet';

interface TransferHistoryTableProps {
  initialRequestId?: bigint | null;
}

export default function TransferHistoryTable({ initialRequestId }: TransferHistoryTableProps) {
  const { data: transactions = [], isLoading } = useGetTransactionHistory();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>;
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No transactions found
      </div>
    );
  }

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'creditPurchase':
        return <Badge variant="default">Credit Purchase</Badge>;
      case 'debit':
        return <Badge variant="destructive">Debit</Badge>;
      case 'adjustment':
        return <Badge variant="outline">Adjustment</Badge>;
      case 'withdrawalRequested':
        return <Badge className="bg-amber-500">Withdrawal Requested</Badge>;
      case 'withdrawalPaid':
        return <Badge className="bg-emerald-600">Withdrawal Paid</Badge>;
      case 'withdrawalRejected':
        return <Badge variant="destructive">Withdrawal Rejected</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleString();
  };

  const toggleRow = (txId: string) => {
    setExpandedRow(expandedRow === txId ? null : txId);
  };

  const hasMainnetDetails = (tx: Transaction): tx is MainnetTransaction => {
    const mtx = tx as MainnetTransaction;
    return !!(
      mtx.signingStatus || mtx.broadcastStatus || mtx.confirmationCount || mtx.txHash || mtx.segwitAddressType
    );
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx: Transaction) => {
            const isMainnet = hasMainnetDetails(tx);
            const mtx = tx as MainnetTransaction;
            
            return (
              <>
                <TableRow key={tx.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    {isMainnet && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRow(tx.id)}
                        className="h-6 w-6 p-0"
                      >
                        {expandedRow === tx.id ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{tx.id}</TableCell>
                  <TableCell>{getTransactionTypeBadge(tx.transactionType)}</TableCell>
                  <TableCell>
                    {isMainnet ? (
                      <TransactionStatusBadge
                        signingStatus={mtx.signingStatus}
                        broadcastStatus={mtx.broadcastStatus}
                        confirmationCount={mtx.confirmationCount}
                      />
                    ) : (
                      <Badge variant="outline">Completed</Badge>
                    )}
                  </TableCell>
                  <TableCell className={
                    tx.transactionType === 'creditPurchase' || tx.transactionType === 'withdrawalRejected'
                      ? 'text-emerald-600 font-semibold'
                      : 'text-red-600 font-semibold'
                  }>
                    {tx.transactionType === 'creditPurchase' || tx.transactionType === 'withdrawalRejected' ? '+' : '-'}
                    {tx.amount.toString()} sats
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatTimestamp(tx.timestamp)}
                  </TableCell>
                </TableRow>
                {expandedRow === tx.id && isMainnet && (
                  <TableRow>
                    <TableCell colSpan={6} className="bg-muted/30 p-4">
                      <div className="space-y-4">
                        {/* Segwit Transaction Details */}
                        {(mtx.segwitAddressType || mtx.txHash) && (
                          <SegwitTransactionDetails
                            destinationAddress="(Address from transaction)"
                            amount={tx.amount}
                            estimatedFee={BigInt(10000)}
                            segwitAddressType={mtx.segwitAddressType}
                            txHash={mtx.txHash}
                          />
                        )}
                        
                        {/* Confirmation Progress */}
                        {(mtx.confirmationCount !== undefined || mtx.txHash) && (
                          <TransactionConfirmationProgress
                            confirmationCount={mtx.confirmationCount}
                            txHash={mtx.txHash}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
