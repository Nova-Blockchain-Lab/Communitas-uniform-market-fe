import {arbitrumSepolia} from "wagmi/chains";
import {defaultWagmiConfig} from "@web3modal/wagmi";
import jsonAddresses from "./addresses.json";
import outputInfo from "./outputInfo.json"
import {defineChain} from 'viem'

export const DECIMALS = 18;

export const CONFIRMATION_BUFFER_MINUTES = 70

export const novaCidadeMainnet = defineChain({
    id: outputInfo.chainInfo.chainId,
    name: outputInfo.chainInfo.chainName,
    nativeCurrency: {name: 'Ether', symbol: 'ETH', decimals: 18},
    rpcUrls: {
        default: {http: [outputInfo.chainInfo.rpcUrl]},
    },
    blockExplorers: {
        default: {name: 'Blockscout', url: outputInfo.chainInfo.explorerUrl},
    }
})

export const defaultChain = novaCidadeMainnet;
export const baseChain = arbitrumSepolia

export type EthereumAddress = `0x${string}`;

interface ContractAddresses {
    [chainId: string]: {
        [contractName: string]: {
            [country: string]: EthereumAddress;
        }
    };
}

export const contractAddresses: ContractAddresses = jsonAddresses as ContractAddresses;

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "";

export const metadata = {
    name: "COMMUNITAS Energy Market",
    description: "A Energy Market for the COMMUNITAS community.",
    url: "https://web3modal.com",
    icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

export const config = defaultWagmiConfig({
    chains: [defaultChain, arbitrumSepolia],
    projectId,
    metadata,
    auth: {
        email: true,
        showWallets: true,
        walletFeatures: true,
    },
    enableCoinbase: true,
    enableInjected: true,
    enableWalletConnect: true,
    enableEIP6963: true,
    coinbasePreference: "all",
});

export const OPENSEA_URL_CREATOR = (contract: string, tokenId: string) => `https://testnets.opensea.io/assets/arbitrum_sepolia/${contract}/${tokenId}`