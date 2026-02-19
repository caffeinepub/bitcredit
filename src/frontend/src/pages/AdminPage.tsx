import { Link } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGetAllWithdrawalRequests, useGetTransactionHistory, useAdminVerificationRequests, useGetAllPeerTransfers } from '../hooks/useQueries';
import { AlertCircle, FileText, Wallet, CheckCircle, ClipboardCheck, Coins, UserPlus, ArrowLeftRight } from 'lucide-react';
import AdminReserveStatusMonitor from '../components/reserve/AdminReserveStatusMonitor';
import { WithdrawalStatus, VerificationStatus } from '../backend';

export default function AdminPage() {
  const { data: withdrawalRequests, isLoading: withdrawalsLoading } = useGetAllWithdrawalRequests();
  const { data: transactions, isLoading: transactionsLoading } = useGetTransactionHistory();
  const { data: verificationRequests, isLoading: verificationsLoading } = useAdminVerificationRequests();
  const { data: peerTransfers, isLoading: peerTransfersLoading } = useGetAllPeerTransfers();

  const pendingWithdrawals = withdrawalRequests?.filter(r => r.status === WithdrawalStatus.PENDING) || [];
  const recentTransactions = transactions?.slice(0, 10) || [];
  const pendingVerifications = verificationRequests?.filter(([_, req]) => req.status === VerificationStatus.pending) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and management tools</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <CardTitle>Pending Withdrawals</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {withdrawalsLoading ? (
              <div className="h-12 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-4xl font-bold">{pendingWithdrawals.length}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">Requests awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <CardTitle>Recent Transactions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="h-12 w-24 bg-muted animate-pulse rounded" />
            ) : (
              <p className="text-4xl font-bold">{transactions?.length || 0}</p>
            )}
            <p className="text-sm text-muted-foreground mt-2">Total system transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-green-500" />
              <CardTitle>Reserve Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">See details below</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link to="/admin/withdrawals">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle>Withdrawal Management</CardTitle>
              <CardDescription>Review and process withdrawal requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Manage Withdrawals
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/peer-transfers">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle>Peer-to-Peer Transfers</CardTitle>
              <CardDescription>Monitor peer-to-peer credit transfers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full" variant="outline">
                  <ArrowLeftRight className="mr-2 h-4 w-4" />
                  View All Transfers
                </Button>
                {!peerTransfersLoading && peerTransfers && (
                  <p className="text-sm text-muted-foreground text-center">
                    {peerTransfers.length} total transfer{peerTransfers.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/credentials">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle>Admin Credentials</CardTitle>
              <CardDescription>View your admin status and capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                View Credentials
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/manual-verification">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle>Manual Bitcoin Verification</CardTitle>
              <CardDescription>Record verified Bitcoin purchases manually</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                <CheckCircle className="mr-2 h-4 w-4" />
                Verify BTC Purchases
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/verification-requests">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle>User Verification Requests</CardTitle>
              <CardDescription>Review user-submitted Bitcoin transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Button className="w-full" variant="outline">
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  Review Requests
                </Button>
              </div>
              {!verificationsLoading && pendingVerifications.length > 0 && (
                <p className="text-sm text-yellow-600 font-medium mt-2">
                  {pendingVerifications.length} pending request{pendingVerifications.length !== 1 ? 's' : ''}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/send-credits">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle>Send Credits to Users</CardTitle>
              <CardDescription>Credit BTC directly to user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                <Coins className="mr-2 h-4 w-4" />
                Send Credits
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/send-to-user">
          <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle>Send to User</CardTitle>
              <CardDescription>Select a user and distribute BTC credits</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                <UserPlus className="mr-2 h-4 w-4" />
                Send to User
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      <AdminReserveStatusMonitor />

      <Card>
        <CardHeader>
          <CardTitle>Recent System Transactions</CardTitle>
          <CardDescription>Latest 10 transactions across all users</CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : recentTransactions.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {tx.transactionType.toString().replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(Number(tx.timestamp) / 1000000).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono">
                      {(Number(tx.amount) / 100000000).toFixed(8)} BTC
                    </p>
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
