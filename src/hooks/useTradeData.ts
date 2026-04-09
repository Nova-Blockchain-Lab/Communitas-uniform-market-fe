import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  createPublicClient,
  http,
  parseAbiItem,
  decodeAbiParameters,
  keccak256,
  type PublicClient,
} from "viem";

import { defaultChain } from "@/config";
import { getTimestampsForDay } from "@/utils/dateHelpers";
import { fetchLogsFromBlockscout, type BlockscoutLog } from "@/utils/blockscoutApi";

export interface Trade {
  hour: bigint;
  buyer: string;
  seller: string;
  amount: bigint;
  clearingPrice: bigint;
}

interface UseTradeDataReturn {
  trades: Trade[];
  isLoading: boolean;
}

const ENERGY_TRADED_EVENT = parseAbiItem(
  "event EnergyTraded(uint256 indexed hour, address indexed buyer, address indexed seller, uint256 amount, uint256 clearingPrice)"
);

const ENERGY_TRADED_TOPIC0 = keccak256(
  new TextEncoder().encode("EnergyTraded(uint256,address,address,uint256,uint256)")
);

// Module-level singleton client — chain config never changes at runtime
const publicClient: PublicClient = createPublicClient({
  chain: defaultChain,
  transport: http(),
});

function parseBlockscoutLog(log: BlockscoutLog): Trade {
  const hour = BigInt(log.topics[1]);
  const buyer = ("0x" + log.topics[2].slice(26)) as string;
  const seller = ("0x" + log.topics[3].slice(26)) as string;

  const [amount, clearingPrice] = decodeAbiParameters(
    [
      { name: "amount", type: "uint256" },
      { name: "clearingPrice", type: "uint256" },
    ],
    log.data as `0x${string}`
  );

  return { hour, buyer, seller, amount, clearingPrice };
}

async function fetchTradesForDay(
  energyMarketAddress: string,
  timestamps: number[]
): Promise<Trade[]> {
  const dayStart = BigInt(timestamps[0]);
  const dayEnd = BigInt(timestamps[timestamps.length - 1]);

  let allTrades: Trade[] = [];
  let usedBlockscout = false;

  try {
    const logs = await fetchLogsFromBlockscout({
      address: energyMarketAddress,
      topic0: ENERGY_TRADED_TOPIC0,
    });

    for (const log of logs) {
      const trade = parseBlockscoutLog(log);
      if (trade.hour >= dayStart && trade.hour <= dayEnd) {
        allTrades.push(trade);
      }
    }

    usedBlockscout = true;
  } catch (blockscoutError) {
    console.warn("Blockscout API failed, falling back to RPC getLogs:", blockscoutError);
  }

  if (!usedBlockscout) {
    const currentBlock = await publicClient.getBlockNumber();
    const secondsAgo = Math.floor(Date.now() / 1000) - timestamps[0];
    const fromBlock = BigInt(Math.max(0, Number(currentBlock) - secondsAgo - 86400));

    const logs = await publicClient.getLogs({
      address: energyMarketAddress as `0x${string}`,
      event: ENERGY_TRADED_EVENT,
      fromBlock,
      toBlock: "latest",
    });

    for (const log of logs) {
      const hour = log.args.hour!;
      if (hour >= dayStart && hour <= dayEnd) {
        allTrades.push({
          hour,
          buyer: log.args.buyer!,
          seller: log.args.seller!,
          amount: log.args.amount!,
          clearingPrice: log.args.clearingPrice!,
        });
      }
    }
  }

  allTrades.sort((a, b) => Number(a.hour) - Number(b.hour));
  return allTrades;
}

const EMPTY_TRADES: Trade[] = [];

export function useTradeData(
  selectedDay: Date,
  energyMarketAddress: string | undefined
): UseTradeDataReturn {
  const timestamps = useMemo(() => getTimestampsForDay(selectedDay), [selectedDay]);

  // Stable query key derived from the day's first timestamp and the contract address
  const queryKey = useMemo(
    () => ["trades", energyMarketAddress, timestamps[0]] as const,
    [energyMarketAddress, timestamps]
  );

  const { data, isLoading } = useQuery<Trade[]>({
    queryKey,
    queryFn: () => fetchTradesForDay(energyMarketAddress!, timestamps),
    enabled: !!energyMarketAddress,
    staleTime: 60_000, // Trades are fresh for 60s
    gcTime: 5 * 60_000, // Keep in cache for 5 min
    refetchInterval: 2 * 60_000, // Auto-refetch every 2 min
    refetchIntervalInBackground: false,
    retry: 2,
  });

  return useMemo(
    () => ({ trades: data ?? EMPTY_TRADES, isLoading }),
    [data, isLoading]
  );
}
