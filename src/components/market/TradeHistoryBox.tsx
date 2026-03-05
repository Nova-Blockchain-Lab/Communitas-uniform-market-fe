import React, { useEffect, useState, useCallback, useMemo } from "react";
import { ArrowLeftRight, TrendingUp, BarChart3 } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { motion } from "motion/react";
import { SkeletonBlock, SkeletonLine } from "@/components/ui";
import {
  createPublicClient,
  http,
  parseAbiItem,
  decodeAbiParameters,
  keccak256,
  type PublicClient,
} from "viem";

import { defaultChain } from "@/config";
import { useAppContext } from "@/context/AppContext";
import DateNavigationBar from "@/components/common/DateNavigationBar";
import { Card, CardHeader, EmptyState } from "@/components/ui";
import { wattsToKWh, pricePerWattToPerKWh } from "@/utils/units";
import { getTimestampsForDay, formatTime, truncateAddress } from "@/utils/dateHelpers";
import { fetchLogsFromBlockscout, type BlockscoutLog } from "@/utils/blockscoutApi";

interface Trade {
  hour: bigint;
  buyer: string;
  seller: string;
  amount: bigint;
  clearingPrice: bigint;
}

const ENERGY_TRADED_EVENT = parseAbiItem(
  "event EnergyTraded(uint256 indexed hour, address indexed buyer, address indexed seller, uint256 amount, uint256 clearingPrice)"
);

