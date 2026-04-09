"use client";

import "@/styles/globals.css";
import { useState, useEffect } from "react";
import { WagmiProvider, cookieToInitialState } from "wagmi";
import type { AppProps } from "next/app";
import {
  wagmiAdapter,
  wagmiConfig,
  projectId,
  metadata,
  defaultChain,
  novaCidadeMainnet,
} from "@/config";
import { customArbitrumSepolia } from "@/config/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "react-hot-toast";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { ErrorBoundary } from "@/components/ui";
import Head from "next/head";

// ---------------------------------------------------------------------------
// Singleton QueryClient — created once outside the component tree so it
// survives across page navigations and is never recreated on re-render.
// ---------------------------------------------------------------------------
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep fetched data fresh for 30 s before a background refetch fires.
      staleTime: 30_000,
      // Retain unused cache entries for 5 min (prevents re-fetching on rapid
      // back-and-forth navigation).
      gcTime: 5 * 60_000,
      // Automatically retry failed queries up to 2 times with exponential
      // back-off (React Query default). Keeps blockchain RPC hiccups quiet.
      retry: 2,
      // Avoid hammering the RPC when the tab is hidden.
      refetchOnWindowFocus: false,
    },
  },
});

// ---------------------------------------------------------------------------
// AppKit networks & initialization (module scope — runs once)
// ---------------------------------------------------------------------------
const appKitNetworks: [AppKitNetwork, ...AppKitNetwork[]] = [
  novaCidadeMainnet as AppKitNetwork,
  customArbitrumSepolia as AppKitNetwork,
];

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

// ---------------------------------------------------------------------------
// App Root
// ---------------------------------------------------------------------------
export default function App({ Component, pageProps }: AppProps) {
  const initialState = cookieToInitialState(wagmiConfig);

  // Track whether providers have mounted so we can show a brief loading
  // indicator on the very first paint instead of a flash of empty content.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Stable per-page layout getter (supports pages that export getLayout)
  const getLayout =
    (Component as any).getLayout ?? ((page: React.ReactNode) => page);

  return (
    <>
      {/* Viewport & mobile meta — placed here instead of _document to let
          Next.js manage the <meta name="viewport"> tag correctly. */}
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover"
        />
        <title>WattSwap — Community Energy Trading</title>
      </Head>

      <WagmiProvider config={wagmiConfig} initialState={initialState}>
        <QueryClientProvider client={queryClient}>
          <Analytics />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "var(--color-bg-elevated)",
                color: "var(--color-text-primary)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-lg)",
              },
            }}
          />

          {/* Avoid hydration mismatch: render page content only after mount */}
          <ErrorBoundary>
            <div
              style={{
                opacity: mounted ? 1 : 0,
                transition: "opacity 0.15s ease-in",
              }}
            >
              {getLayout(<Component {...pageProps} />)}
            </div>
          </ErrorBoundary>
        </QueryClientProvider>
      </WagmiProvider>
    </>
  );
}
