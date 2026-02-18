import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Puzzle } from 'lucide-react';

export default function PuzzleRewardsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Puzzle className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight">Puzzle Rewards</h1>
        </div>
        <p className="text-muted-foreground">
          Solve puzzles to earn BTC-denominated credits
        </p>
      </div>

      <Card className="financial-card">
        <CardHeader>
          <CardTitle>Puzzle Rewards System</CardTitle>
          <CardDescription>
            Earn credits by solving computational puzzles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Feature Not Available:</strong> The puzzle rewards system is currently not implemented in the backend. This feature will be available in a future update.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
