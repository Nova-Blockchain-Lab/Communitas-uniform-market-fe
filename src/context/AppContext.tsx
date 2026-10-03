import React, { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type AppContextType = {
  /** EnergyBiddingMarket contract of the selected region */
  energyMarketAddress?: `0x${string}`;
  setEnergyMarketAddress: (address: `0x${string}`) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [energyMarketAddress, setEnergyMarketAddress] = useState<`0x${string}`>();
  const value = useMemo(() => ({ energyMarketAddress, setEnergyMarketAddress }), [energyMarketAddress]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within an AppProvider");
  return context;
};
