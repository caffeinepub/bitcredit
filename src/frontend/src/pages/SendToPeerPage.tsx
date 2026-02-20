import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSendCreditsToPeer, useGetUserProfileByPrincipal, useGetCallerBalance } from '../hooks/useQueries';
import { Principal } from '@dfinity/principal';
import { Send, AlertCircle, CheckCircle2, User } from 'lucide-react';

export default function SendToPeerPage() {
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [validationError, setValidationError] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [validatedRecipient, setValidatedRecipient] = useState<Principal | null>(null);

  const { data: balance } = useGetCallerBalance();
  const getUserProfile = useGetUserProfileByPrincipal();
  const sendMutation = useSendCreditsToPeer();

  const satoshiAmount = amount && Number(amount) > 0 ? BigInt(amount) : BigInt(0);

  const validateRecipient = async () => {
    setValidationError('');
    setValidatedRecipient(null);

    try {
      const principal = Principal.fromText(recipientId.trim());
      setValidatedRecipient(principal);
      
      // Fetch the recipient profile
      await getUserProfile.mutateAsync(principal);
      
      return principal;
    } catch (error) {
      setValidationError('Invalid Principal ID format');
      return null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!validatedRecipient) {
      setValidationError('Please validate the recipient Principal ID');
      return;
    }

    if (satoshiAmount <= 0n) {
      setValidationError('Amount must be greater than 0');
      return;
    }

    if (balance !== undefined && satoshiAmount > balance) {
      setValidationError(`Insufficient balance. You have ${balance.toString()} satoshis available.`);
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmSend = async () => {
    if (!validatedRecipient) return;

    try {
      await sendMutation.mutateAsync({
        recipient: validatedRecipient,
        amount: satoshiAmount,
      });

      // Reset form on success
      setRecipientId('');
      setAmount('');
      setValidatedRecipient(null);
      getUserProfile.reset();
      setShowConfirmDialog(false);
    } catch (error: any) {
      setValidationError(error.message || 'Failed to send credits');
      setShowConfirmDialog(false);
    }
  };

  // Reset profile lookup when recipient ID changes
  useEffect(() => {
    if (validatedRecipient === null) {
      getUserProfile.reset();
    }
  }, [validatedRecipient]);

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Send to Peer</h1>
          <p className="text-muted-foreground">
            Transfer credits to another user within the platform
          </p>
        </div>

        {balance !== undefined && (
          <Alert>
            <AlertDescription>
              <strong>Your Balance:</strong> {balance.toString()} satoshis
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Transfer Details</CardTitle>
            <CardDescription>Enter the recipient's Principal ID and amount</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipientId">Recipient Principal ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="recipientId"
                    type="text"
                    placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"
                    value={recipientId}
                    onChange={(e) => {
                      setRecipientId(e.target.value);
                      setValidatedRecipient(null);
                      getUserProfile.reset();
                    }}
                    disabled={sendMutation.isPending}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={validateRecipient}
                    disabled={!recipientId.trim() || getUserProfile.isPending}
                  >
                    {getUserProfile.isPending ? 'Validating...' : 'Validate'}
                  </Button>
                </div>
                {getUserProfile.isPending && (
                  <p className="text-xs text-muted-foreground">Looking up recipient...</p>
                )}
                {getUserProfile.data && validatedRecipient && (
                  <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                    <User className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      <strong>Recipient:</strong> {getUserProfile.data.name}
                    </AlertDescription>
                  </Alert>
                )}
                {!getUserProfile.data && validatedRecipient && !getUserProfile.isPending && getUserProfile.isSuccess && (
                  <p className="text-xs text-amber-600">
                    Recipient has not set up their profile yet, but you can still send credits.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (satoshis)</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Enter amount in satoshis"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={sendMutation.isPending}
                />
              </div>

              {validationError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}

              {sendMutation.isSuccess && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Credits sent successfully!
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={sendMutation.isPending || !validatedRecipient}
                className="w-full"
              >
                <Send className="mr-2 h-4 w-4" />
                {sendMutation.isPending ? 'Sending...' : 'Send Credits'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Transfer</DialogTitle>
              <DialogDescription>
                Please confirm the details of this peer-to-peer transfer
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm font-medium">Recipient</p>
                {getUserProfile.data ? (
                  <>
                    <p className="text-sm text-muted-foreground">{getUserProfile.data.name}</p>
                    <p className="text-xs font-mono text-muted-foreground">{recipientId}</p>
                  </>
                ) : (
                  <p className="text-xs font-mono text-muted-foreground">{recipientId}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">Amount</p>
                <p className="text-sm text-muted-foreground">{satoshiAmount.toString()} satoshis</p>
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
    </div>
  );
}
