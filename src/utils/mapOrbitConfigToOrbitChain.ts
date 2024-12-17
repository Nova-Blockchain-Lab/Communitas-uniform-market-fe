import { RollupAdminLogic__factory } from '@arbitrum/sdk/dist/lib/abi/factories/RollupAdminLogic__factory'
import { StaticJsonRpcProvider } from '@ethersproject/providers'
import {ArbitrumNetwork} from "@arbitrum/sdk";


type OrbitConfig = {
    chainInfo: {
        chainName: string
        chainId: number
        parentChainId: number
        rpcUrl: string
        explorerUrl: string
        nativeToken?: string
    }
    coreContracts: {
        rollup: string
        inbox: string
        outbox: string
        sequencerInbox: string
        bridge: string
    }
    tokenBridgeContracts: {
        l2Contracts: Contracts
        l3Contracts: Contracts
    }
}

type Contracts = {
    customGateway: string
    multicall: string
    proxyAdmin: string
    router: string
    standardGateway: string
    weth: string
    wethGateway: string
}


export const mapOrbitConfigToOrbitChain = async (
    data: OrbitConfig
): Promise<ArbitrumNetwork> => {
    const rollup = RollupAdminLogic__factory.connect(
        data.coreContracts.rollup,
        new StaticJsonRpcProvider(process.env.L1RPC ?? "https://sepolia-rollup.arbitrum.io/rpc", data.chainInfo.parentChainId)
    )
    const confirmPeriodBlocks =
        (await rollup.confirmPeriodBlocks()).toNumber() ?? 150

    return {
        chainId: data.chainInfo.chainId,
        confirmPeriodBlocks,
        ethBridge: {
            bridge: data.coreContracts.bridge,
            inbox: data.coreContracts.inbox,
            outbox: data.coreContracts.outbox,
            rollup: data.coreContracts.rollup,
            sequencerInbox: data.coreContracts.sequencerInbox
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
            childWethGateway: data.tokenBridgeContracts.l3Contracts.wethGateway
        }
    }
}