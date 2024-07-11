import React, { createContext, useState, useContext, ReactNode } from "react";

type AppContextType = {
    ethPrice: number;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [ethPrice, setEthPrice] = useState<number>(0);
  
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