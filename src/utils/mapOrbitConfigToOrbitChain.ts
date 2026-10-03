import type { ArbitrumNetwork } from "@arbitrum/sdk";
import type outputInfo from "@/../constants/outputInfo.json";

/** Build the Arbitrum SDK network entry for Nova Cidade from constants/outputInfo.json. */
export const mapOrbitConfigToOrbitChain = (data: typeof outputInfo): ArbitrumNetwork => ({
    chainId: data.chainInfo.chainId,
    // Read once from the rollup contract on Arbitrum Sepolia (it is 150) and stored in
    // outputInfo.json, so registering the chain needs no network call.
    confirmPeriodBlocks: data.chainInfo.confirmPeriodBlocks,
    ethBridge: {
        bridge: data.coreContracts.bridge,
        inbox: data.coreContracts.inbox,
        outbox: data.coreContracts.outbox,
        rollup: data.coreContracts.rollup,
        sequencerInbox: data.coreContracts.sequencerInbox,
    },
    isCustom: true,
    isTestnet: false,
    name: data.chainInfo.chainName,
    parentChainId: data.chainInfo.parentChainId,
    nativeToken: data.chainInfo.nativeToken,
    tokenBridge: {
        parentCustomGateway: data.tokenBridgeContracts.l2Contracts.customGateway,
        parentErc20Gateway: data.tokenBridgeContracts.l2Contracts.standardGateway,
        parentGatewayRouter: data.tokenBridgeContracts.l2Contracts.router,
        parentMultiCall: data.tokenBridgeContracts.l2Contracts.multicall,
        parentProxyAdmin: data.tokenBridgeContracts.l2Contracts.proxyAdmin,
        parentWeth: data.tokenBridgeContracts.l2Contracts.weth,
        parentWethGateway: data.tokenBridgeContracts.l2Contracts.wethGateway,
        childCustomGateway: data.tokenBridgeContracts.l3Contracts.customGateway,
        childErc20Gateway: data.tokenBridgeContracts.l3Contracts.standardGateway,
        childGatewayRouter: data.tokenBridgeContracts.l3Contracts.router,
        childMultiCall: data.tokenBridgeContracts.l3Contracts.multicall,
        childProxyAdmin: data.tokenBridgeContracts.l3Contracts.proxyAdmin,
        childWeth: data.tokenBridgeContracts.l3Contracts.weth,
        childWethGateway: data.tokenBridgeContracts.l3Contracts.wethGateway,
    },
});
