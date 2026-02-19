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
  Play,
  Check,
  CheckCheck,
  Copy
} from 'lucide-react';
import BroadcastingDetailsNote from '../components/transfers/BroadcastingDetailsNote';
import BestPracticesSection from '../components/transfers/BestPracticesSection';
import { toast } from 'sonner';

export default function TransferTroubleshootingPage() {
  const params = useParams({ from: '/transfer/$requestId/troubleshoot' });
  const navigate = useNavigate();
  const requestId = params.requestId ? BigInt(params.requestId) : null;
  const [forceFreshCheck, setForceFreshCheck] = useState(false);
  const [copiedTxId, setCopiedTxId] = useState(false);
  
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

  const handleCopyTxId = async (txid: string) => {
    try {
      await navigator.clipboard.writeText(txid);
      setCopiedTxId(true);
      toast.success('Transaction ID copied to clipboard');
      setTimeout(() => setCopiedTxId(false), 2000);
    } catch (error) {
      toast.error('Failed to copy transaction ID');
    }
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
  const isCompleted = transferRequest.status === 'COMPLETED';
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

      {/* Broadcast Success Indicator */}
      {hasTxId && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <strong className="flex items-center gap-1">
              <Check className="h-4 w-4" />
              Transaction Broadcast to Blockchain
            </strong>
            <span className="text-sm">
              This transaction has been successfully posted to the Bitcoin blockchain API.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Confirmation Success Indicator */}
      {isCompleted && (
        <Alert className="border-emerald-600 bg-emerald-50 dark:bg-emerald-950/20">
          <CheckCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <AlertDescription className="text-emerald-800 dark:text-emerald-200">
            <strong className="flex items-center gap-1">
              <CheckCheck className="h-4 w-4" />
              Transaction Confirmed On-Chain
            </strong>
            <span className="text-sm">
              This transaction has been confirmed on the Bitcoin blockchain. The transfer is complete.
            </span>
          </AlertDescription>
        </Alert>
      )}

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
          </div>

          {transferRequest.blockchainTxId && (
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">Blockchain Transaction ID</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-background p-2 rounded font-mono break-all">
                  {transferRequest.blockchainTxId}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyTxId(transferRequest.blockchainTxId!)}
                >
                  {copiedTxId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
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
          )}

          {transferRequest.failureReason && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Failure Reason:</strong>
                <br />
                {transferRequest.failureReason}
              </AlertDescription>
            </Alert>
          )}

          {transferRequest.diagnosticData && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Diagnostic Data</p>
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                {transferRequest.diagnosticData}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="financial-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-chart-2" />
            Automated Analysis
          </CardTitle>
          <CardDescription>
            Built-in status checks and fee analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {analysisLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : analysisResult ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Analysis Status</p>
                  <p className="font-semibold">{analysisResult.status}</p>
                </div>
                {analysisResult.confirmations !== undefined && analysisResult.confirmations !== null && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Confirmations</p>
                    <p className="font-semibold">{analysisResult.confirmations.toString()}</p>
                  </div>
                )}
                {analysisResult.expectedFee !== undefined && analysisResult.expectedFee !== null && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Expected Fee</p>
                    <p className="font-semibold">{analysisResult.expectedFee.toString()} sats</p>
                  </div>
                )}
                {analysisResult.suggestedFee !== undefined && analysisResult.suggestedFee !== null && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Suggested Fee</p>
                    <p className="font-semibold text-chart-2">{analysisResult.suggestedFee.toString()} sats</p>
                  </div>
                )}
              </div>

              {analysisResult.feeDecryptorAnalysis && (
                <Alert className="border-chart-2 bg-chart-2/5">
                  <TrendingUp className="h-4 w-4 text-chart-2" />
                  <AlertDescription className="text-chart-2">
                    <strong>Fee Analysis:</strong>
                    <br />
                    <span className="text-sm">{analysisResult.feeDecryptorAnalysis.feeDescription}</span>
                    <br />
                    <span className="text-xs text-muted-foreground">
                      Mempool fee rate: {analysisResult.feeDecryptorAnalysis.mempoolFeeRate.toString()} sats | 
                      Recommended: {analysisResult.feeDecryptorAnalysis.recommendedFeeRate.toString()} sats
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {analysisResult.diagnosticData && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Analysis Diagnostic Data</p>
                  <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                    {analysisResult.diagnosticData}
                  </pre>
                </div>
              )}

              <Button
                variant="outline"
                onClick={handleForceFreshAnalysis}
                disabled={refreshStatusMutation.isPending}
                className="w-full"
              >
                {refreshStatusMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running Fresh Analysis...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Fresh Analysis
                  </>
                )}
              </Button>
            </>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No analysis data available. Click "Run Fresh Analysis" to perform a new check.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {isFailed && !hasTxId && (
        <Card className="financial-card border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Play className="h-5 w-5" />
              Retry Broadcast
            </CardTitle>
            <CardDescription>
              Create a new transfer request with the same parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> This will create a new transfer request as a retry attempt. 
                The original failed request will remain in your history for reference. 
                Your current balance will be checked before creating the new request.
              </AlertDescription>
            </Alert>
            <Button
              variant="default"
              onClick={handleRetryBroadcast}
              disabled={sendBTCMutation.isPending}
              className="w-full"
            >
              {sendBTCMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Retry Request...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Retry Broadcast
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      <Separator />

      <BroadcastingDetailsNote />

      <BestPracticesSection
        failureReason={transferRequest.failureReason || undefined}
        diagnosticData={transferRequest.diagnosticData || undefined}
      />
    </div>
  );
}
