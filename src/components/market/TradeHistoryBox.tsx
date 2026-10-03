import React, { useState, useCallback, useMemo } from "react";
import { useAccount } from "wagmi";
import { ArrowLeftRight, TrendingUp, BarChart3, ShoppingCart, Store } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { SkeletonBlock, SkeletonLine } from "@/components/ui/Skeleton";

import { useAppContext } from "@/context/AppContext";
import DateNavigationBar from "@/components/common/DateNavigationBar";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { wattsToKWh, pricePerWattToPerKWh } from "@/utils/units";
import { formatTime, truncateAddress } from "@/utils/dateHelpers";
import { type Trade, useTradeData } from "@/hooks/useTradeData";
import { useEthPrice } from "@/hooks/useEthPrice";

/* ---------- Types ---------- */

interface TradeItemProps {
  trade: Trade;
  ethPrice?: number;
  index: number;
  userAddress?: string;
}

interface TradeSummary {
  totalVolume: number;
  totalValueETH: number;
  avgPrice: number;
}

/* ---------- Constants ---------- */

const SKELETON_COUNT = 3;

/* ---------- Skeleton for a single trade card ---------- */
const TradeItemSkeleton: React.FC = () => (
  <div className="relative overflow-hidden rounded-xl" role="status" aria-label="Loading trade">
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
      {/* Data skeleton - mirrors mobile card layout */}
      <div className="flex flex-col sm:grid sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="flex justify-between sm:block">
          <SkeletonLine width="3rem" height="0.625rem" />
          <SkeletonLine width="4.5rem" height="0.875rem" className="mt-1" />
        </div>
        <div className="flex justify-between sm:block">
          <SkeletonLine width="3.5rem" height="0.625rem" />
          <SkeletonLine width="5.5rem" height="0.875rem" className="mt-1" />
        </div>
        <div className="flex justify-between sm:block">
          <SkeletonLine width="2rem" height="0.625rem" />
          <SkeletonLine width="5rem" height="0.875rem" className="mt-1" />
        </div>
      </div>
    </div>
  </div>
);

