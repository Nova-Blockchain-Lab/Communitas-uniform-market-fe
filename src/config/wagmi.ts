/**
 * Wagmi and Reown AppKit configuration
 */

import { http } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { novaCidadeMainnet, customArbitrumSepolia } from "./chains";
import type { AppKitNetwork } from "@reown/appkit/networks";

// Reown project ID (formerly Web3Modal)
export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "";

// Application metadata for AppKit
export const metadata = {
  name: "COMMUNITAS Energy Market",
  description: "An Energy Market for the COMMUNITAS community.",
  url: "https://communitas.energy",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

// Networks for the adapter
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  novaCidadeMainnet as AppKitNetwork,
  customArbitrumSepolia as AppKitNetwork,
];

// Create WagmiAdapter
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  transports: {
    [novaCidadeMainnet.id]: http(),
    [customArbitrumSepolia.id]: http(),
  },
});

// Export wagmi config from adapter
export const wagmiConfig = wagmiAdapter.wagmiConfig;
