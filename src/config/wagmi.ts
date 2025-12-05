/**
 * Wagmi and Web3Modal configuration
 */

import { defaultWagmiConfig } from "@web3modal/wagmi";
import { supportedChains } from "./chains";

// Web3Modal project ID
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "";

// Application metadata for Web3Modal
export const metadata = {
  name: "COMMUNITAS Energy Market",
  description: "An Energy Market for the COMMUNITAS community.",
  url: "https://web3modal.com",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// Wagmi configuration
export const wagmiConfig = defaultWagmiConfig({
  chains: supportedChains,
  projectId,
  metadata,
  auth: {
    email: true,
    showWallets: true,
    walletFeatures: true,
  },
  enableCoinbase: true,
  enableInjected: true,
  enableWalletConnect: true,
  enableEIP6963: true,
  coinbasePreference: "all",
});
