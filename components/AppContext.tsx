import {fetchEthPrice} from "@/utils/fetchEthPrice";
import React, {createContext, ReactNode, useContext, useEffect, useState} from "react";
import {StaticJsonRpcProvider} from "@ethersproject/providers";
import {useAccount} from "wagmi";
import {config, defaultChain} from "../constants/config";
import {mapOrbitConfigToOrbitChain} from "@/utils/mapOrbitConfigToOrbitChain";
import {registerCustomArbitrumNetwork} from "@arbitrum/sdk";
import outputInfo from "../constants/outputInfo.json"
import {getProviderForChainId} from "@/utils/utils";

type AppContextType = {
    ethPrice?: number;
    energyMarketAddress?: `0x${string}`;
    setEnergyMarketAddress: (address: `0x${string}`) => void;
    l1Provider?: StaticJsonRpcProvider;
    l2Provider?: StaticJsonRpcProvider;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({children}) => {
    const {chain} = useAccount()

    const [ethPrice, setEthPrice] = useState<number | undefined>(undefined);

    const [energyMarketAddress, setEnergyMarketAddress] = useState<`0x${string}` | undefined>(undefined);

    const [l1Provider, setL1Provider] = useState<StaticJsonRpcProvider | undefined>(undefined);
    const [l2Provider, setL2Provider] = useState<StaticJsonRpcProvider | undefined>(undefined);

    const setProvidersWhenConnectedToParentChain = () => {
        if (l1Provider || l2Provider) return;
        setL1Provider(getProviderForChainId(chain!.id, "https://arbitrum-sepolia.infura.io/v3/cf29898319594df799ef861b6dab7198"))
        setL2Provider(getProviderForChainId(defaultChain.id, defaultChain.rpcUrls.default.http[0]))
    }

    const setProvidersWhenConnectedToChildChain = () => {
        if (l1Provider || l2Provider) return;
        const l1chain = config.chains.filter((c) => c.id !== defaultChain.id)[0]
        setL1Provider(getProviderForChainId(l1chain.id, "https://arbitrum-sepolia.infura.io/v3/cf29898319594df799ef861b6dab7198"))
        setL2Provider(getProviderForChainId(chain!.id, chain!.rpcUrls.default.http[0]))
    }

    const registerCustomOrbitChainOnSDK = async () => {
        const orbitChain = await mapOrbitConfigToOrbitChain(outputInfo)
        registerCustomArbitrumNetwork(orbitChain)
    }

    useEffect(() => {
        const fetchPrice = async () => {
            const price = await fetchEthPrice();
            setEthPrice(price);
        };

        fetchPrice();
        registerCustomOrbitChainOnSDK()
    }, []);

    useEffect(() => {
        if (chain && chain.id === defaultChain.id) {
            setProvidersWhenConnectedToChildChain();
        } else if (chain && config.chains.some((c) => c.id === chain.id)) {
            setProvidersWhenConnectedToParentChain()
        } else {
            setL1Provider(undefined);
            setL2Provider(undefined);
        }
    }, [chain]);

    return (
        <AppContext.Provider
            value={{
                ethPrice,
                energyMarketAddress,
                setEnergyMarketAddress,
                l1Provider,
                l2Provider
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