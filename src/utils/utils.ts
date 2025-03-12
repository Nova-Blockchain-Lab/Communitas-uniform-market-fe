import {StaticJsonRpcProvider} from '@ethersproject/providers'
import {DECIMALS} from "../../constants/config";
import {formatUnits} from "viem";

const getProviderForChainCache: {
    [chainId: number]: StaticJsonRpcProvider
} = {
    // start with empty cache
}

function createProviderWithCache(chainId: number, rpcUrl: string) {
    const provider = new StaticJsonRpcProvider(rpcUrl, chainId)
    getProviderForChainCache[chainId] = provider
    return provider
}

export function getProviderForChainId(chainId: number, rpcUrl: string): StaticJsonRpcProvider {
    const cachedProvider = getProviderForChainCache[chainId]

    if (typeof cachedProvider !== 'undefined') {
        return cachedProvider
    }

    return createProviderWithCache(chainId, rpcUrl)
}

export function formatBalance(balance: BigInt | bigint | undefined, decimals: number = DECIMALS, tokenSymbol: string = 'ETH'): string {
    if (!balance) return `0 ${tokenSymbol}`;

    const formattedBalance = formatUnits(BigInt(balance.toString()), decimals);

    const displayBalance = parseFloat(formattedBalance).toFixed(4);

    return `${displayBalance} ${tokenSymbol}`;
}

