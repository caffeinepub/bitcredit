import type { BitcoinAmount, Time } from '../backend';

export interface SelfCustodyWallet {
  address: string;
  createdAt: Time;
  balance: BitcoinAmount;
  derivationPath?: string;
  network: 'mainnet' | 'testnet';
}

export interface SelfCustodyTransfer {
  id: string;
  source: string;
  destination: string;
  amount: BitcoinAmount;
  timestamp: Time;
  status: SelfCustodyTransferStatus;
  confirmations?: number;
  txId?: string;
}

export enum SelfCustodyTransferStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Failed = 'failed',
}
