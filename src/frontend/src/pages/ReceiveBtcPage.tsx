import AppLayout from '../components/layout/AppLayout';
import BitcoinAddressDisplay from '../components/balance/BitcoinAddressDisplay';
import AddressHistoryView from '../components/balance/AddressHistoryView';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info } from 'lucide-react';

export default function ReceiveBtcPage() {
  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Receive Bitcoin</h1>
            <p className="text-muted-foreground">
              Generate and share your Bitcoin address to receive funds
            </p>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>How to Receive Bitcoin</AlertTitle>
            <AlertDescription className="space-y-2 mt-2">
              <p>
                1. Generate or view your Bitcoin receiving address below
              </p>
              <p>
                2. Share this address with the sender or scan the QR code with their wallet
              </p>
              <p>
                3. Wait for the transaction to be confirmed on the Bitcoin network (typically 10-60 minutes)
              </p>
              <p className="text-sm text-muted-foreground mt-3">
                <strong>Note:</strong> Bitcoin transactions require network confirmations. 
                Your balance will update once the transaction receives sufficient confirmations (usually 1-6 blocks).
              </p>
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">Active Address</TabsTrigger>
              <TabsTrigger value="history">Address History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="space-y-4">
              <BitcoinAddressDisplay />
              
              <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  <strong>Security Notice:</strong> Always verify the address before sending funds. 
                  This application uses Segwit (P2WPKH) addresses for lower transaction fees and better security.
                </AlertDescription>
              </Alert>
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4">
              <AddressHistoryView />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
