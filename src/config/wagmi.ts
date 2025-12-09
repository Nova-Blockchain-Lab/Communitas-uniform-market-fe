/**
 * Wagmi and Reown AppKit configuration
 */

import { http } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { supportedChains, novaCidadeMainnet, customArbitrumSepolia } from "./chains";

// Reown project ID (formerly Web3Modal)
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "";

// Application metadata for AppKit
export const metadata = {
  name: "COMMUNITAS Energy Market",
  description: "An Energy Market for the COMMUNITAS community.",
  url: "https://communitas.energy",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// Create Wagmi Adapter for AppKit
export const wagmiAdapter = new WagmiAdapter({
  networks: [...supportedChains],
  projectId,
  ssr: true,
});

// Export wagmi config from adapter
export const wagmiConfig = wagmiAdapter.wagmiConfig;
