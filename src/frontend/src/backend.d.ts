import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface BitcoinWallet {
    publicKey: Uint8Array;
    address: string;
    segwitMetadata: SegwitMetadata;
}
export interface SegwitMetadata {
    p2wpkhStatus: boolean;
}
export type Time = bigint;
export type WithdrawalRequestId = bigint;
export interface Transaction {
    id: string;
    transactionType: TransactionType;
    user: Principal;
    timestamp: Time;
    amount: BitcoinAmount;
}
export interface PeerTransferRequest {
    id: PeerTransferId;
    status: PeerTransferStatus;
    deleted: boolean;
    createdAt: Time;
    rejectionReason?: string;
    lastUpdated: Time;
    recipient: Principal;
    approvalTimestamp?: Time;
    sender: Principal;
    approver?: Principal;
    rejectionTimestamp?: Time;
    amount: BitcoinAmount;
}
export type VerificationRequestId = bigint;
export type PeerTransferId = bigint;
export interface BitcoinPurchaseRecordInput {
    amount: BitcoinAmount;
    transactionId: string;
}
export type BitcoinAmount = bigint;
export interface WithdrawalRequest {
    id: WithdrawalRequestId;
    status: WithdrawalStatus;
    method: string;
    failureReason?: string;
    owner: Principal;
    account?: string;
    timestamp: Time;
    amount: BitcoinAmount;
}
export interface BitcoinPurchaseRecord {
    amount: BitcoinAmount;
    verifiedAt: Time;
    verifiedBy: Principal;
    transactionId: string;
}
export interface VerificationRequest {
    id: VerificationRequestId;
    status: VerificationStatus;
    requester: Principal;
    submittedAt: Time;
    reviewComment?: string;
    reviewedAt?: Time;
    reviewedBy?: Principal;
    amount: BitcoinAmount;
    transactionId: string;
}
export interface UserProfile {
    bitcoinWallet?: BitcoinWallet;
    name: string;
}
export enum PeerTransferStatus {
    deleted = "deleted",
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum TransactionType {
    adjustment = "adjustment",
    withdrawalRejected = "withdrawalRejected",
    withdrawalPaid = "withdrawalPaid",
    withdrawalRequested = "withdrawalRequested",
    creditPurchase = "creditPurchase",
    debit = "debit"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum VerificationStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum WithdrawalStatus {
    REJECTED = "REJECTED",
    PAID = "PAID",
    PENDING = "PENDING"
}
export interface backendInterface {
    approveVerificationRequest(requestId: VerificationRequestId, comment: string | null): Promise<void>;
    approveWithdrawal(requestId: WithdrawalRequestId): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    creditBtc(user: Principal, amount: BitcoinAmount): Promise<void>;
    getAllPeerTransfers(): Promise<{
        __kind__: "success";
        success: {
            totalTransfers: bigint;
            transfers: Array<[PeerTransferId, PeerTransferRequest]>;
        };
    } | {
        __kind__: "failedToRetrieveTransfers";
        failedToRetrieveTransfers: {
            errorMessage: string;
        };
    }>;
    getAllUsers(): Promise<Array<[Principal, UserProfile]>>;
    getAllVerificationRequests(): Promise<Array<[VerificationRequestId, VerificationRequest]>>;
    getAllWithdrawalRequests(): Promise<Array<WithdrawalRequest>>;
    getBitcoinPurchase(transactionId: string): Promise<BitcoinPurchaseRecord | null>;
    getBitcoinPurchases(): Promise<Array<[string, BitcoinPurchaseRecord]>>;
    getCallerBalance(): Promise<BitcoinAmount>;
    getCallerPeerTransfers(): Promise<Array<PeerTransferRequest>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCallerWithdrawalRequests(): Promise<Array<WithdrawalRequest>>;
    getPeerTransfer(transferId: PeerTransferId): Promise<PeerTransferRequest | null>;
    getTransactionHistory(): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserVerificationRequests(user: Principal): Promise<Array<VerificationRequest>>;
    getVerificationRequest(requestId: VerificationRequestId): Promise<VerificationRequest | null>;
    getWithdrawalRequest(requestId: WithdrawalRequestId): Promise<WithdrawalRequest | null>;
    isCallerAdmin(): Promise<boolean>;
    markWithdrawalAsPaid(requestId: WithdrawalRequestId): Promise<void>;
    recordBitcoinPurchase(input: BitcoinPurchaseRecordInput): Promise<void>;
    rejectVerificationRequest(requestId: VerificationRequestId, comment: string): Promise<void>;
    rejectWithdrawal(requestId: WithdrawalRequestId, reason: string): Promise<void>;
    requestWithdrawal(amount: BitcoinAmount, method: string, account: string | null): Promise<WithdrawalRequestId>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendCreditsToPeer(recipient: Principal, amount: BitcoinAmount): Promise<PeerTransferId>;
    submitVerificationRequest(transactionId: string, amount: BitcoinAmount): Promise<VerificationRequestId>;
}
