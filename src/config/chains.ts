/**
 * Chain configuration for the application
 */

import { arbitrumSepolia } from "wagmi/chains";
import { defineChain } from "viem";
import outputInfo from "@/../constants/outputInfo.json";

// Nova Cidade (L2/L3) chain definition
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

// Default chain is Nova Cidade (L2/L3)
export const defaultChain = novaCidadeMainnet;

// Custom Arbitrum Sepolia with your Alchemy RPC
const customRpcUrl = process.env.NEXT_PUBLIC_INFURA_RPC;

export const customArbitrumSepolia = customRpcUrl
  ? defineChain({
      ...arbitrumSepolia,
      rpcUrls: {
        default: { http: [customRpcUrl] },
      },
    })
  : arbitrumSepolia;

// Base chain is Arbitrum Sepolia (L1/L2)
export const baseChain = customArbitrumSepolia;

// All supported chains
export const supportedChains = [defaultChain, customArbitrumSepolia] as const;
