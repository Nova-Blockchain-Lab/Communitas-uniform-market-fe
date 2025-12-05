/**
 * Centralized type definitions for the application
 */

import { BigNumber } from "ethers";
import { Chain } from "viem";
import { ChildToParentMessageStatus } from "@arbitrum/sdk";

// ============================================
// Blockchain Types
// ============================================

export type EthereumAddress = `0x${string}`;

export interface ContractAddresses {
  [chainId: string]: {
    [contractName: string]: {
      [country: string]: EthereumAddress;
    };
  };
}

// ============================================
// NFT Types
// ============================================

export interface NFTData {
  tokenId: string;
  image: string;
  name: string;
  description: string;
}

export interface NFTDataStorage extends NFTData {
  hash: string;
  owner: string;
}

export interface NFTDataWithStatus extends NFTDataStorage {
  state: ChildToParentMessageStatus;
}

// ============================================
// Bridge/Message Types
// ============================================

export enum MessageType {
  DEPOSIT = 1,
  WITHDRAW = 2,
}

export interface MessageStatusType {
  status: string;
  color: string;
}

export interface ETHDepositOrWithdrawalMessage {
  time: BigNumber;
  token: string;
  from: Chain;
  to: Chain;
  status: MessageStatusType;
  hash: string;
  type: MessageType;
}

export interface ETHDepositEvent {
  txHash: string;
  sender: string;
  amount: BigNumber;
  messageIndex: BigNumber;
  timestamp: BigNumber;
}

// ============================================
// Market Types
// ============================================

export interface MarketOrder {
  id: string;
  type: "bid" | "ask";
  price: number;
  quantity: number;
  timestamp: number;
}

export interface EnergyBid {
  region: string;
  energy: number;
  price: number;
  hours: number[];
  dates: Date[];
}

// ============================================
// API Response Types
// ============================================

export interface FetchEthPriceResult {
  price: number | undefined;
  error: Error | null;
  isDefault: boolean;
}

// ============================================
// Component Prop Types (Common)
// ============================================

export interface RefetchFunction {
  (): void | Promise<void>;
}

export interface LoadingState {
  isLoading: boolean;
  error?: Error | null;
}
