import { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { useGetTransferRequest, useGetCallerBalance, useAnalyzeSendBTCRequestConfirmation, useRefreshTransferStatus, useSendBTC } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  AlertCircle, 
  ArrowLeft, 
  RefreshCw, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Info,
  Zap,
  TrendingUp,
  AlertTriangle,
  Play
} from 'lucide-react';
import BroadcastingDetailsNote from '../components/transfers/BroadcastingDetailsNote';
import BestPracticesSection from '../components/transfers/BestPracticesSection';
import { toast } from 'sonner';

export default function TransferTroubleshootingPage() {
  const params = useParams({ from: '/transfer/$requestId/troubleshoot' });
  const navigate = useNavigate();
  const requestId = params.requestId ? BigInt(params.requestId) : null;
  const [forceFreshCheck, setForceFreshCheck] = useState(false);
  
  const { data: transferRequest, isLoading, refetch, isFetching } = useGetTransferRequest(requestId, false);
  const { data: balance } = useGetCallerBalance();
  const { data: analysisResult, isLoading: analysisLoading, refetch: refetchAnalysis } = useAnalyzeSendBTCRequestConfirmation(requestId, forceFreshCheck);
  const refreshStatusMutation = useRefreshTransferStatus();
  const sendBTCMutation = useSendBTC();

  const handleRefresh = () => {
    refetch();
    refetchAnalysis();
  };

  const handleForceFreshAnalysis = async () => {
    setForceFreshCheck(true);
    if (requestId) {
      await refreshStatusMutation.mutateAsync(requestId);
    }
    await refetchAnalysis();
    setForceFreshCheck(false);
  };

  const handleRetryBroadcast = async () => {
    if (!transferRequest) return;

    const confirmed = window.confirm(
      `This will create a new transfer request as a retry attempt.\n\n` +
      `Destination: ${transferRequest.destinationAddress}\n` +
      `Amount: ${formatSatoshis(transferRequest.amount)} BTC\n\n` +
      `Your current balance will be checked, and a new request will be created. Continue?`
    );

    if (!confirmed) return;

    try {
      const result = await sendBTCMutation.mutateAsync({
        destination: transferRequest.destinationAddress,
        amount: transferRequest.amount,
      });

      toast.success('New transfer request created successfully!');
      
      // Navigate to the new request
      navigate({ 
        to: '/transfer/$requestId/troubleshoot',
        params: { requestId: result.requestId.toString() }
      });
    } catch (error: any) {
      toast.error(`Failed to create retry request: ${error.message || 'Unknown error'}`);
    }
  };

  const handleBackToHistory = () => {
    navigate({ to: '/history' });
  };

  const getStatusBadge = () => {
    if (!transferRequest) return null;

    switch (transferRequest.status) {
      case 'IN_PROGRESS':
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            In Progress
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge variant="default" className="gap-1 bg-chart-1">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      case 'EVICTED':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Evicted
          </Badge>
        );
      default:
        return <Badge variant="outline">{transferRequest.status}</Badge>;
    }
  };

  const formatSatoshis = (sats: bigint) => {
    return (Number(sats) / 100_000_000).toFixed(8);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!transferRequest) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Transfer request not found. Please check the request ID and try again.
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={handleBackToHistory}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to History
        </Button>
      </div>
    );
  }

  const isFailed = transferRequest.status === 'FAILED' || transferRequest.status === 'EVICTED';
  const hasTxId = !!transferRequest.blockchainTxId;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight">Transfer Troubleshooting</h1>
          <p className="text-muted-foreground">
            Diagnose and resolve issues with your Bitcoin transfer request
          </p>
        </div>
        <Button variant="outline" onClick={handleBackToHistory}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to History
        </Button>
      </div>

      <Alert className="border-chart-2 bg-chart-2/5">
        <Info className="h-4 w-4 text-chart-2" />
        <AlertDescription className="text-chart-2">
          <strong>Built-in Guidance</strong>
          <br />
          <span className="text-sm text-muted-foreground">
            This guidance is built into the app using automated status checks. The app does not run external AI agents or browse the internet.
          </span>
        </AlertDescription>
      </Alert>

      <Card className="financial-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Request Details</CardTitle>
              <CardDescription>Current status and transaction information</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isFetching}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Request ID</p>
              <p className="font-mono text-sm">{transferRequest.id.toString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="font-semibold">{transferRequest.status}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Destination Address</p>
              <p className="font-mono text-xs break-all">{transferRequest.destinationAddress}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Amount</p>
              <p className="font-semibold">{formatSatoshis(transferRequest.amount)} BTC</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Network Fee</p>
              <p className="font-semibold">{formatSatoshis(transferRequest.networkFee)} BTC</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
              <p className="font-semibold">{formatSatoshis(transferRequest.totalCost)} BTC</p>
            </div>
          </div>

          {transferRequest.blockchainTxId && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Transaction ID (txid)</p>
                <p className="font-mono text-xs break-all bg-muted p-2 rounded">
                  {transferRequest.blockchainTxId}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  View on{' '}
                  <a
                    href={`https://blockstream.info/tx/${transferRequest.blockchainTxId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Blockstream Explorer
                  </a>
                </p>
              </div>
            </>
          )}

          {transferRequest.failureReason && (
            <>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Failure Reason</p>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {transferRequest.failureReason}
                  </AlertDescription>
                </Alert>
              </div>
            </>
          )}

          {transferRequest.diagnosticData && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Diagnostic Data</p>
              <p className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono">
                {transferRequest.diagnosticData}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Automated Analysis Section */}
      <Card className="financial-card border-chart-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-chart-2" />
              <div>
                <CardTitle>Automated Analysis</CardTitle>
                <CardDescription>Built-in confirmation and fee analysis</CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleForceFreshAnalysis}
              disabled={refreshStatusMutation.isPending || analysisLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${(refreshStatusMutation.isPending || analysisLoading) ? 'animate-spin' : ''}`} />
              Run Fresh Analysis
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysisLoading || refreshStatusMutation.isPending ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : analysisResult ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Derived Status</p>
                  <div className="flex items-center gap-2">
                    {analysisResult.status === 'COMPLETED' && (
                      <Badge variant="default" className="gap-1 bg-chart-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Confirmed / Success
                      </Badge>
                    )}
                    {analysisResult.status === 'IN_PROGRESS' && (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                    {analysisResult.status === 'FAILED' && (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Failed
                      </Badge>
                    )}
                    {analysisResult.status === 'EVICTED' && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Dropped / Evicted
                      </Badge>
                    )}
                  </div>
                </div>

                {analysisResult.confirmations !== undefined && analysisResult.confirmations !== null && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Confirmations</p>
                    <p className="font-semibold">{analysisResult.confirmations.toString()}</p>
                  </div>
                )}
              </div>

              {analysisResult.feeDecryptorAnalysis && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-chart-2" />
                      <p className="text-sm font-semibold">Fee & Mempool Analysis</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Current Fee Rate</p>
                        <p className="font-mono text-sm">{formatSatoshis(analysisResult.feeDecryptorAnalysis.mempoolFeeRate)} BTC</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Recommended Fee Rate</p>
                        <p className="font-mono text-sm">{formatSatoshis(analysisResult.feeDecryptorAnalysis.recommendedFeeRate)} BTC</p>
                      </div>
                    </div>

                    {analysisResult.feeDecryptorAnalysis.recommendedNextBlockFeeRate && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Suggested Next-Block Fee Rate</p>
                        <p className="font-mono text-sm">{formatSatoshis(analysisResult.feeDecryptorAnalysis.recommendedNextBlockFeeRate)} BTC</p>
                      </div>
                    )}

                    {analysisResult.suggestedFee && (
                      <Alert className="border-chart-2 bg-chart-2/5">
                        <Info className="h-4 w-4 text-chart-2" />
                        <AlertDescription className="text-sm">
                          <strong>Suggested Bumped Fee (10% buffer):</strong>{' '}
                          <span className="font-mono">{formatSatoshis(analysisResult.suggestedFee)} BTC</span>
                          <br />
                          <span className="text-xs text-muted-foreground mt-1 block">
                            This is an informational suggestion. RBF (Replace-By-Fee) fee bumping requires creating a replacement transaction with a higher fee and re-signing it externally. 
                            This app does not have access to private keys and cannot automatically re-sign transactions. 
                            If your transaction is stuck with a low fee, you may need to wait for it to confirm or be dropped from the mempool, then create a new transfer request.
                          </span>
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Fee Sufficiency</p>
                      <div className="flex items-center gap-2">
                        {analysisResult.feeDecryptorAnalysis.feeRateSufficiency === 'SUFFICIENT' && (
                          <Badge variant="default" className="bg-chart-1">Sufficient</Badge>
                        )}
                        {analysisResult.feeDecryptorAnalysis.feeRateSufficiency === 'BORDERLINE' && (
                          <Badge variant="secondary">Borderline</Badge>
                        )}
                        {analysisResult.feeDecryptorAnalysis.feeRateSufficiency === 'INSUFFICIENT' && (
                          <Badge variant="destructive">Insufficient</Badge>
                        )}
                      </div>
                    </div>

                    {analysisResult.feeDecryptorAnalysis.feeDescription && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Analysis Description</p>
                        <p className="text-sm text-muted-foreground">{analysisResult.feeDecryptorAnalysis.feeDescription}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {analysisResult.diagnosticData && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Analysis Diagnostic Data</p>
                    <p className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono">
                      {analysisResult.diagnosticData}
                    </p>
                  </div>
                </>
              )}
            </>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No analysis data available. Click "Run Fresh Analysis" to perform automated status checks.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Retry Broadcast Section - Only show when no txid exists */}
      {isFailed && !hasTxId && (
        <Card className="financial-card border-amber-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Play className="h-5 w-5 text-amber-500" />
              <div>
                <CardTitle>Retry Broadcast</CardTitle>
                <CardDescription>Create a new transfer request as a retry attempt</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-amber-500 bg-amber-500/5">
              <Info className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-sm">
                <strong>What happens when you retry:</strong>
                <br />
                <span className="text-muted-foreground">
                  A new transfer request will be created with the same destination and amount. 
                  Your balance will be checked, and if sufficient, a new broadcast attempt will be made. 
                  This will create a separate request in your history (not a duplicate of this one).
                </span>
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium">Retry Details</p>
                <p className="text-xs text-muted-foreground">
                  Destination: <span className="font-mono">{transferRequest.destinationAddress.slice(0, 20)}...</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Amount: <span className="font-mono">{formatSatoshis(transferRequest.amount)} BTC</span>
                </p>
              </div>
              <Button
                variant="default"
                onClick={handleRetryBroadcast}
                disabled={sendBTCMutation.isPending}
              >
                {sendBTCMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Retry Broadcast
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info for transactions with txid */}
      {hasTxId && (
        <Alert className="border-chart-2 bg-chart-2/5">
          <Info className="h-4 w-4 text-chart-2" />
          <AlertDescription className="text-sm">
            <strong>Transaction Already Broadcast</strong>
            <br />
            <span className="text-muted-foreground">
              This transfer has a blockchain transaction ID, meaning it was successfully broadcast. 
              The automated analysis above shows confirmation status and mempool information. 
              Actions that require private keys (such as RBF fee bumping or transaction re-signing) must be done externally—never paste private keys into this app.
            </span>
          </AlertDescription>
        </Alert>
      )}

      <BroadcastingDetailsNote />

      <BestPracticesSection
        failureReason={transferRequest.failureReason || undefined}
        diagnosticData={transferRequest.diagnosticData || undefined}
      />
    </div>
  );
}
