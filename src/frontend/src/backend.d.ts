import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
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
    totalCost: BitcoinAmount;
    networkFee: BitcoinAmount;
    timestamp: Time;
    blockchainTxId?: string;
    amount: BitcoinAmount;
}
export interface ReserveStatus {
    reserveBtcBalance: BitcoinAmount;
    outstandingIssuedCredits: BitcoinAmount;
    coverageRatio?: number;
}
export type BitcoinAmount = bigint;
export interface UserProfile {
    bitcoinWallet?: BitcoinWallet;
    name: string;
}
export interface BitcoinWallet {
    publicKey: Uint8Array;
    address: string;
}
export enum TransactionType {
    adjustment = "adjustment",
    creditPurchase = "creditPurchase",
    debit = "debit"
}
export enum TransferStatus {
    COMPLETED = "COMPLETED",
    VERIFIED = "VERIFIED",
    IN_PROGRESS = "IN_PROGRESS",
    FAILED = "FAILED"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    adjustCredits(user: Principal, amount: BitcoinAmount, reason: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignInitialAdminCredits(): Promise<void>;
    confirmOnChain(requestId: bigint): Promise<boolean>;
    createCallerBitcoinWallet(): Promise<void>;
    getCallerBalance(): Promise<BitcoinAmount>;
    getCallerBitcoinWallet(): Promise<BitcoinWallet | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCurrentBtcPriceUsd(): Promise<number | null>;
    getEstimatedNetworkFee(_destination: string, _amount: BitcoinAmount): Promise<BitcoinAmount>;
    getPuzzleRewardsOverview(): Promise<{
        totalPuzzles: bigint;
        availablePuzzles: Array<[string, BitcoinAmount]>;
    }>;
    getReserveStatus(): Promise<ReserveStatus>;
    getTransactionHistory(): Promise<Array<Transaction>>;
    getTransferRequest(requestId: bigint): Promise<SendBTCRequest | null>;
    getTransferRequestDiagnostics(requestId: bigint): Promise<{
        status: TransferStatus;
        failureReason?: string;
        diagnosticData?: string;
        owner: Principal;
        failureCode?: string;
    } | null>;
    getTransferStatus(requestId: bigint): Promise<TransferStatus | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVerificationEndpoint(_txId: string): Promise<string>;
    isCallerAdmin(): Promise<boolean>;
    makeTestOutcall(_endpoint: string): Promise<string>;
    manageReserve(action: ReserveManagementAction): Promise<void>;
    purchaseCredits(transactionId: string, amount: BitcoinAmount): Promise<void>;
    refreshBtcPrice(): Promise<number | null>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendBTC(destination: string, amount: BitcoinAmount): Promise<bigint>;
    submitPuzzleSolution(_puzzleId: string, solution: string): Promise<{
        rewardAmount: BitcoinAmount;
        newBalance: BitcoinAmount;
    }>;
    toggleApiDiagnostics(): Promise<boolean>;
    transferCreditsToUser(user: Principal, amount: BitcoinAmount): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    verifyBTCTransfer(requestId: bigint, blockchainTxId: string): Promise<void>;
    verifyPuzzleReward(_rewardId: string): Promise<boolean>;
}
