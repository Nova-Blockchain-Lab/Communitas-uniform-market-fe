import {StaticJsonRpcProvider} from '@ethersproject/providers'

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

