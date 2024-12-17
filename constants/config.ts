import { arbitrumSepolia } from "wagmi/chains";
import { defaultWagmiConfig } from "@web3modal/wagmi";
import jsonAddresses from "./addresses.json";
import { defineChain } from 'viem'

export const DECIMALS = 18;

export const communitasMainnet = defineChain({
  id: 99436914197,
  name: 'Communitas',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['http://localhost:8449'] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'http://localhost' },
  }
})

export const defaultChain = communitasMainnet;

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
  chains: [defaultChain,arbitrumSepolia],
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