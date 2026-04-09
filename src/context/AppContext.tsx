import { fetchEthPrice } from "@/utils/fetchEthPrice";
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { StaticJsonRpcProvider } from "@ethersproject/providers";
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
  const [ethPrice, setEthPrice] = useState<number | undefined>(undefined);
  const [energyMarketAddress, setEnergyMarketAddress] = useState<`0x${string}` | undefined>(undefined);
  const [l1Provider, setL1Provider] = useState<StaticJsonRpcProvider | undefined>(undefined);
  const [l2Provider, setL2Provider] = useState<StaticJsonRpcProvider | undefined>(undefined);
  const [isProvidersReady, setIsProvidersReady] = useState(false);

  // Ref to track initialization state and prevent race conditions
  const isInitializingProviders = useRef(false);
  const isOrbitRegistered = useRef(false);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initializeProviders = useCallback(() => {
    if (isInitializingProviders.current) return;
    isInitializingProviders.current = true;

    try {
      const l1chain = wagmiConfig.chains.filter((c: { id: number }) => c.id !== defaultChain.id)[0];
      const newL1Provider = getProviderForChainId(l1chain.id, process.env.NEXT_PUBLIC_INFURA_RPC!);
      const newL2Provider = getProviderForChainId(defaultChain.id, defaultChain.rpcUrls.default.http[0]);
      setL1Provider(newL1Provider);
      setL2Provider(newL2Provider);
      setIsProvidersReady(true);
    } catch (error) {
      console.error("Failed to initialize providers:", error);
      setIsProvidersReady(false);
    } finally {
      isInitializingProviders.current = false;
    }
  }, []);

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
          retryTimeoutRef.current = setTimeout(fetchPriceWithRetry, ETH_PRICE_RETRY_DELAY);
        }
      } catch (error) {
        if (isMounted && retryCount < MAX_ETH_PRICE_RETRIES) {
          retryCount++;
          retryTimeoutRef.current = setTimeout(fetchPriceWithRetry, ETH_PRICE_RETRY_DELAY);
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
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [registerCustomOrbitChainOnSDK]);

  // Initialize read-only providers on mount using known RPC URLs
  useEffect(() => {
    initializeProviders();
  }, [initializeProviders]);

  // Stable callback reference for setEnergyMarketAddress
  const handleSetEnergyMarketAddress = useCallback((address: `0x${string}`) => {
    setEnergyMarketAddress(address);
  }, []);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo<AppContextType>(
    () => ({
      ethPrice,
      energyMarketAddress,
      setEnergyMarketAddress: handleSetEnergyMarketAddress,
      l1Provider,
      l2Provider,
      isProvidersReady,
    }),
    [ethPrice, energyMarketAddress, handleSetEnergyMarketAddress, l1Provider, l2Provider, isProvidersReady]
  );

  return (
    <AppContext.Provider value={contextValue}>
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
