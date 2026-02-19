import type { Principal } from "@icp-sdk/core/principal";

export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;

export interface Transaction {
    id: string;
    transactionType: TransactionType;
    user: Principal;
    timestamp: Time;
    amount: BitcoinAmount;
    signingStatus?: SigningStatus;
    broadcastStatus?: BroadcastStatus;
    confirmationCount?: number;
    txHash?: string;
    segwitAddressType?: SegwitAddressType;
}

export interface SegwitMetadata {
    p2wpkhStatus: boolean;
}

export type Time = bigint;
export type BitcoinAmount = bigint;

export interface UserProfile {
    bitcoinWallet?: BitcoinWallet;
    name: string;
}

export interface BitcoinWallet {
    publicKey: Uint8Array;
    address: string;
    segwitMetadata: SegwitMetadata;
}

export enum TransactionType {
    adjustment = "adjustment",
    withdrawalRejected = "withdrawalRejected",
    withdrawalPaid = "withdrawalPaid",
    withdrawalRequested = "withdrawalRequested",
    creditPurchase = "creditPurchase",
    debit = "debit",
    mainnetTransfer = "mainnetTransfer"
}

export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}

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

export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getTransactionHistory(): Promise<Array<Transaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
