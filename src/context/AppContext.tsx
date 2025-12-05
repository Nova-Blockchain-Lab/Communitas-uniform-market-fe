import { fetchEthPrice } from "@/utils/fetchEthPrice";
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { useAccount } from "wagmi";
import { wagmiConfig, defaultChain } from "@/config";
import { mapOrbitConfigToOrbitChain } from "@/utils/mapOrbitConfigToOrbitChain";
import { registerCustomArbitrumNetwork } from "@arbitrum/sdk";
import outputInfo from "@/../constants/outputInfo.json";
import { getProviderForChainId } from "@/utils/utils";

// Constants
const ETH_PRICE_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const ETH_PRICE_RETRY_DELAY = 30 * 1000; // 30 seconds
const MAX_ETH_PRICE_RETRIES = 3;

type AppContextType = {
  ethPrice?: number;
  energyMarketAddress?: `0x${string}`;
  setEnergyMarketAddress: (address: `0x${string}`) => void;
  l1Provider?: StaticJsonRpcProvider;
  l2Provider?: StaticJsonRpcProvider;
  isProvidersReady: boolean;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { chain } = useAccount();

  const [ethPrice, setEthPrice] = useState<number | undefined>(undefined);
  const [energyMarketAddress, setEnergyMarketAddress] = useState<`0x${string}` | undefined>(undefined);
  const [l1Provider, setL1Provider] = useState<StaticJsonRpcProvider | undefined>(undefined);
  const [l2Provider, setL2Provider] = useState<StaticJsonRpcProvider | undefined>(undefined);
  const [isProvidersReady, setIsProvidersReady] = useState(false);

  // Ref to track initialization state and prevent race conditions
  const isInitializingProviders = useRef(false);
  const isOrbitRegistered = useRef(false);

  const setProvidersWhenConnectedToParentChain = useCallback(() => {
    if (isInitializingProviders.current) return;
    isInitializingProviders.current = true;

    try {
      const newL1Provider = getProviderForChainId(chain!.id, process.env.NEXT_PUBLIC_INFURA_RPC!);
      const newL2Provider = getProviderForChainId(defaultChain.id, defaultChain.rpcUrls.default.http[0]);
      setL1Provider(newL1Provider);
      setL2Provider(newL2Provider);
      setIsProvidersReady(true);
    } catch (error) {
      console.error("Failed to set providers for parent chain:", error);
      setIsProvidersReady(false);
    } finally {
      isInitializingProviders.current = false;
    }
  }, [chain]);

  const setProvidersWhenConnectedToChildChain = useCallback(() => {
    if (isInitializingProviders.current) return;
    isInitializingProviders.current = true;

    try {
      const l1chain = wagmiConfig.chains.filter((c) => c.id !== defaultChain.id)[0];
      const newL1Provider = getProviderForChainId(l1chain.id, process.env.NEXT_PUBLIC_INFURA_RPC!);
      const newL2Provider = getProviderForChainId(chain!.id, chain!.rpcUrls.default.http[0]);
      setL1Provider(newL1Provider);
      setL2Provider(newL2Provider);
      setIsProvidersReady(true);
    } catch (error) {
      console.error("Failed to set providers for child chain:", error);
      setIsProvidersReady(false);
    } finally {
      isInitializingProviders.current = false;
    }
  }, [chain]);

  const registerCustomOrbitChainOnSDK = useCallback(async () => {
    if (isOrbitRegistered.current) return;

    try {
      const orbitChain = await mapOrbitConfigToOrbitChain(outputInfo);
      registerCustomArbitrumNetwork(orbitChain);
      isOrbitRegistered.current = true;
    } catch (error) {
      console.error("Failed to register custom Orbit chain:", error);
    }
  }, []);

  // Fetch ETH price with retry logic
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;

    const fetchPriceWithRetry = async () => {
      if (!isMounted) return;

      try {
        const price = await fetchEthPrice();
        if (isMounted && price !== undefined) {
          setEthPrice(price);
          retryCount = 0; // Reset retry count on success
        } else if (isMounted && retryCount < MAX_ETH_PRICE_RETRIES) {
          retryCount++;
          setTimeout(fetchPriceWithRetry, ETH_PRICE_RETRY_DELAY);
        }
      } catch (error) {
        if (isMounted && retryCount < MAX_ETH_PRICE_RETRIES) {
          retryCount++;
          setTimeout(fetchPriceWithRetry, ETH_PRICE_RETRY_DELAY);
        }
      }
    };

    fetchPriceWithRetry();
    registerCustomOrbitChainOnSDK();

    // Refresh price periodically
    const priceInterval = setInterval(fetchPriceWithRetry, ETH_PRICE_REFRESH_INTERVAL);

    return () => {
      isMounted = false;
      clearInterval(priceInterval);
    };
  }, [registerCustomOrbitChainOnSDK]);

  // Setup providers based on chain
  useEffect(() => {
    if (!chain) {
      setL1Provider(undefined);
      setL2Provider(undefined);
      setIsProvidersReady(false);
      return;
    }

    if (chain.id === defaultChain.id) {
      setProvidersWhenConnectedToChildChain();
    } else if (wagmiConfig.chains.some((c) => c.id === chain.id)) {
      setProvidersWhenConnectedToParentChain();
    } else {
      setL1Provider(undefined);
      setL2Provider(undefined);
      setIsProvidersReady(false);
    }

    // Cleanup on chain change
    return () => {
      isInitializingProviders.current = false;
    };
  }, [chain, setProvidersWhenConnectedToChildChain, setProvidersWhenConnectedToParentChain]);

  return (
    <AppContext.Provider
      value={{
        ethPrice,
        energyMarketAddress,
        setEnergyMarketAddress,
        l1Provider,
        l2Provider,
        isProvidersReady,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
