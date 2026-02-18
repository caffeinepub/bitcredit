import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Wrench, Info } from 'lucide-react';
import BestPracticesSection from '../transfers/BestPracticesSection';

export default function AdminBroadcastTroubleshootingCard() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="financial-card border-purple-200 dark:border-purple-900">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <CollapsibleTrigger className="flex items-center justify-between w-full hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-2 text-left">
              <Wrench className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <div>
                <CardTitle className="text-purple-900 dark:text-purple-100">
                  Broadcasting Troubleshooting & Best Practices
                </CardTitle>
                <CardDescription>
                  Guidance for resolving Bitcoin transaction broadcasting issues
                </CardDescription>
              </div>
            </div>
            {isOpen ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
            )}
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <strong>About Broadcasting in This App</strong>
                <br />
                <span className="text-sm">
                  Bitcoin transaction broadcasting happens via configured public blockchain APIs using Internet Computer HTTP outcalls. 
                  The app does not connect to localhost endpoints or store private keys. 
                  All signing must be performed externally before broadcasting.
                </span>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground">Common Broadcasting Issues & Solutions</h3>
              <p className="text-sm text-muted-foreground">
                The guidance below covers common issues encountered when broadcasting Bitcoin transactions, 
                including connectivity problems, API provider timeouts, mempool congestion, and fee-related issues.
              </p>
            </div>

            {/* Embed the existing BestPracticesSection component */}
            <BestPracticesSection />
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
