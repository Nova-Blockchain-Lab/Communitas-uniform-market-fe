import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createAppKit } from "@reown/appkit/react";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "react-hot-toast";

import { wagmiAdapter, wagmiConfig, projectId, metadata, networks } from "@/config/wagmi";
import { defaultChain } from "@/config/chains";
import { AppProvider } from "@/context/AppContext";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

if (projectId) {
  createAppKit({
    adapters: [wagmiAdapter],
    projectId,
    networks,
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
  return (
    <>
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover"
        />
        <title>WattSwap | Community Energy Trading</title>
      </Head>

      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
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
            <ErrorBoundary>
              <Component {...pageProps} />
            </ErrorBoundary>
          </AppProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </>
  );
}
