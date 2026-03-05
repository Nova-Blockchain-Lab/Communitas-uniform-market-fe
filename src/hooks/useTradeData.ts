import { useState, useEffect, useCallback, useMemo } from "react";
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

const ENERGY_TRADED_EVENT = parseAbiItem(
  "event EnergyTraded(uint256 indexed hour, address indexed buyer, address indexed seller, uint256 amount, uint256 clearingPrice)"
);

export function useTradeData(selectedDay: Date, energyMarketAddress: string | undefined) {
  const client = useMemo<PublicClient>(
    () =>
      createPublicClient({
        chain: defaultChain,
        transport: http(),
      }),
    []
  );

  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTrades = useCallback(async () => {
    if (!energyMarketAddress) return;

    const timestamps = getTimestampsForDay(selectedDay);
    const dayStart = BigInt(timestamps[0]);
    const dayEnd = BigInt(timestamps[timestamps.length - 1]);

    setIsLoading(true);
    try {
      const topic0 = keccak256(
        new TextEncoder().encode("EnergyTraded(uint256,address,address,uint256,uint256)")
      );

      let allTrades: Trade[] = [];
      let usedBlockscout = false;

      try {
        const logs = await fetchLogsFromBlockscout({
          address: energyMarketAddress,
          topic0,
        });

        for (const log of logs) {
          const hour = BigInt(log.topics[1]);
          if (hour < dayStart || hour > dayEnd) continue;

          const buyer = ("0x" + log.topics[2].slice(26)) as string;
          const seller = ("0x" + log.topics[3].slice(26)) as string;

          const [amount, clearingPrice] = decodeAbiParameters(
            [
              { name: "amount", type: "uint256" },
              { name: "clearingPrice", type: "uint256" },
            ],
            log.data as `0x${string}`
          );

          allTrades.push({ hour, buyer, seller, amount, clearingPrice });
        }

        usedBlockscout = true;
      } catch (blockscoutError) {
        console.warn("Blockscout API failed, falling back to RPC getLogs:", blockscoutError);
      }

      if (!usedBlockscout) {
        const currentBlock = await client.getBlockNumber();
        const secondsAgo = Math.floor(Date.now() / 1000) - timestamps[0];
        const fromBlock = BigInt(Math.max(0, Number(currentBlock) - secondsAgo - 86400));

        const logs = await client.getLogs({
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
      setTrades(allTrades);
    } catch (error) {
      console.error("Failed to fetch trades:", error);
      setTrades([]);
    } finally {
      setIsLoading(false);
    }
  }, [client, energyMarketAddress, selectedDay]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  return { trades, isLoading };
}
