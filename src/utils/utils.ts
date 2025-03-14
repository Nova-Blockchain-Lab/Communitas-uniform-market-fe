import {StaticJsonRpcProvider} from '@ethersproject/providers'
import {DECIMALS} from "../../constants/config";
import {formatUnits} from "viem";
import {BigNumber} from "ethers";

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

export function formatBalance(balance: BigInt | bigint | undefined, fixedDecimals: number = 4, decimals: number = DECIMALS, tokenSymbol: string = 'ETH'): string {
    if (!balance) return `0 ${tokenSymbol}`;

    const formattedBalance = formatUnits(BigInt(balance.toString()), decimals);

    const displayBalance = parseFloat(formattedBalance).toFixed(fixedDecimals);

    return `${displayBalance} ${tokenSymbol}`;
}

export function formatTimestamp(bigNumberTimestamp: any) {
    if (!bigNumberTimestamp) return;
    const timestamp = BigNumber.from(bigNumberTimestamp).toNumber() * 1000;
    const now = Date.now();
    const diff = Math.abs(now - timestamp);

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return "just now";
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""}`;
    if (days < 7) return `${days} day${days !== 1 ? "s" : ""}`;
    if (weeks < 4) return `${weeks} week${weeks !== 1 ? "s" : ""}`;
    if (months < 12) return `${months} month${months !== 1 ? "s" : ""}`;
    return `${years} year${years !== 1 ? "s" : ""}`;
}