/* ---------- Individual trade card ---------- */
const TradeItem: React.FC<TradeItemProps> = React.memo(({ trade, ethPrice, index, userAddress }) => {
  const pricePerKwh = pricePerWattToPerKWh(trade.clearingPrice);
  const totalValue = pricePerKwh * wattsToKWh(trade.amount);

  // Determine if this user is the buyer or seller for color coding
  const normalizedUser = userAddress?.toLowerCase();
  const isBuyer = normalizedUser === trade.buyer.toLowerCase();
  const isSeller = normalizedUser === trade.seller.toLowerCase();

  // Color scheme: buyer = blue, seller = emerald, neutral = indigo
  const accentColor = isBuyer
    ? { bar: "bg-blue-500", gradient: "from-blue-500/10", border: "border-blue-500/20", hover: "group-hover:from-blue-500/15", text: "text-blue-400" }
    : isSeller
    ? { bar: "bg-emerald-500", gradient: "from-emerald-500/10", border: "border-emerald-500/20", hover: "group-hover:from-emerald-500/15", text: "text-emerald-400" }
    : { bar: "bg-indigo-500", gradient: "from-indigo-500/10", border: "border-indigo-500/20", hover: "group-hover:from-indigo-500/15", text: "text-indigo-400" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
      layout
      className="relative overflow-hidden rounded-xl group active:scale-[0.99] transition-transform touch-manipulation"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor.bar}`} />
      <div
        className={`pl-4 pr-4 py-3 ml-1 bg-gradient-to-r ${accentColor.gradient} to-transparent border border-l-0 rounded-r-xl ${accentColor.border} transition-colors ${accentColor.hover}`}
      >
        {/* Header - responsive: stacks on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 mb-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <ArrowLeftRight size={14} className="text-indigo-400 hidden sm:block shrink-0" />
            <div className="flex items-center gap-1.5 min-w-0">
              <Badge variant="info" size="sm" icon={<ShoppingCart size={10} />}>
                <span className="font-mono text-[11px] leading-none">{truncateAddress(trade.buyer)}</span>
              </Badge>
              {isBuyer && (
                <span className="text-[9px] font-semibold uppercase tracking-wider text-blue-400 bg-blue-500/15 px-1.5 py-0.5 rounded-full border border-blue-500/25">
                  You
                </span>
              )}
            </div>
            <span className="text-xs text-gray-600 hidden sm:inline">&rarr;</span>
            <div className="flex items-center gap-1.5 min-w-0">
              <Badge variant="success" size="sm" icon={<Store size={10} />}>
                <span className="font-mono text-[11px] leading-none">{truncateAddress(trade.seller)}</span>
              </Badge>
              {isSeller && (
                <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-full border border-emerald-500/25">
                  You
                </span>
              )}
            </div>
          </div>
          <span className="text-[11px] text-gray-500 tabular-nums shrink-0">{formatTime(Number(trade.hour))}</span>
        </div>

        {/* Data grid - card layout on mobile, horizontal grid on sm+ */}
        <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-4">
          <div className="flex justify-between sm:block">
            <p className="text-[11px] text-gray-500 mb-0.5">Amount</p>
            <p className={`text-sm font-semibold tabular-nums ${accentColor.text}`}>
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
            {ethPrice != null && (
              <p className="text-[11px] text-gray-500 sm:mt-0 self-end sm:self-auto tabular-nums">
                ~{"\u20AC"}{(pricePerKwh * ethPrice).toFixed(4)}
              </p>
            )}
          </div>
          <div className="flex justify-between sm:block border-t border-white/5 pt-2 sm:border-0 sm:pt-0">
            <div>
              <p className="text-[11px] text-gray-500 mb-0.5">Total</p>
              <p className="text-sm font-semibold text-white tabular-nums">
                {totalValue.toFixed(6)} ETH
              </p>
            </div>
            {ethPrice != null && (
              <p className="text-[11px] text-gray-500 sm:mt-0 self-end sm:self-auto tabular-nums">
                ~{"\u20AC"}{(totalValue * ethPrice).toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

TradeItem.displayName = "TradeItem";

/* ---------- Summary stat card ---------- */
const SummaryStat: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  subValue?: React.ReactNode;
  className?: string;
}> = React.memo(({ icon, label, value, subValue, className = "" }) => (
  <div className={`p-3 sm:p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl ${className}`}>
    <div className="flex items-center gap-2 mb-1">
      {icon}
      <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-wide truncate">{label}</p>
    </div>
    <p className="text-lg sm:text-xl font-bold text-indigo-400 tabular-nums">{value}</p>
    {subValue}
  </div>
));

SummaryStat.displayName = "SummaryStat";

/* ---------- Main component ---------- */
const TradeHistoryBox: React.FC = () => {
  const { energyMarketAddress } = useAppContext();
  const ethPrice = useEthPrice();

  const { address } = useAccount();
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const { trades, isLoading } = useTradeData(selectedDay, energyMarketAddress);

  // Memoised summaries -- recomputed only when trades change
  const { totalVolume, totalValueETH, avgPrice }: TradeSummary = useMemo(() => {
    const vol = trades.reduce((sum, t) => sum + wattsToKWh(t.amount), 0);
    const val = trades.reduce((sum, t) => {
      const pKwh = pricePerWattToPerKWh(t.clearingPrice);
      return sum + pKwh * wattsToKWh(t.amount);
    }, 0);
    const avg = vol > 0 ? val / vol : 0;
    return { totalVolume: vol, totalValueETH: val, avgPrice: avg };
  }, [trades]);

  // Stable trade key generator
  const getTradeKey = useCallback(
    (trade: Trade, index: number) =>
      `${trade.hour.toString()}-${trade.buyer}-${trade.seller}-${trade.amount.toString()}-${index}`,
    []
  );

  // Memoized skeleton array to avoid re-creating on each render
  const skeletonItems = useMemo(
    () => Array.from({ length: SKELETON_COUNT }, (_, i) => i),
    []
  );

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
            {/* Summary skeletons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <SkeletonBlock height="4.5rem" rounded="xl" />
              <SkeletonBlock height="4.5rem" rounded="xl" />
              <SkeletonBlock height="4.5rem" rounded="xl" className="col-span-2 sm:col-span-1" />
            </div>
            {/* Trade card skeletons */}
            <div className="space-y-3">
              {skeletonItems.map((i) => (
                <TradeItemSkeleton key={i} />
              ))}
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
                <SummaryStat
                  icon={<BarChart3 size={14} className="text-indigo-400 shrink-0" />}
                  label="Total Trades"
                  value={trades.length}
                />
                <SummaryStat
                  icon={<TrendingUp size={14} className="text-indigo-400 shrink-0" />}
                  label="Total Volume"
                  value={
                    <>
                      {totalVolume.toFixed(2)} <span className="text-xs font-normal text-gray-500">kWh</span>
                    </>
                  }
                />
                <SummaryStat
                  icon={<ArrowLeftRight size={14} className="text-indigo-400 shrink-0" />}
                  label="Total Value"
                  value={
                    <>
                      {totalValueETH.toFixed(6)} <span className="text-xs font-normal text-gray-500">ETH</span>
                    </>
                  }
                  subValue={
                    ethPrice != null ? (
                      <p className="text-[11px] text-gray-500 tabular-nums">~{"\u20AC"}{(totalValueETH * ethPrice).toFixed(2)}</p>
                    ) : undefined
                  }
                  className="col-span-2 sm:col-span-1"
                />
              </motion.div>
            )}

            {/* Avg price stat when we have trades */}
            {trades.length > 0 && avgPrice > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="mb-4 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-between"
              >
                <span className="text-[11px] text-gray-500 uppercase tracking-wide">Avg. Clearing Price</span>
                <span className="text-sm font-semibold text-white tabular-nums">
                  {avgPrice.toFixed(6)} ETH/kWh
                  {ethPrice != null && (
                    <span className="text-[11px] text-gray-500 ml-2">
                      ~{"\u20AC"}{(avgPrice * ethPrice).toFixed(4)}
                    </span>
                  )}
                </span>
              </motion.div>
            )}

            {/* Trade List */}
            <div className="space-y-3 overflow-x-auto">
              <AnimatePresence mode="popLayout">
                {trades.map((trade, i) => (
                  <TradeItem
                    key={getTradeKey(trade, i)}
                    trade={trade}
                    ethPrice={ethPrice}
                    index={i}
                    userAddress={address}
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
