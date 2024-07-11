import { fetchEthPrice } from "@/utils/fetchEthPrice";
import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";

type AppContextType = {
    ethPrice?: number;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [ethPrice, setEthPrice] = useState<number | undefined>(undefined);

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