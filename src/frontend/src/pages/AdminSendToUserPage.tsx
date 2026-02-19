import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGetAllUsers, useSendCreditsToPeer } from '../hooks/useQueries';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';
import { Search, Copy, Check, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import UsdEstimateLine from '../components/balance/UsdEstimateLine';
import type { UserProfile } from '../backend';

export default function AdminSendToUserPage() {
  const { data: allUsers, isLoading: usersLoading } = useGetAllUsers();
  const sendCreditsMutation = useSendCreditsToPeer();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<{ principal: Principal; profile: UserProfile } | null>(null);
  const [btcAmount, setBtcAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [copiedPrincipal, setCopiedPrincipal] = useState<string | null>(null);

  const filteredUsers = allUsers?.filter(([principal, profile]) => {
    const query = searchQuery.toLowerCase();
    const principalStr = principal.toString().toLowerCase();
    const name = profile.name.toLowerCase();
    return principalStr.includes(query) || name.includes(query);
  }) || [];

  const handleUserSelect = (principal: Principal, profile: UserProfile) => {
    setSelectedUser({ principal, profile });
    setBtcAmount('');
    setAmountError('');
  };

  const handleAmountChange = (value: string) => {
    setBtcAmount(value);
    setAmountError('');

    if (value && isNaN(Number(value))) {
      setAmountError('Please enter a valid number');
      return;
    }

    if (value && Number(value) <= 0) {
      setAmountError('Amount must be greater than 0');
      return;
    }

    if (value && value.includes('.')) {
      const decimals = value.split('.')[1];
      if (decimals && decimals.length > 8) {
        setAmountError('Maximum 8 decimal places allowed');
        return;
      }
    }
  };

  const handleSendClick = () => {
    if (!selectedUser || !btcAmount || amountError) return;
    setShowConfirmDialog(true);
  };

  const handleConfirmSend = async () => {
    if (!selectedUser || !btcAmount) return;

    const satoshis = BigInt(Math.floor(Number(btcAmount) * 100000000));

    try {
      await sendCreditsMutation.mutateAsync({
        recipient: selectedUser.principal,
        amount: satoshis,
      });

      toast.success(`Successfully sent ${btcAmount} BTC to ${selectedUser.profile.name}`);
      setSelectedUser(null);
      setBtcAmount('');
      setShowConfirmDialog(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send credits');
      setShowConfirmDialog(false);
    }
  };

  const copyToClipboard = async (text: string, principal: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPrincipal(principal);
      setTimeout(() => setCopiedPrincipal(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const btcAmountBigInt = btcAmount && !isNaN(parseFloat(btcAmount)) 
    ? BigInt(Math.floor(parseFloat(btcAmount) * 100000000))
    : 0n;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Send BTC to User</h1>
        <p className="text-muted-foreground">
          Select a user from the list below and distribute BTC credits to their account
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Recipient</CardTitle>
          <CardDescription>Search by name or Principal ID</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {usersLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No users found matching your search' : 'No users registered yet'}
            </p>
          ) : (
            <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
              {filteredUsers.map(([principal, profile]) => {
                const principalStr = principal.toString();
                const isSelected = selectedUser?.principal.toString() === principalStr;
                const isCopied = copiedPrincipal === principalStr;

                return (
                  <div
                    key={principalStr}
                    onClick={() => handleUserSelect(principal, profile)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary/10 border-l-4 border-l-primary'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium">{profile.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground font-mono truncate max-w-md">
                            {principalStr}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(principalStr, principalStr);
                            }}
                          >
                            {isCopied ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="ml-4">
                          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>Send Credits</CardTitle>
            <CardDescription>
              Sending to: <span className="font-medium">{selectedUser.profile.name}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Recipient Principal ID</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono break-all">{selectedUser.principal.toString()}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(selectedUser.principal.toString(), selectedUser.principal.toString())}
                >
                  {copiedPrincipal === selectedUser.principal.toString() ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">BTC Amount</Label>
              <Input
                id="amount"
                type="text"
                placeholder="0.00000000"
                value={btcAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className={amountError ? 'border-destructive' : ''}
              />
              {amountError && (
                <p className="text-sm text-destructive">{amountError}</p>
              )}
              {btcAmount && !amountError && btcAmountBigInt > 0n && (
                <div className="mt-2">
                  <UsdEstimateLine btcAmount={btcAmountBigInt} btcPriceUsd={null} />
                </div>
              )}
            </div>

            <Button
              onClick={handleSendClick}
              disabled={!btcAmount || !!amountError || sendCreditsMutation.isPending}
              className="w-full"
            >
              {sendCreditsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Credits'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Credit Distribution</DialogTitle>
            <DialogDescription>
              Please review the details before sending credits
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm text-muted-foreground">Recipient Name</p>
                <p className="font-medium">{selectedUser.profile.name}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Recipient Principal ID</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono break-all">{selectedUser.principal.toString()}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(selectedUser.principal.toString(), selectedUser.principal.toString())}
                  >
                    {copiedPrincipal === selectedUser.principal.toString() ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">BTC Amount</p>
                <p className="font-medium text-lg">{Number(btcAmount).toFixed(8)} BTC</p>
                {btcAmountBigInt > 0n && (
                  <UsdEstimateLine btcAmount={btcAmountBigInt} btcPriceUsd={null} />
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={sendCreditsMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSend}
              disabled={sendCreditsMutation.isPending}
            >
              {sendCreditsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Confirm Send'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
