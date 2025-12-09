"use client";

import "@/styles/globals.css";
import { WagmiProvider } from "wagmi";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import { wagmiAdapter, projectId, metadata, defaultChain, novaCidadeMainnet } from "@/config";
import { customArbitrumSepolia } from "@/config/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { Analytics } from "@vercel/analytics/react";
import type { AppKitNetwork } from "@reown/appkit/networks";

// Create queryClient outside component to prevent recreation
const queryClient = new QueryClient();

// Define networks for AppKit (needs mutable array)
const appKitNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [
  novaCidadeMainnet as AppKitNetwork,
  customArbitrumSepolia as AppKitNetwork,
];

// Create AppKit modal
if (projectId) {
  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks: appKitNetworks,
    defaultNetwork: defaultChain as AppKitNetwork,
    metadata,
    features: {
      analytics: true,
      email: true,
      socials: ["google", "x", "github", "discord", "apple", "facebook"],
      emailShowWallets: true,
    },
  });
}

export default function App({ Component, pageProps }: AppProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <>
      {ready ? (
        <WagmiProvider config={wagmiAdapter.wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <Analytics />
            <Component {...pageProps} />
          </QueryClientProvider>
        </WagmiProvider>
      ) : null}
    </>
  );
}
