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

// Public Arbitrum Sepolia RPC. Heavily rate-limited per IP (a NATted campus shares one),
// so it is only ever a backup behind the keyed endpoint — never the primary.
export const ARBITRUM_SEPOLIA_PUBLIC_RPC = "https://sepolia-rollup.arbitrum.io/rpc";

// Keyed Arbitrum Sepolia endpoint for browser reads. NEXT_PUBLIC_ means it ships in the
// client bundle, so it must hold a key restricted by domain allowlist. Unset: public RPC.
const keyedRpc = process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL;
export const ARBITRUM_SEPOLIA_RPC = keyedRpc || ARBITRUM_SEPOLIA_PUBLIC_RPC;
export const arbitrumSepoliaRpcUrls = keyedRpc
  ? [keyedRpc, ARBITRUM_SEPOLIA_PUBLIC_RPC]
  : [ARBITRUM_SEPOLIA_PUBLIC_RPC];

// Stock chain on purpose: AppKit and wagmi hand `rpcUrls.default` to the wallet in
// wallet_addEthereumChain, and a domain-restricted key fails from a wallet. The keyed URL
// is used only through the wagmi transport and AppContext's providers.
export const baseChain = arbitrumSepolia;
