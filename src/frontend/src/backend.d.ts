import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface SendBTCRequest {
    id: bigint;
    status: TransferStatus;
    owner: Principal;
    destinationAddress: string;
    totalCost: bigint;
    networkFee: bigint;
    timestamp: Time;
    blockchainTxId?: string;
    amount: bigint;
}
export interface UserProfile {
    name: string;
}
export interface Transaction {
    id: string;
    transactionType: TransactionType;
    user: Principal;
    timestamp: Time;
    amount: bigint;
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
    adjustCredits(user: Principal, amount: bigint, reason: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    assignInitialAdminCredits(): Promise<void>;
    getCallerBalance(): Promise<bigint>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEstimatedNetworkFee(_destination: string, _amount: bigint): Promise<bigint>;
    getTransactionHistory(): Promise<Array<Transaction>>;
    getTransferRequest(requestId: bigint): Promise<SendBTCRequest | null>;
    getTransferStatus(requestId: bigint): Promise<TransferStatus | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVerificationEndpoint(_txId: string): Promise<string>;
    isCallerAdmin(): Promise<boolean>;
    makeTestOutcall(endpoint: string): Promise<string>;
    purchaseCredits(transactionId: string, amount: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendBTC(destination: string, amount: bigint): Promise<bigint>;
    transferCreditsToUser(user: Principal, amount: bigint): Promise<void>;
    transform(_input: string): Promise<string>;
    verifyBTCTransfer(requestId: bigint, blockchainTxId: string): Promise<void>;
}
