/**
 * Legacy config file - Main config is in src/config/
 * This file is kept for reference but the active config is in src/config/
 */

import { arbitrumSepolia } from "wagmi/chains";
import jsonAddresses from "./addresses.json";
import outputInfo from "./outputInfo.json";
import { defineChain } from "viem";

export const DECIMALS = 18;

export const CONFIRMATION_BUFFER_MINUTES = 70;

export const novaCidadeMainnet = defineChain({
  id: outputInfo.chainInfo.chainId,
  name: outputInfo.chainInfo.chainName,
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [outputInfo.chainInfo.rpcUrl] },
  },
  blockExplorers: {
    default: { name: "Blockscout", url: outputInfo.chainInfo.explorerUrl },
  },
});

export const defaultChain = novaCidadeMainnet;
export const baseChain = arbitrumSepolia;

export type EthereumAddress = `0x${string}`;

interface ContractAddresses {
  [chainId: string]: {
    [contractName: string]: {
      [country: string]: EthereumAddress;
    };
  };
}

export const contractAddresses: ContractAddresses = jsonAddresses as ContractAddresses;

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "";

export const metadata = {
  name: "COMMUNITAS Energy Market",
  description: "A Energy Market for the COMMUNITAS community.",
  url: "https://communitas.energy",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

export const OPENSEA_URL_CREATOR = (contract: string, tokenId: string) =>
  `https://testnets.opensea.io/assets/arbitrum_sepolia/${contract}/${tokenId}`;
export const ARBITRUM_EXPLORER_URL_CREATOR = (txHash: string) =>
  `https://sepolia.arbiscan.io/tx/${txHash}`;
