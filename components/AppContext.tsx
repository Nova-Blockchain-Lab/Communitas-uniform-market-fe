import { fetchEthPrice } from "@/utils/fetchEthPrice";
import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";

type AppContextType = {
    ethPrice?: number;
    energyMarketAddress?: `0x${string}`;
    setEnergyMarketAddress: (address: `0x${string}`) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [ethPrice, setEthPrice] = useState<number | undefined>(undefined);

    const [energyMarketAddress, setEnergyMarketAddress] = useState<`0x${string}` | undefined>(undefined);

    useEffect(() => {
        const fetchPrice = async () => {
          const price = await fetchEthPrice();
          setEthPrice(price);
        };
    
        fetchPrice();
      }, []);
  
    return (
      <AppContext.Provider
        value={{
            ethPrice,
            energyMarketAddress,
            setEnergyMarketAddress
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