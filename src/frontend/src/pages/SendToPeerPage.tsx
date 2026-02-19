import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useGetCallerBalance, useGetUserProfile, useSendCreditsToPeer } from '../hooks/useQueries';
import { Principal } from '@dfinity/principal';
import { toast } from 'sonner';
import { ArrowRight, Users } from 'lucide-react';
import UsdEstimateLine from '../components/balance/UsdEstimateLine';

export default function SendToPeerPage() {
  const navigate = useNavigate();
  const [recipientPrincipal, setRecipientPrincipal] = useState('');
  const [amount, setAmount] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [validatedRecipient, setValidatedRecipient] = useState<Principal | null>(null);

  const { data: balance, isLoading: balanceLoading } = useGetCallerBalance();
  const { data: recipientProfile, isLoading: recipientLoading } = useGetUserProfile(validatedRecipient);
  const sendMutation = useSendCreditsToPeer();

  const btcBalance = balance ? Number(balance) / 100_000_000 : 0;
  const amountSatoshis = amount ? Math.floor(parseFloat(amount) * 100_000_000) : 0;

  const validateRecipient = () => {
    try {
      const principal = Principal.fromText(recipientPrincipal.trim());
      setValidatedRecipient(principal);
      return true;
    } catch (error) {
      toast.error('Invalid principal ID format');
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRecipient()) return;
    
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amountSatoshis > Number(balance || 0n)) {
      toast.error('Insufficient balance');
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirm = async () => {
    if (!validatedRecipient) return;

    try {
      await sendMutation.mutateAsync({
        recipient: validatedRecipient,
        amount: BigInt(amountSatoshis),
      });
      
      toast.success('Transfer request sent successfully!');
      navigate({ to: '/outgoing-requests' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to send transfer request');
    } finally {
      setShowConfirmDialog(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Send to Peer</h1>
        <p className="text-muted-foreground">Transfer credits to another user by their principal ID</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Your Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {balanceLoading ? (
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          ) : (
            <>
              <p className="text-2xl font-bold">₿ {btcBalance.toFixed(8)}</p>
              <UsdEstimateLine btcAmount={balance || 0n} btcPriceUsd={null} />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Transfer Details</CardTitle>
          </div>
          <CardDescription>Enter recipient information and amount</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Principal ID</Label>
              <Input
                id="recipient"
                placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"
                value={recipientPrincipal}
                onChange={(e) => setRecipientPrincipal(e.target.value)}
                onBlur={validateRecipient}
                required
              />
              {validatedRecipient && recipientProfile && (
                <p className="text-sm text-green-600">
                  Recipient: {recipientProfile.name}
                </p>
              )}
              {validatedRecipient && !recipientLoading && !recipientProfile && (
                <p className="text-sm text-yellow-600">
                  Warning: Recipient has no profile
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (BTC)</Label>
              <Input
                id="amount"
                type="number"
                step="0.00000001"
                min="0"
                placeholder="0.00000000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              {amount && parseFloat(amount) > 0 && (
                <p className="text-sm text-muted-foreground">
                  = {amountSatoshis.toLocaleString()} satoshis
                </p>
              )}
            </div>

            {amount && amountSatoshis > Number(balance || 0n) && (
              <p className="text-sm text-destructive">Insufficient balance</p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={sendMutation.isPending || !recipientPrincipal || !amount}
            >
              {sendMutation.isPending ? 'Processing...' : 'Send Credits'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Transfer</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to transfer <strong>₿ {parseFloat(amount || '0').toFixed(8)}</strong> to:
              <br />
              <span className="font-mono text-xs break-all">{recipientPrincipal}</span>
              {recipientProfile && (
                <>
                  <br />
                  <strong>({recipientProfile.name})</strong>
                </>
              )}
              <br /><br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Confirm Transfer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
