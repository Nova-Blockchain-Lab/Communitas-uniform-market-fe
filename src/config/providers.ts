import { StaticJsonRpcProvider } from "@ethersproject/providers";
import { registerCustomArbitrumNetwork } from "@arbitrum/sdk";
import outputInfo from "@/../constants/outputInfo.json";
import { ARBITRUM_SEPOLIA_RPC, baseChain, defaultChain } from "@/config/chains";
import { mapOrbitConfigToOrbitChain } from "@/utils/mapOrbitConfigToOrbitChain";

// Read-only ethers providers for the bridge and NFT flows. The network is static, so
// creating them makes no RPC call. Only modules that bridge import this file.
export const l1Provider = new StaticJsonRpcProvider(ARBITRUM_SEPOLIA_RPC, baseChain.id);
export const l2Provider = new StaticJsonRpcProvider(
  defaultChain.rpcUrls.default.http[0],
  defaultChain.id,
);

// The Arbitrum SDK must know Nova Cidade before any EthBridger or message call.
registerCustomArbitrumNetwork(mapOrbitConfigToOrbitChain(outputInfo));
