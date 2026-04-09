import React, { useEffect, useState, useCallback, useMemo } from "react";
import { ArrowLeftRight, TrendingUp, BarChart3, ShoppingCart, Store } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { AnimatePresence, motion } from "motion/react";
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
import { Card, CardHeader, Badge, EmptyState } from "@/components/ui";
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

/* ---------- Skeleton for a single trade card ---------- */
const TradeItemSkeleton: React.FC = () => (
  <div className="relative overflow-hidden rounded-xl">
    <div className="absolute left-0 top-0 bottom-0 w-1 skeleton-pulse rounded-full" />
    <div className="pl-4 pr-4 py-3 ml-1 border border-l-0 rounded-r-xl border-white/5 bg-white/[0.02]">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <SkeletonLine width="5rem" height="0.75rem" />
          <SkeletonLine width="6rem" height="0.75rem" />
        </div>
        <SkeletonLine width="3.5rem" height="0.75rem" />
      </div>
      {/* Data skeleton */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <SkeletonLine width="3rem" height="0.625rem" />
          <SkeletonLine width="4.5rem" height="0.875rem" />
        </div>
        <div className="space-y-1.5">
          <SkeletonLine width="3.5rem" height="0.625rem" />
          <SkeletonLine width="5.5rem" height="0.875rem" />
        </div>
        <div className="space-y-1.5">
          <SkeletonLine width="2rem" height="0.625rem" />
          <SkeletonLine width="5rem" height="0.875rem" />
        </div>
      </div>
    </div>
  </div>
);

/* ---------- Individual trade card ---------- */
const TradeItem: React.FC<{
  trade: Trade;
  ethPrice?: number;
  index: number;
}> = React.memo(({ trade, ethPrice, index }) => {
  const pricePerKwh = pricePerWattToPerKWh(trade.clearingPrice);
  const totalValue = pricePerKwh * wattsToKWh(trade.amount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
      layout
      className="relative overflow-hidden rounded-xl group active:scale-[0.99] transition-transform touch-manipulation"
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
      <div
        className="pl-4 pr-4 py-3 ml-1 bg-gradient-to-r from-indigo-500/10 to-transparent border border-l-0 rounded-r-xl border-indigo-500/20 transition-colors group-hover:from-indigo-500/15"
      >
        {/* Header - responsive: stacks on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 mb-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <ArrowLeftRight size={14} className="text-indigo-400 hidden sm:block shrink-0" />
            <div className="flex items-center gap-1.5 min-w-0">
              <Badge variant="info" size="sm" icon={<ShoppingCart size={10} />}>
                <span className="font-mono text-[11px] leading-none">{truncateAddress(trade.buyer)}</span>
              </Badge>
            </div>
            <span className="text-xs text-gray-600 hidden sm:inline">&rarr;</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <Badge variant="success" size="sm" icon={<Store size={10} />}>
                <span className="font-mono text-[11px] leading-none">{truncateAddress(trade.seller)}</span>
              </Badge>
            </div>
          </div>
          <span className="text-[11px] text-gray-500 tabular-nums shrink-0">{formatTime(Number(trade.hour))}</span>
        </div>

        {/* Data grid - card layout on mobile, horizontal grid on sm+ */}
        <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-4">
          <div className="flex justify-between sm:block">
            <p className="text-[11px] text-gray-500 mb-0.5">Amount</p>
            <p className="text-sm font-semibold text-indigo-400 tabular-nums">
              {wattsToKWh(trade.amount).toFixed(2)} kWh
            </p>
          </div>
          <div className="flex justify-between sm:block border-t border-white/5 pt-2 sm:border-0 sm:pt-0">
            <div>
              <p className="text-[11px] text-gray-500 mb-0.5">Price/kWh</p>
              <p className="text-sm font-semibold text-white tabular-nums">
                {pricePerKwh.toFixed(6)} ETH
              </p>
            </div>
            {ethPrice && (
              <p className="text-[11px] text-gray-500 sm:mt-0 self-end sm:self-auto tabular-nums">~{"\u20AC"}{(pricePerKwh * ethPrice).toFixed(4)}</p>
            )}
          </div>
          <div className="flex justify-between sm:block border-t border-white/5 pt-2 sm:border-0 sm:pt-0">
            <div>
              <p className="text-[11px] text-gray-500 mb-0.5">Total</p>
              <p className="text-sm font-semibold text-white tabular-nums">
                {totalValue.toFixed(6)} ETH
              </p>
            </div>
            {ethPrice && (
              <p className="text-[11px] text-gray-500 sm:mt-0 self-end sm:self-auto tabular-nums">~{"\u20AC"}{(totalValue * ethPrice).toFixed(2)}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

TradeItem.displayName = "TradeItem";

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

  const handleDayChange = useCallback((day: Date) => {
    setSelectedDay(day);
  }, []);

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

  // Memoised summaries — recomputed only when trades change
  const { totalVolume, totalValueETH, avgPrice } = useMemo(() => {
    const vol = trades.reduce((sum, t) => sum + wattsToKWh(t.amount), 0);
    const val = trades.reduce((sum, t) => {
      const pKwh = pricePerWattToPerKWh(t.clearingPrice);
      return sum + pKwh * wattsToKWh(t.amount);
    }, 0);
    const avg = vol > 0 ? val / vol : 0;
    return { totalVolume: vol, totalValueETH: val, avgPrice: avg };
  }, [trades]);

  return (
    <div className="w-full max-w-4xl">
      <Card padding="lg">
        <CardHeader
          title="Trade History"
          subtitle="All bilateral trades from market clearing"
          icon={<ArrowLeftRight size={20} />}
        />

        <DateNavigationBar selectedDay={selectedDay} onDayChange={handleDayChange} />

        {isLoading ? (
          <div className="space-y-4">
            {/* Summary skeletons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <SkeletonBlock height="4.5rem" rounded="xl" />
              <SkeletonBlock height="4.5rem" rounded="xl" />
              <SkeletonBlock height="4.5rem" rounded="xl" className="col-span-2 sm:col-span-1" />
            </div>
            {/* Trade card skeletons */}
            <div className="space-y-3">
              <TradeItemSkeleton />
              <TradeItemSkeleton />
              <TradeItemSkeleton />
            </div>
          </div>
        ) : (
          <>
            {/* Summary */}
            {trades.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6"
              >
                <div className="p-3 sm:p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 size={14} className="text-indigo-400 shrink-0" />
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide truncate">Total Trades</p>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-indigo-400 tabular-nums">{trades.length}</p>
                </div>
                <div className="p-3 sm:p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={14} className="text-indigo-400 shrink-0" />
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide truncate">Total Volume</p>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-indigo-400 tabular-nums">{totalVolume.toFixed(2)} <span className="text-xs font-normal text-gray-500">kWh</span></p>
                </div>
                <div className="p-3 sm:p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl col-span-2 sm:col-span-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowLeftRight size={14} className="text-indigo-400 shrink-0" />
                    <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide truncate">Total Value</p>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-indigo-400 tabular-nums">{totalValueETH.toFixed(6)} <span className="text-xs font-normal text-gray-500">ETH</span></p>
                  {ethPrice && (
                    <p className="text-[11px] text-gray-500 tabular-nums">~{"\u20AC"}{(totalValueETH * ethPrice).toFixed(2)}</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Trade List */}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {trades.map((trade, i) => (
                  <TradeItem
                    key={`${trade.hour.toString()}-${trade.buyer}-${trade.seller}-${i}`}
                    trade={trade}
                    ethPrice={ethPrice}
                    index={i}
                  />
                ))}
              </AnimatePresence>
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
