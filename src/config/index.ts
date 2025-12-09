/**
 * Config barrel export
 * Re-exports all configuration for convenient imports
 */

// Chain configuration
export { novaCidadeMainnet, defaultChain, baseChain, supportedChains } from "./chains";

// Wagmi configuration
export { projectId, metadata, wagmiConfig, wagmiAdapter } from "./wagmi";

// Constants
export {
  DECIMALS,
  CONFIRMATION_BUFFER_MINUTES,
  contractAddresses,
  OPENSEA_URL_CREATOR,
  ARBITRUM_EXPLORER_URL_CREATOR,
  ETH_PRICE_REFRESH_INTERVAL,
  ETH_PRICE_RETRY_DELAY,
  MAX_ETH_PRICE_RETRIES,
  STATUS_POLL_INTERVAL,
  BRIDGE_WAIT_TIME_MINUTES,
  MAX_BID_HOURS,
  MARKET_CLEARING_DELAY_SECONDS,
} from "./constants";
