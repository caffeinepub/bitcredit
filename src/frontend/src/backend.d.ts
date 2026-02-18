import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface MempoolAnalysisResult {
    mempoolDepthBytes?: BitcoinAmount;
    recommendedFeeRate: BitcoinAmount;
    diagnosticData?: string;
    feeDescription: string;
    txid: string;
    feeRateSufficiency: FeeRateSufficiency;
    timestamp: Time;
    recommendedNextBlockFeeRate?: BitcoinAmount;
    mempoolFeeRate: BitcoinAmount;
}
export interface BitcoinWallet {
    publicKey: Uint8Array;
    address: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export type ReserveManagementAction = {
    __kind__: "withdraw";
    withdraw: BitcoinAmount;
} | {
    __kind__: "deposit";
    deposit: BitcoinAmount;
} | {
    __kind__: "correction";
    correction: BitcoinAmount;
};
export interface CoverageDetails {
    adjustedCoverageRatio: number;
    pendingOutflow: bigint;
    pendingOutflowWithFees: bigint;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Transaction {
    id: string;
    transactionType: TransactionType;
    user: Principal;
    timestamp: Time;
    amount: BitcoinAmount;
}
export interface ConfirmationAnalysisResult {
    confirmations?: bigint;
    status: TransferStatus;
    diagnosticData?: string;
    forceFreshCheck?: boolean;
    expectedFee?: BitcoinAmount;
    suggestedFee?: BitcoinAmount;
    feeDecryptorAnalysis?: MempoolAnalysisResult;
    statusTimestamp: Time;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface SendBTCRequest {
    id: bigint;
    status: TransferStatus;
    failureReason?: string;
    diagnosticData?: string;
    owner: Principal;
    destinationAddress: string;
    confirmedBlockheight?: bigint;
    totalCost: BitcoinAmount;
    networkFee: BitcoinAmount;
    evictedDetectedTimestamp?: Time;
    tempStorageForBTCTransaction?: Uint8Array;
    timestamp: Time;
    blockchainTxId?: string;
    amount: BitcoinAmount;
    lastStatusCheckTimestamp?: Time;
}
export interface ReserveStatus {
    reserveBtcBalance: BitcoinAmount;
    coverageDetails?: CoverageDetails;
    outstandingIssuedCredits: BitcoinAmount;
    timestamp: Time;
    coverageRatio?: number;
}
export type BitcoinAmount = bigint;
export interface WithdrawalRequest {
    id: bigint;
    status: WithdrawalStatus;
    method: string;
    failureReason?: string;
    owner: Principal;
    account?: string;
    timestamp: Time;
    amount: BitcoinAmount;
}
export interface UserProfile {
    bitcoinWallet?: BitcoinWallet;
    name: string;
}
export enum FeeRateSufficiency {
    BORDERLINE = "BORDERLINE",
    SUFFICIENT = "SUFFICIENT",
    INSUFFICIENT = "INSUFFICIENT"
}
export enum TransactionType {
    adjustment = "adjustment",
    withdrawalRejected = "withdrawalRejected",
    withdrawalPaid = "withdrawalPaid",
    withdrawalRequested = "withdrawalRequested",
    creditPurchase = "creditPurchase",
    debit = "debit"
}
export enum TransferStatus {
    COMPLETED = "COMPLETED",
    VERIFIED = "VERIFIED",
    IN_PROGRESS = "IN_PROGRESS",
    FAILED = "FAILED",
    PENDING = "PENDING",
    EVICTED = "EVICTED"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum WithdrawalStatus {
    REJECTED = "REJECTED",
    PAID = "PAID",
    PENDING = "PENDING"
}
export interface backendInterface {
    analyzeSendBTCRequestConfirmation(requestId: bigint, forceFreshCheck: boolean | null): Promise<ConfirmationAnalysisResult>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCallerBitcoinWallet(): Promise<void>;
    getAllWithdrawalRequests(): Promise<Array<WithdrawalRequest>>;
    getCallerBalance(): Promise<BitcoinAmount>;
    getCallerBitcoinWallet(): Promise<BitcoinWallet | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentBtcPriceUsd(): Promise<number | null>;
    getEstimatedNetworkFee(_destination: string, _amount: BitcoinAmount): Promise<BitcoinAmount>;
    /**
     * / Returns actual reserve status after netting all positive and negative adjustments.
     * / # Reserve Status Calculation
     * / The fields returned by this query represent the canonical source of truth for reserve coverage:
     * / - outstandingIssuedCredits represents the net outstanding deposited credits after accounting for all adjustments
     * / - reserveBtcBalance represents the net available reserve balance (sum of all deposits minus withdrawals)
     * / - minReserveBalanceAvailable represents the tracked reserve balance available for credit issuance (reserveBtcBalance - outstandingIssuedCredits)
     * / - coverageRatio represents the coverage ratio (outstandingIssuedCredits / reserveBtcBalance), which must always be >= 1.
     */
    getReserveStatus(): Promise<ReserveStatus>;
    getTransactionHistory(): Promise<Array<Transaction>>;
    getTransferRequest(requestId: bigint): Promise<SendBTCRequest | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserWithdrawalRequests(user: Principal): Promise<Array<WithdrawalRequest>>;
    getWithdrawalRequest(requestId: bigint): Promise<WithdrawalRequest | null>;
    isCallerAdmin(): Promise<boolean>;
    manageReserve(action: ReserveManagementAction): Promise<void>;
    markWithdrawalPaid(requestId: bigint): Promise<void>;
    /**
     * / Issues credits to user upon successful verification of on-chain deposit. This function performs reserve accounting.
     * /
     * / # Reserve Accounting Rules
     * / - Always increment outstandingIssuedCredits by the credited amount (corresponds to outstanding deposit promise).
     * / - Only increment reserveBtcBalance if the deposit is actually received on-chain.
     * / - The getReserveStatus query must always return the correct coverage ratio (outstandingIssuedCredits / reserveBtcBalance).
     * / - The minReserveBalanceAvailable (tracked reserve after accounting for all outstanding credits) is calculated in getReserveStatus (no need to check/increment here).
     */
    purchaseCredits(transactionId: string, amount: BitcoinAmount): Promise<void>;
    refreshBtcPrice(): Promise<number | null>;
    refreshTransferRequestStatus(requestId: bigint): Promise<SendBTCRequest | null>;
    rejectWithdrawalRequest(requestId: bigint, reason: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendBTC(destination: string, amount: BitcoinAmount): Promise<bigint>;
    submitWithdrawalRequest(amount: BitcoinAmount, method: string, account: string | null): Promise<bigint>;
    toggleApiDiagnostics(): Promise<boolean>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
}
