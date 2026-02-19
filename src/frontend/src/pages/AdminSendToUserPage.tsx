import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGetAllUsers, useSendCreditsToPeer } from '../hooks/useQueries';
import { Principal } from '@dfinity/principal';
import { Search, CheckCircle2, AlertCircle } from 'lucide-react';
import UsdEstimateLine from '../components/balance/UsdEstimateLine';

export default function AdminSendToUserPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<{ principal: Principal; name: string } | null>(null);
  const [btcAmount, setBtcAmount] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const { data: users, isLoading } = useGetAllUsers();
  const sendMutation = useSendCreditsToPeer();

  const satoshiAmount = btcAmount && Number(btcAmount) > 0 
    ? BigInt(Math.floor(Number(btcAmount) * 100000000))
    : BigInt(0);

  const filteredUsers = users?.filter(([principal, profile]) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      profile.name.toLowerCase().includes(searchLower) ||
      principal.toString().toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleSelectUser = (principal: Principal, name: string) => {
    setSelectedUser({ principal, name });
    setSearchTerm('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser && satoshiAmount > 0n) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmSend = async () => {
    if (!selectedUser) return;

    try {
      await sendMutation.mutateAsync({
        recipient: selectedUser.principal,
        amount: satoshiAmount,
      });

      // Reset form on success
      setSelectedUser(null);
      setBtcAmount('');
      setShowConfirmDialog(false);
    } catch (error) {
      console.error('Failed to send credits:', error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Send to User</h1>
        <p className="text-muted-foreground">
          Select a user from the system and distribute BTC credits
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Select User</CardTitle>
            <CardDescription>Search and select a user to send credits to</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name or Principal ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {selectedUser && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <strong>Selected:</strong> {selectedUser.name}
                    <br />
                    <span className="text-xs font-mono">{selectedUser.principal.toString()}</span>
                  </AlertDescription>
                </Alert>
              )}

              {searchTerm && (
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-4 text-center text-muted-foreground">Loading users...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">No users found</div>
                  ) : (
                    <div className="divide-y">
                      {filteredUsers.map(([principal, profile]) => (
                        <button
                          key={principal.toString()}
                          onClick={() => handleSelectUser(principal, profile.name)}
                          className="w-full p-3 text-left hover:bg-accent transition-colors"
                        >
                          <div className="font-medium">{profile.name}</div>
                          <div className="text-xs text-muted-foreground font-mono truncate">
                            {principal.toString()}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Send Amount</CardTitle>
            <CardDescription>Enter the BTC amount to send</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="btcAmount">BTC Amount</Label>
                <Input
                  id="btcAmount"
                  type="number"
                  step="0.00000001"
                  min="0"
                  placeholder="0.00000000"
                  value={btcAmount}
                  onChange={(e) => setBtcAmount(e.target.value)}
                  disabled={!selectedUser || sendMutation.isPending}
                />
                {satoshiAmount > 0n && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      = {satoshiAmount.toString()} satoshis
                    </p>
                    <UsdEstimateLine btcAmount={satoshiAmount} btcPriceUsd={null} />
                  </div>
                )}
              </div>

              {sendMutation.isSuccess && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Credits successfully sent!
                  </AlertDescription>
                </Alert>
              )}

              {sendMutation.isError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {sendMutation.error?.message || 'Failed to send credits'}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={!selectedUser || satoshiAmount <= 0n || sendMutation.isPending}
                className="w-full"
              >
                {sendMutation.isPending ? 'Sending...' : 'Send Credits'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Credit Transfer</DialogTitle>
            <DialogDescription>
              Please confirm the details of this credit transfer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium">Recipient</p>
              <p className="text-sm text-muted-foreground">{selectedUser?.name}</p>
              <p className="text-xs font-mono text-muted-foreground">{selectedUser?.principal.toString()}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Amount</p>
              <p className="text-sm text-muted-foreground">{btcAmount} BTC ({satoshiAmount.toString()} satoshis)</p>
              <UsdEstimateLine btcAmount={satoshiAmount} btcPriceUsd={null} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSend} disabled={sendMutation.isPending}>
              {sendMutation.isPending ? 'Sending...' : 'Confirm Send'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
