import { useState } from 'react';
import { useGetPuzzleRewardsOverview, useSubmitPuzzleSolution, useGetCallerBalance } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Puzzle, Coins, AlertCircle, Info, Trophy } from 'lucide-react';

export default function PuzzleRewardsPage() {
  const { data: puzzleOverview, isLoading: puzzlesLoading } = useGetPuzzleRewardsOverview();
  const { data: balance } = useGetCallerBalance();
  const submitSolution = useSubmitPuzzleSolution();
  
  const [selectedPuzzle, setSelectedPuzzle] = useState<string | null>(null);
  const [solution, setSolution] = useState('');

  const balanceInBTC = balance ? Number(balance) / 100_000_000 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPuzzle || !solution.trim()) return;

    try {
      await submitSolution.mutateAsync({
        puzzleId: selectedPuzzle,
        solution: solution.trim(),
      });
      setSolution('');
      setSelectedPuzzle(null);
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Puzzle className="h-8 w-8 text-primary" />
          Puzzle Rewards
        </h1>
        <p className="text-muted-foreground mt-1">
          Solve puzzles to earn BTC-denominated credits
        </p>
      </div>

      {/* Important Disclosure */}
      <Alert className="border-amber-500/50 bg-amber-500/10">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-sm space-y-2">
          <p>
            <strong>Important Disclosure:</strong> These puzzles do <strong>NOT</strong> mine real Bitcoin or create BTC on-chain. 
            Solving puzzles does not perform Bitcoin mining or generate Bitcoin on the blockchain.
          </p>
          <p>
            Puzzle rewards are app-issued BTC-denominated credits that can be used for Bitcoin mainnet transfers. 
            Credits are subject to reserve availability, and Bitcoin network fees are deducted from your credits during transfers.
          </p>
        </AlertDescription>
      </Alert>

      {/* Current Balance */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Coins className="h-5 w-5 text-primary" />
            Your Current Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">
            {balanceInBTC.toFixed(8)} BTC
          </div>
        </CardContent>
      </Card>

      {/* Available Puzzles */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Puzzles</h2>
        {puzzlesLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        ) : puzzleOverview && puzzleOverview.availablePuzzles.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {puzzleOverview.availablePuzzles.map(([puzzleId, rewardAmount]) => {
              const rewardBTC = Number(rewardAmount) / 100_000_000;
              const isSelected = selectedPuzzle === puzzleId;
              
              return (
                <Card 
                  key={puzzleId}
                  className={`cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary shadow-lg' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPuzzle(puzzleId)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="capitalize">{puzzleId} Puzzle</span>
                      <Trophy className={`h-5 w-5 ${
                        puzzleId === 'easy' ? 'text-green-600' : 'text-amber-600'
                      }`} />
                    </CardTitle>
                    <CardDescription>
                      Reward: <strong>{rewardBTC.toFixed(8)} BTC</strong> credits
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>
                        {puzzleId === 'easy' 
                          ? 'A simple puzzle to get you started. Perfect for beginners!' 
                          : 'A challenging puzzle that requires more effort. Higher reward!'}
                      </p>
                      <p className="text-xs italic">
                        Difficulty: {puzzleId === 'easy' ? 'Easy' : 'Hard'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No puzzles available at the moment</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Puzzle Solution Form */}
      {selectedPuzzle && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Submit Your Solution</CardTitle>
            <CardDescription>
              Selected puzzle: <strong className="capitalize">{selectedPuzzle}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="solution">Your Answer</Label>
                <Input
                  id="solution"
                  type="text"
                  placeholder="Enter your solution here..."
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  disabled={submitSolution.isPending}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Hint: For testing, try "correct_easy" for easy puzzle or "correct_hard" for hard puzzle
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={!solution.trim() || submitSolution.isPending}
                  className="flex-1"
                >
                  {submitSolution.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Solution'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedPuzzle(null);
                    setSolution('');
                  }}
                  disabled={submitSolution.isPending}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* How It Works */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">How Puzzle Rewards Work</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="font-semibold text-primary">1.</span>
              <span>Select a puzzle from the available options above</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-primary">2.</span>
              <span>Submit your solution to the puzzle challenge</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-primary">3.</span>
              <span>If correct, you'll instantly receive BTC-denominated credits to your balance</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-semibold text-primary">4.</span>
              <span>Use your earned credits for Bitcoin mainnet transfers on the Send BTC page</span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
