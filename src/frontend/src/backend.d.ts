import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserProfile {
    bitcoinWallet?: BitcoinWallet;
    name: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface ReserveMultisigConfig {
    threshold: bigint;
    redeemScript?: string;
    address?: string;
    pubkeys: Array<Uint8Array>;
}
export interface ExtendedReserveAdjustment {
    performedBy: Principal;
    timestamp: Time;
    amount: BitcoinAmount;
    transactionId?: string;
    reason: ReserveChangeReason;
}
export interface CoverageDetails {
    adjustedCoverageRatio: number;
    pendingOutflow: bigint;
    pendingOutflowWithFees: bigint;
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
export interface ReserveDepositValidationResult {
    confirmedDeposit: boolean;
    success: boolean;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface SendBTCRequest {
    id: bigint;
    status: TransferStatus;
    addressValidation?: AddressValidationResult;
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
export type BitcoinAmount = bigint;
export interface ReserveDepositValidationRequest {
    txid: string;
    amount: BitcoinAmount;
}
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
export interface AddressValidationResult {
    error?: string;
    addressType?: AddressType;
    isValid: boolean;
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
export interface ReserveStatus {
    reserveBtcBalance: BitcoinAmount;
    coverageDetails?: CoverageDetails;
    outstandingIssuedCredits: BitcoinAmount;
    timestamp: Time;
    coverageRatio?: number;
}
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
export enum AddressType {
    P2PKH = "P2PKH",
    P2SH = "P2SH",
    Bech32m = "Bech32m",
    Bech32 = "Bech32"
}
export enum FeeRateSufficiency {
    BORDERLINE = "BORDERLINE",
    SUFFICIENT = "SUFFICIENT",
    INSUFFICIENT = "INSUFFICIENT"
}
export enum ReserveChangeReason {
    adjustment = "adjustment",
    deposit = "deposit",
    withdrawal = "withdrawal"
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
    getAllReserveAdjustments(): Promise<Array<[bigint, ExtendedReserveAdjustment]>>;
    getAllWithdrawalRequests(): Promise<Array<WithdrawalRequest>>;
    getCallerBalance(): Promise<BitcoinAmount>;
    getCallerBitcoinWallet(): Promise<BitcoinWallet | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentBtcPriceUsd(): Promise<number | null>;
    getEstimatedNetworkFee(_destination: string, _amount: BitcoinAmount): Promise<BitcoinAmount>;
    getReserveMultisigConfig(): Promise<ReserveMultisigConfig | null>;
    getReserveStatus(): Promise<ReserveStatus>;
    getTransactionHistory(): Promise<Array<Transaction>>;
    getTransferRequest(requestId: bigint): Promise<SendBTCRequest | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserWithdrawalRequests(user: Principal): Promise<Array<WithdrawalRequest>>;
    getWithdrawalRequest(requestId: bigint): Promise<WithdrawalRequest | null>;
    isCallerAdmin(): Promise<boolean>;
    isReserveMultisigConfigSet(): Promise<boolean>;
    manageReserve(action: ReserveManagementAction, transactionId: string | null): Promise<void>;
    markWithdrawalPaid(requestId: bigint): Promise<void>;
    purchaseCredits(transactionId: string, amount: BitcoinAmount): Promise<void>;
    refreshBtcPrice(): Promise<number | null>;
    refreshTransferRequestStatus(requestId: bigint): Promise<SendBTCRequest | null>;
    rejectWithdrawalRequest(requestId: bigint, reason: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendBTC(destinationAddress: string, amount: BitcoinAmount): Promise<bigint>;
    submitWithdrawalRequest(amount: BitcoinAmount, method: string, account: string | null): Promise<bigint>;
    toggleApiDiagnostics(): Promise<boolean>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateReserveMultisigConfig(threshold: bigint, pubkeys: Array<Uint8Array>, address: string | null, redeemScript: string | null): Promise<void>;
    validateReserveDeposit(request: ReserveDepositValidationRequest): Promise<ReserveDepositValidationResult>;
}