const TradeItem: React.FC<{
  trade: Trade;
  ethPrice?: number;
}> = ({ trade, ethPrice }) => {
  const pricePerKwh = pricePerWattToPerKWh(trade.clearingPrice);
  const totalValue = pricePerKwh * wattsToKWh(trade.amount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
      <div
        className="pl-4 pr-4 py-3 ml-1 bg-gradient-to-r from-indigo-500/10 to-transparent border border-l-0 rounded-r-xl border-indigo-500/20"
      >
        {/* Header - responsive: stacks on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <div className="flex items-center gap-3 flex-wrap">
            <ArrowLeftRight size={14} className="text-indigo-400 hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Buyer</span>
              <span className="text-xs text-blue-400 font-mono">{truncateAddress(trade.buyer)}</span>
            </div>
            <span className="text-xs text-gray-600 hidden sm:inline">&rarr;</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Seller</span>
              <span className="text-xs text-emerald-400 font-mono">{truncateAddress(trade.seller)}</span>
            </div>
          </div>
          <span className="text-xs text-gray-500">{formatTime(Number(trade.hour))}</span>
        </div>

        {/* Data grid - stacks vertically on mobile, horizontal on sm+ */}
        <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-4">
          <div className="flex justify-between sm:block">
            <p className="text-xs text-gray-500 mb-0.5">Amount</p>
            <p className="text-sm font-semibold text-indigo-400">
              {wattsToKWh(trade.amount).toFixed(2)} kWh
            </p>
          </div>
          <div className="flex justify-between sm:block border-t border-white/5 pt-2 sm:border-0 sm:pt-0">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Price/kWh</p>
              <p className="text-sm font-semibold text-white">
                {pricePerKwh.toFixed(6)} ETH
              </p>
            </div>
            {ethPrice && (
              <p className="text-xs text-gray-500 sm:mt-0 self-end sm:self-auto">~{"\u20AC"}{(pricePerKwh * ethPrice).toFixed(4)}</p>
            )}
          </div>
          <div className="flex justify-between sm:block border-t border-white/5 pt-2 sm:border-0 sm:pt-0">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Total</p>
              <p className="text-sm font-semibold text-white">
                {totalValue.toFixed(6)} ETH
              </p>
            </div>
            {ethPrice && (
              <p className="text-xs text-gray-500 sm:mt-0 self-end sm:self-auto">~{"\u20AC"}{(totalValue * ethPrice).toFixed(2)}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const TradeHistoryBox: React.FC = () => {
  const { ethPrice, energyMarketAddress } = useAppContext();

  // Standalone viem client — works without wallet connection
  const client = useMemo<PublicClient>(
    () =>
      createPublicClient({
        chain: defaultChain,
        transport: http(),
      }),
    []
  );

  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTrades = useCallback(async () => {
    if (!energyMarketAddress) return;

    const timestamps = getTimestampsForDay(selectedDay);
    const dayStart = BigInt(timestamps[0]);
    const dayEnd = BigInt(timestamps[timestamps.length - 1]);

    setIsLoading(true);
    try {
      // Compute the EnergyTraded event topic0
      const topic0 = keccak256(
        new TextEncoder().encode("EnergyTraded(uint256,address,address,uint256,uint256)")
      );

      let allTrades: Trade[] = [];
      let usedBlockscout = false;

      // --- Primary: Blockscout API ---
      try {
        const logs = await fetchLogsFromBlockscout({
          address: energyMarketAddress,
          topic0,
        });

        const parseBlockscoutLog = (log: BlockscoutLog): Trade | null => {
          // Decode indexed topics: topic1=hour, topic2=buyer, topic3=seller
          const hour = BigInt(log.topics[1]);
          const buyer = ("0x" + log.topics[2].slice(26)) as string;
          const seller = ("0x" + log.topics[3].slice(26)) as string;

          // Decode non-indexed data: (uint256 amount, uint256 clearingPrice)
          const [amount, clearingPrice] = decodeAbiParameters(
            [
              { name: "amount", type: "uint256" },
              { name: "clearingPrice", type: "uint256" },
            ],
            log.data as `0x${string}`
          );

          if (hour < dayStart || hour > dayEnd) return null;

          return { hour, buyer, seller, amount, clearingPrice };
        };

        for (const log of logs) {
          const trade = parseBlockscoutLog(log);
          if (trade) allTrades.push(trade);
        }

        usedBlockscout = true;
      } catch (blockscoutError) {
        console.warn("Blockscout API failed, falling back to RPC getLogs:", blockscoutError);
      }

      // --- Fallback: RPC getLogs with bounded fromBlock ---
      if (!usedBlockscout) {
        const currentBlock = await client.getBlockNumber();
        const secondsAgo = Math.floor(Date.now() / 1000) - timestamps[0];
        const fromBlock = BigInt(Math.max(0, Number(currentBlock) - secondsAgo - 86400));

        const logs = await client.getLogs({
          address: energyMarketAddress,
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

      // Sort by hour
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

  // Summaries
  const totalVolume = trades.reduce((sum, t) => sum + wattsToKWh(t.amount), 0);
  const totalValueETH = trades.reduce((sum, t) => {
    const pKwh = pricePerWattToPerKWh(t.clearingPrice);
    return sum + pKwh * wattsToKWh(t.amount);
  }, 0);

  return (
    <div className="w-full max-w-4xl">
      <Card padding="lg">
        <CardHeader
          title="Trade History"
          subtitle="All bilateral trades from market clearing"
          icon={<ArrowLeftRight size={20} />}
        />

        <DateNavigationBar selectedDay={selectedDay} onDayChange={setSelectedDay} />

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <SkeletonBlock height="4.5rem" rounded="xl" />
              <SkeletonBlock height="4.5rem" rounded="xl" />
              <SkeletonBlock height="4.5rem" rounded="xl" className="hidden sm:block" />
            </div>
            <div className="space-y-3">
              <SkeletonBlock height="5rem" rounded="xl" />
              <SkeletonBlock height="5rem" rounded="xl" />
              <SkeletonBlock height="5rem" rounded="xl" />
            </div>
          </div>
        ) : (
          <>
            {/* Summary */}
            {trades.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 size={14} className="text-indigo-400" />
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total Trades</p>
                  </div>
                  <p className="text-xl font-bold text-indigo-400">{trades.length}</p>
                </div>
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={14} className="text-indigo-400" />
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total Volume</p>
                  </div>
                  <p className="text-xl font-bold text-indigo-400">{totalVolume.toFixed(2)} kWh</p>
                </div>
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowLeftRight size={14} className="text-indigo-400" />
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Total Value</p>
                  </div>
                  <p className="text-xl font-bold text-indigo-400">{totalValueETH.toFixed(6)} ETH</p>
                  {ethPrice && (
                    <p className="text-xs text-gray-500">~{"\u20AC"}{(totalValueETH * ethPrice).toFixed(2)}</p>
                  )}
                </div>
              </div>
            )}

            {/* Trade List */}
            <div className="space-y-3">
              {trades.map((trade, i) => (
                <TradeItem key={`trade-${trade.hour}-${i}`} trade={trade} ethPrice={ethPrice} />
              ))}
              {trades.length === 0 && (
                <EmptyState
                  icon={<ArrowLeftRight size={20} className="text-gray-500/50" />}
                  title="No trades for this day"
                  subtitle="Trades appear after market clearing"
                />
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default TradeHistoryBox;
