/**
 * Application constants
 */

import jsonAddresses from "@/../constants/addresses.json";
import { ContractAddresses } from "@/types";

// Token decimals
export const DECIMALS = 18;

// Bridge confirmation buffer (in minutes)
export const CONFIRMATION_BUFFER_MINUTES = 70;

// Contract addresses loaded from JSON
export const contractAddresses: ContractAddresses = jsonAddresses as ContractAddresses;

// URL builders for external services
export const OPENSEA_URL_CREATOR = (contract: string, tokenId: string) =>
  `https://testnets.opensea.io/assets/arbitrum_sepolia/${contract}/${tokenId}`;

export const ARBITRUM_EXPLORER_URL_CREATOR = (txHash: string) =>
  `https://sepolia.arbiscan.io/tx/${txHash}`;

// API Constants
export const ETH_PRICE_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
export const ETH_PRICE_RETRY_DELAY = 30 * 1000; // 30 seconds
export const MAX_ETH_PRICE_RETRIES = 3;

// Polling intervals
export const STATUS_POLL_INTERVAL = 60 * 1000; // 1 minute

// Bridge wait times
export const BRIDGE_WAIT_TIME_MINUTES = 15;

// Market constants
export const MAX_BID_HOURS = 400;
export const MARKET_CLEARING_DELAY_SECONDS = 3600; // 1 hour
