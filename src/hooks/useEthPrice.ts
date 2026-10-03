import { useQuery } from "@tanstack/react-query";

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=eur";

async function fetchEthPrice(): Promise<number> {
  const res = await fetch(COINGECKO_URL, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
  const price = (await res.json())?.ethereum?.eur;
  if (typeof price !== "number") throw new Error("Invalid ETH price response");
  return price;
}

/** ETH price in EUR, refreshed every 5 minutes. Undefined until the first fetch succeeds. */
export function useEthPrice(): number | undefined {
  return useQuery({
    queryKey: ["ethPrice"],
    queryFn: fetchEthPrice,
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
    retry: 3,
    retryDelay: 30_000,
  }).data;
}
