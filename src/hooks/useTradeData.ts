import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createPublicClient, decodeEventLog, http, parseAbiItem, toEventSelector } from "viem";

import { defaultChain } from "@/config/chains";
import { getTimestampsForDay } from "@/utils/dateHelpers";
import { fetchBlockByTime, fetchLogsFromBlockscout, type BlockscoutLog } from "@/utils/blockscoutApi";

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

const ENERGY_TRADED_TOPIC0 = toEventSelector(ENERGY_TRADED_EVENT);

// Query past the day's end, since an hour's trades are logged when it clears (max lag seen 1.1 h)
const CLEARING_MARGIN_S = 6 * 3600;

// Reads without a wallet, so it has its own client
const publicClient = createPublicClient({ chain: defaultChain, transport: http() });

function parseBlockscoutLog(log: BlockscoutLog): Trade {
  const { args } = decodeEventLog({
    abi: [ENERGY_TRADED_EVENT],
    data: log.data as `0x${string}`,
    topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
  });
  return args;
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
    // Blockscout's getLogs returns at most 1000 logs, oldest first, so the query must be
    // bounded to the day. EnergyTraded is emitted when an hour clears.
    const [fromBlock, toBlock] = await Promise.all([
      fetchBlockByTime(timestamps[0], "before"),
      fetchBlockByTime(timestamps[timestamps.length - 1] + 3600 + CLEARING_MARGIN_S, "after"),
    ]);
    const logs = await fetchLogsFromBlockscout({
      address: energyMarketAddress,
      topic0: ENERGY_TRADED_TOPIC0,
      fromBlock,
      toBlock,
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
    // Nova Cidade only makes blocks on activity, so a block number cannot be derived from a
    // time without an indexer. The RPC has no log cap, so scan from genesis and filter below.
    const logs = await publicClient.getLogs({
      address: energyMarketAddress as `0x${string}`,
      event: ENERGY_TRADED_EVENT,
      fromBlock: 0n,
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
