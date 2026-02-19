import type { Transaction as BaseTransaction } from '../backend';

// Extended types for mainnet transaction tracking
export enum SigningStatus {
  pending = "pending",
  signed = "signed",
  failed = "failed"
}

export enum BroadcastStatus {
  pending = "pending",
  broadcast = "broadcast",
  confirmed = "confirmed",
  failed = "failed"
}

export type SegwitAddressType = "P2WPKH" | "P2WSH" | null;

// Extended Transaction type with mainnet fields
export interface MainnetTransaction extends BaseTransaction {
  signingStatus?: SigningStatus;
  broadcastStatus?: BroadcastStatus;
  confirmationCount?: number;
  txHash?: string;
  segwitAddressType?: SegwitAddressType;
}

// Type guard to check if a transaction has mainnet fields
export function isMainnetTransaction(tx: BaseTransaction): tx is MainnetTransaction {
  return 'signingStatus' in tx || 'broadcastStatus' in tx || 'confirmationCount' in tx;
}

// Broadcast attempt log entry
export interface BroadcastAttempt {
  provider: string;
  timestamp: number;
  httpStatus: number;
  success: boolean;
  errorMessage?: string;
  responseBody?: string;
}

// SendBTC result type (not in backend interface)
export interface SendBTCResult {
  success: boolean;
  requestId?: bigint;
  recordsUpdated: boolean;
  diagnosticData?: string;
  broadcastAttempts?: BroadcastAttempt[];
}

// Confirmation analysis result type (not in backend interface)
export interface ConfirmationAnalysisResult {
  status: string;
  feeDecryptorAnalysis?: any;
  diagnosticData?: string;
  confirmations?: number;
  expectedFee?: bigint;
  suggestedFee?: bigint;
  statusTimestamp: bigint;
  forceFreshCheck?: boolean;
}
