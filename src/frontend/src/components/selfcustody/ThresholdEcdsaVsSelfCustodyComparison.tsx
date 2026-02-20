import { Card, CardContent } from '@/components/ui/card';
import { Shield, Key, Users, AlertTriangle } from 'lucide-react';

export default function ThresholdEcdsaVsSelfCustodyComparison() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-green-700 dark:text-green-400">
            <Shield className="h-5 w-5" />
            Threshold ECDSA (Platform Managed)
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <Users className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
              <span>Keys distributed across multiple parties</span>
            </li>
            <li className="flex gap-2">
              <Shield className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
              <span>Platform can assist with account recovery</span>
            </li>
            <li className="flex gap-2">
              <Users className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
              <span>Suitable for general use and beginners</span>
            </li>
            <li className="flex gap-2">
              <Shield className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
              <span>Enhanced security through distribution</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-amber-700 dark:text-amber-400">
            <Key className="h-5 w-5" />
            Self-Custody (User Managed)
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <Key className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>You hold the private keys directly</span>
            </li>
            <li className="flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>No platform recovery possible</span>
            </li>
            <li className="flex gap-2">
              <Key className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Suitable for advanced users wanting full control</span>
            </li>
            <li className="flex gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Complete responsibility for security</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
