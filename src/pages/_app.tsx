"use client";

import "@/styles/globals.css";
import { WagmiProvider, cookieToInitialState } from "wagmi";
import type { AppProps } from "next/app";
import { wagmiAdapter, wagmiConfig, projectId, metadata, defaultChain, novaCidadeMainnet } from "@/config";
import { customArbitrumSepolia } from "@/config/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "react-hot-toast";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { ErrorBoundary } from "@/components/ui";

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
    adapters: [wagmiAdapter as any],
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
  const initialState = cookieToInitialState(wagmiConfig);

  return (
    <WagmiProvider config={wagmiConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <Analytics />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--color-bg-elevated)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-lg)',
            },
          }}
        />
        <ErrorBoundary>
          <Component {...pageProps} />
        </ErrorBoundary>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
