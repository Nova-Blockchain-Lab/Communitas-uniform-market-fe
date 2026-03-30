import React, { useState, useMemo } from "react";
import {
  BarChart3,
  Users,
  Zap,
  TrendingUp,
  Table2,
  LayoutGrid,
} from "lucide-react";

import { useAppContext } from "@/context/AppContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useTradeData } from "@/hooks/useTradeData";
import DateNavigationBar from "@/components/common/DateNavigationBar";
import {
  Card,
  CardHeader,
  SkeletonBlock,
  SkeletonRows,
  SkeletonLine,
} from "@/components/ui";
import HourSelector from "./HourSelector";
import BubbleVisualization from "./BubbleVisualization";

const EnergyDashboard: React.FC = () => {
  const { ethPrice, energyMarketAddress } = useAppContext();
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [selectedHour, setSelectedHour] = useState<number>(
    new Date().getHours()
  );
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const { hourData, isPending } = useDashboardData(selectedDay);
  const { trades } = useTradeData(selectedDay, energyMarketAddress);

  const currentHourData = hourData.find((h) => h.hour === selectedHour);

  const currentHourTrades = useMemo(() => {
    if (!currentHourData || !trades.length) return [];
    return trades.filter(t => Number(t.hour) === currentHourData.timestamp);
  }, [trades, currentHourData]);

  // Aggregate daily statistics from all hours
  const dailyStats = useMemo(() => {
    if (hourData.length === 0)
      return { totalBids: 0, totalAsks: 0, avgClearingPrice: 0, clearedHours: 0, totalEnergy: 0 };

    let totalBids = 0;
    let totalAsks = 0;
    let priceSum = 0;
    let clearedHours = 0;
    let totalEnergy = 0;

    for (const h of hourData) {
      totalBids += h.buyers.length;
      totalAsks += h.sellers.length;
      totalEnergy += h.totalAvailableEnergy;
      if (h.isCleared && h.clearingPrice > 0) {
        priceSum += h.clearingPrice;
        clearedHours++;
      }
    }

    return {
      totalBids,
      totalAsks,
      avgClearingPrice: clearedHours > 0 ? priceSum / clearedHours : 0,
      clearedHours,
      totalEnergy,
    };
  }, [hourData]);

  return (
    <div className="w-full max-w-6xl">
      <Card padding="lg">
        <CardHeader
          title="Energy Exchange"
          subtitle="Real-time market participant visualization"
          icon={<BarChart3 size={20} />}
          action={
            !isPending ? (
              <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-[var(--color-border)]">
                <button
                  onClick={() => setViewMode("chart")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                    viewMode === "chart"
                      ? "bg-[var(--color-primary-500)]/20 text-[var(--color-primary-500)]"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                  aria-label="Chart view"
                >
                  <LayoutGrid size={14} />
                  <span className="hidden sm:inline">Chart</span>
                </button>
                <button
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                    viewMode === "table"
                      ? "bg-[var(--color-primary-500)]/20 text-[var(--color-primary-500)]"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                  aria-label="Table view"
                >
                  <Table2 size={14} />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
            ) : undefined
          }
        />

        <DateNavigationBar
          selectedDay={selectedDay}
          onDayChange={setSelectedDay}
        />

        {isPending ? (
          /* Skeleton loading state */
          <div className="space-y-6 mt-4">
            {/* Market summary skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl border border-[var(--color-border)]"
                >
                  <SkeletonLine width="60%" height="0.75rem" className="mb-2" />
                  <SkeletonLine width="40%" height="1.5rem" />
                </div>
              ))}
            </div>
            {/* Hour selector skeleton */}
            <div className="flex gap-2 overflow-hidden">
              {Array.from({ length: 12 }).map((_, i) => (
                <SkeletonBlock
                  key={i}
                  width="60px"
                  height="56px"
                  rounded="xl"
                />
              ))}
            </div>
            {/* Visualization skeleton */}
            <SkeletonBlock height="300px" rounded="xl" />
          </div>
        ) : (
          <>
            {/* Daily Market Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Users size={14} className="text-blue-400" />
                  <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
                    Total Bids
                  </span>
                </div>
                <p className="text-lg font-bold text-blue-400">
                  {dailyStats.totalBids}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Users size={14} className="text-emerald-400" />
                  <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
                    Total Asks
                  </span>
                </div>
                <p className="text-lg font-bold text-emerald-400">
                  {dailyStats.totalAsks}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={14} className="text-amber-400" />
                  <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
                    Avg Clearing
                  </span>
                </div>
                <p className="text-lg font-bold text-amber-400">
                  {dailyStats.clearedHours > 0
                    ? `${dailyStats.avgClearingPrice.toFixed(6)} ETH`
                    : "N/A"}
                </p>
                {dailyStats.clearedHours > 0 && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {dailyStats.clearedHours} hour{dailyStats.clearedHours !== 1 ? "s" : ""} cleared
                  </p>
                )}
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-[var(--color-border)]">
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={14} className="text-[var(--color-text-secondary)]" />
                  <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
                    Total Energy
                  </span>
                </div>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">
                  {dailyStats.totalEnergy.toFixed(1)} kWh
                </p>
              </div>
            </div>

            <HourSelector
              hours={hourData}
              selectedHour={selectedHour}
              onSelectHour={setSelectedHour}
            />

            {viewMode === "chart" ? (
              <BubbleVisualization
                data={currentHourData}
                ethPrice={ethPrice}
                trades={currentHourTrades}
              />
            ) : (
              /* Table view */
              <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] bg-white/[0.02]">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                        Type
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                        Address
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                        Amount (kWh)
                      </th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                        Price (ETH)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentHourData &&
                    (currentHourData.buyers.length > 0 ||
                      currentHourData.sellers.length > 0) ? (
                      <>
                        {currentHourData.sellers.map((s, i) => (
                          <tr
                            key={`seller-${i}`}
                            className="border-b border-[var(--color-border)] hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                Seller
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-primary)]">
                              {s.address}
                            </td>
                            <td className="px-4 py-3 text-right text-emerald-400 font-medium">
                              {s.amount}
                            </td>
                            <td className="px-4 py-3 text-right text-[var(--color-text-muted)]">
                              —
                            </td>
                          </tr>
                        ))}
                        {currentHourData.buyers.map((b, i) => (
                          <tr
                            key={`buyer-${i}`}
                            className="border-b border-[var(--color-border)] hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1.5 text-blue-400 font-medium">
                                <span className="w-2 h-2 rounded-full bg-blue-400" />
                                Buyer
                              </span>
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-primary)]">
                              {b.address}
                            </td>
                            <td className="px-4 py-3 text-right text-blue-400 font-medium">
                              {b.amount}
                            </td>
                            <td className="px-4 py-3 text-right text-amber-400 font-medium">
                              {b.price !== undefined
                                ? b.price.toFixed(6)
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </>
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-12 text-center text-[var(--color-text-muted)]"
                        >
                          No market activity for this hour
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {currentHourData?.isCleared &&
                  currentHourData.clearingPrice > 0 && (
                    <div className="px-4 py-3 border-t border-[var(--color-border)] bg-amber-500/5 flex items-center justify-between">
                      <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
                        Clearing Price
                      </span>
                      <span className="text-sm font-bold text-amber-400">
                        {currentHourData.clearingPrice.toFixed(6)} ETH/kWh
                        {ethPrice && (
                          <span className="ml-2 text-xs text-[var(--color-text-muted)] font-normal">
                            ({"\u20AC"}
                            {(currentHourData.clearingPrice * ethPrice).toFixed(
                              4
                            )}
                            )
                          </span>
                        )}
                      </span>
                    </div>
                  )}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default EnergyDashboard;
