import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { DECIMALS } from "../../constants/config";
import { formatUnits } from "viem";
import { BigNumber } from "ethers";

// Provider cache with optional force refresh
const getProviderForChainCache: {
  [chainId: number]: StaticJsonRpcProvider;
} = {};

function createProviderWithCache(chainId: number, rpcUrl: string): StaticJsonRpcProvider {
  const provider = new StaticJsonRpcProvider(rpcUrl, chainId);
  getProviderForChainCache[chainId] = provider;
  return provider;
}

/**
 * Get or create a cached provider for a chain
 * @param chainId - The chain ID
 * @param rpcUrl - The RPC URL for the chain
 * @param forceRefresh - If true, creates a new provider even if cached
 */
export function getProviderForChainId(
  chainId: number,
  rpcUrl: string,
  forceRefresh: boolean = false
): StaticJsonRpcProvider {
  if (!forceRefresh) {
    const cachedProvider = getProviderForChainCache[chainId];
    if (cachedProvider) {
      return cachedProvider;
    }
  }

  return createProviderWithCache(chainId, rpcUrl);
}

/**
 * Clear provider cache (useful for testing or when RPC URL changes)
 */
export function clearProviderCache(): void {
  Object.keys(getProviderForChainCache).forEach((key) => {
    delete getProviderForChainCache[Number(key)];
  });
}

/**
 * Format a balance with token symbol
 */
export function formatBalance(
  balance: BigInt | bigint | undefined,
  fixedDecimals: number = 4,
  decimals: number = DECIMALS,
  tokenSymbol: string = "ETH"
): string {
  if (!balance) return `0 ${tokenSymbol}`;

  const formattedBalance = formatUnits(BigInt(balance.toString()), decimals);
  const displayBalance = parseFloat(formattedBalance).toFixed(fixedDecimals);

  return `${displayBalance} ${tokenSymbol}`;
}

type TimestampInput = BigNumber | number | string | bigint | null | undefined;

/**
 * Format a timestamp into human-readable relative time
 * @param timestampInput - Unix timestamp (seconds) as BigNumber, number, string, or bigint
 * @returns Human-readable string like "5 minutes" or "2 days"
 */
export function formatTimestamp(timestampInput: TimestampInput): string | undefined {
  if (timestampInput === null || timestampInput === undefined) {
    return undefined;
  }

  let timestampMs: number;

  try {
    if (typeof timestampInput === "bigint") {
      timestampMs = Number(timestampInput) * 1000;
    } else if (typeof timestampInput === "number") {
      timestampMs = timestampInput * 1000;
    } else if (typeof timestampInput === "string") {
      timestampMs = parseInt(timestampInput, 10) * 1000;
    } else if (BigNumber.isBigNumber(timestampInput)) {
      timestampMs = timestampInput.toNumber() * 1000;
    } else {
      // Attempt BigNumber conversion as fallback
      timestampMs = BigNumber.from(timestampInput).toNumber() * 1000;
    }
  } catch {
    return undefined;
  }

  if (isNaN(timestampMs)) {
    return undefined;
  }

  const now = Date.now();
  const diff = Math.abs(now - timestampMs);

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""}`;
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""}`;
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? "s" : ""}`;
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""}`;
  return `${years} year${years !== 1 ? "s" : ""}`;
}

/**
 * Safely parse a number from various input types
 */
export function safeParseNumber(value: string | number | undefined, defaultValue: number = 0): number {
  if (value === undefined || value === "") return defaultValue;
  const parsed = typeof value === "number" ? value : parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}
