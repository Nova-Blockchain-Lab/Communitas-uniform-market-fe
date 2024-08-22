import "@/styles/globals.css";
import { WagmiProvider } from "wagmi";
import type { AppProps } from "next/app";
import { useEffect, useState } from "react";
import { config, projectId } from "../../constants/config";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import { Analytics } from "@vercel/analytics/react"

createWeb3Modal({
  wagmiConfig: config,
  defaultChain: config.chains[0],
  projectId,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
  enableOnramp: true, // Optional - false as default
});



const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  const [ready, setReady] = useState(false);

  const theme = extendTheme({
    styles: {
      global: () => ({
        body: {
          bg: "",
        },
      }),
    },
  });

  useEffect(() => {
    setReady(true);
  }, []);
  return (
    <>
      {ready ? (
        <ChakraProvider theme={theme}>
          <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
              <Analytics/>
              <Component {...pageProps} />
            </QueryClientProvider>
          </WagmiProvider>
        </ChakraProvider>
      ) : null}
    </>
  );
}
