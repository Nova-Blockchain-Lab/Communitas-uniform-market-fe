/**
 * Wagmi and Reown AppKit configuration
 */

import { http, fallback, cookieStorage, createStorage } from "wagmi";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { novaCidadeMainnet, baseChain, arbitrumSepoliaRpcUrls } from "./chains";
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
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  novaCidadeMainnet as AppKitNetwork,
  baseChain as AppKitNetwork,
];

// Create WagmiAdapter with SSR support
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  ssr: true,
  storage: createStorage({ storage: cookieStorage }) as any,
  transports: {
    // Nova Cidade is a single self-hosted node, so there is no second endpoint to fall
    // back to; a list here would just be the same box twice.
    [novaCidadeMainnet.id]: http(),
    // Keyed endpoint first, public RPC only if it fails.
    [baseChain.id]: fallback(arbitrumSepoliaRpcUrls.map((url) => http(url))),
  },
});

// Export wagmi config from adapter
export const wagmiConfig = wagmiAdapter.wagmiConfig;
