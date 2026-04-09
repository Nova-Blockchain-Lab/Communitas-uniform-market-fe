import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
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
import type { HourData, Participant } from "@/hooks/useDashboardData";
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

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DailyStats {
  totalBids: number;
  totalAsks: number;
  avgClearingPrice: number;
  clearedHours: number;
  totalEnergy: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  index: number;
}

interface StatCardData {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext?: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

/* ------------------------------------------------------------------ */
/*  Stat Card                                                          */
/* ------------------------------------------------------------------ */

const StatCard: React.FC<StatCardProps> = React.memo(
  ({ icon, label, value, subtext, colorClass, bgClass, borderClass, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.05 }}
      className={`p-3 sm:p-4 rounded-xl ${bgClass} border ${borderClass} transition-colors duration-200 hover:brightness-110`}
    >
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <span className="text-[10px] sm:text-xs text-[var(--color-text-secondary)] uppercase tracking-wide leading-tight">
          {label}
        </span>
      </div>
      <p
        className={`text-base sm:text-lg font-bold ${colorClass} truncate`}
        title={value}
      >
        {value}
      </p>
      {subtext && (
        <p className="text-[10px] sm:text-xs text-[var(--color-text-muted)] mt-0.5 truncate">
          {subtext}
        </p>
      )}
    </motion.div>
  ),
);

StatCard.displayName = "StatCard";

/* ------------------------------------------------------------------ */
/*  Table Row                                                          */
/* ------------------------------------------------------------------ */

interface ParticipantRowProps {
  type: "buyer" | "seller";
  participant: Participant;
  ethPrice?: number;
}

const ParticipantRow: React.FC<ParticipantRowProps> = React.memo(
  ({ type, participant, ethPrice }) => {
    const isBuyer = type === "buyer";
    const colorClass = isBuyer ? "text-blue-400" : "text-emerald-400";
    const dotClass = isBuyer ? "bg-blue-400" : "bg-emerald-400";
    const label = isBuyer ? "Buyer" : "Seller";

    return (
      <tr className="border-b border-[var(--color-border)] hover:bg-white/[0.02] transition-colors">
        <td className="px-3 sm:px-4 py-3">
          <span
            className={`inline-flex items-center gap-1.5 ${colorClass} font-medium text-xs sm:text-sm`}
          >
            <span
              className={`w-2 h-2 rounded-full ${dotClass} flex-shrink-0`}
            />
            {label}
          </span>
        </td>
        <td className="px-3 sm:px-4 py-3 font-mono text-[10px] sm:text-xs text-[var(--color-text-primary)]">
          <span className="hidden sm:inline">{participant.address}</span>
          <span className="sm:hidden">
            {participant.address.slice(0, 6)}...{participant.address.slice(-4)}
          </span>
        </td>
        <td
          className={`px-3 sm:px-4 py-3 text-right ${colorClass} font-medium text-xs sm:text-sm`}
        >
          {participant.amount}
        </td>
        <td className="px-3 sm:px-4 py-3 text-right text-xs sm:text-sm">
          {isBuyer && participant.price !== undefined ? (
            <span className="text-amber-400 font-medium">
              {participant.price.toFixed(6)}
            </span>
          ) : (
            <span className="text-[var(--color-text-muted)]">&mdash;</span>
          )}
        </td>
      </tr>
    );
  },
);

ParticipantRow.displayName = "ParticipantRow";

/* ------------------------------------------------------------------ */
/*  Section Heading                                                    */
/* ------------------------------------------------------------------ */

const SectionHeading: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <h3
    className={`text-xs sm:text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3 ${className}`}
  >
    {children}
  </h3>
);

/* ------------------------------------------------------------------ */
/*  Loading Skeleton                                                   */
/* ------------------------------------------------------------------ */

const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 mt-4 animate-pulse">
    {/* Section heading skeleton */}
    <SkeletonLine width="8rem" height="0.75rem" />

    {/* Market summary skeleton -- mirrors the 1-col / 2-col / 4-col stat grid */}
    <div className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="p-3 sm:p-4 rounded-xl border border-[var(--color-border)]"
        >
          <div className="flex items-center gap-2 mb-2">
            <SkeletonBlock width="14px" height="14px" rounded="full" />
            <SkeletonLine width="60%" height="0.625rem" />
          </div>
          <SkeletonLine width="50%" height="1.25rem" />
          <div className="mt-1.5">
            <SkeletonLine width="40%" height="0.625rem" />
          </div>
        </div>
      ))}
    </div>

    {/* Section heading skeleton */}
    <SkeletonLine width="10rem" height="0.75rem" />

    {/* Hour selector skeleton -- compact grid on mobile, scrolling row on desktop */}
    <div className="grid grid-cols-6 gap-1.5 sm:flex sm:gap-2 sm:overflow-hidden">
      {Array.from({ length: 12 }).map((_, i) => (
        <SkeletonBlock key={i} width="60px" height="56px" rounded="xl" />
      ))}
    </div>

    {/* Visualization skeleton */}
    <SkeletonBlock height="300px" rounded="xl" />

    {/* Table skeleton rows (simulates alternate view) */}
    <div className="rounded-xl border border-[var(--color-border)] overflow-hidden">
      <div className="flex gap-4 px-3 sm:px-4 py-3 bg-white/[0.02]">
        <SkeletonLine width="15%" height="0.625rem" />
        <SkeletonLine width="40%" height="0.625rem" />
        <SkeletonLine width="15%" height="0.625rem" />
        <SkeletonLine width="15%" height="0.625rem" />
      </div>
      <SkeletonRows count={4} gap="0" className="px-3 sm:px-4 py-2" />
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

const EnergyDashboard: React.FC = () => {
  const { ethPrice, energyMarketAddress } = useAppContext();
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [selectedHour, setSelectedHour] = useState<number>(
    new Date().getHours()
  );
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const { hourData, isPending } = useDashboardData(selectedDay);
  const { trades } = useTradeData(selectedDay, energyMarketAddress);

  /* ---- Derived data ---- */

  const currentHourData = useMemo(
    () => hourData.find((h) => h.hour === selectedHour),
    [hourData, selectedHour]
  );

  const currentHourTrades = useMemo(() => {
    if (!currentHourData || !trades.length) return [];
    return trades.filter((t) => Number(t.hour) === currentHourData.timestamp);
  }, [trades, currentHourData]);

  // Aggregate daily statistics from all hours
  const dailyStats = useMemo<DailyStats>(() => {
    if (hourData.length === 0)
      return {
        totalBids: 0,
        totalAsks: 0,
        avgClearingPrice: 0,
        clearedHours: 0,
        totalEnergy: 0,
      };

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

  /* ---- Memoised stat card descriptors ---- */

  const statCards = useMemo<StatCardData[]>(
    () => [
      {
        icon: <Users size={14} className="text-blue-400 flex-shrink-0" />,
        label: "Total Bids",
        value: String(dailyStats.totalBids),
        colorClass: "text-blue-400",
        bgClass: "bg-blue-500/10",
        borderClass: "border-blue-500/20",
      },
      {
        icon: <Users size={14} className="text-emerald-400 flex-shrink-0" />,
        label: "Total Asks",
        value: String(dailyStats.totalAsks),
        colorClass: "text-emerald-400",
        bgClass: "bg-emerald-500/10",
        borderClass: "border-emerald-500/20",
      },
      {
        icon: (
          <TrendingUp size={14} className="text-amber-400 flex-shrink-0" />
        ),
        label: "Avg Clearing",
        value:
          dailyStats.clearedHours > 0
            ? `${dailyStats.avgClearingPrice.toFixed(6)} ETH`
            : "N/A",
        subtext:
          dailyStats.clearedHours > 0
            ? `${dailyStats.clearedHours} hour${dailyStats.clearedHours !== 1 ? "s" : ""} cleared`
            : undefined,
        colorClass: "text-amber-400",
        bgClass: "bg-amber-500/10",
        borderClass: "border-amber-500/20",
      },
      {
        icon: (
          <Zap
            size={14}
            className="text-[var(--color-text-secondary)] flex-shrink-0"
          />
        ),
        label: "Total Energy",
        value: `${dailyStats.totalEnergy.toFixed(1)} kWh`,
        colorClass: "text-[var(--color-text-primary)]",
        bgClass: "bg-white/5",
        borderClass: "border-[var(--color-border)]",
      },
    ],
    [dailyStats],
  );

  /* ---- Memoised table data ---- */

  const tableParticipants = useMemo(() => {
    if (!currentHourData) return { sellers: [], buyers: [] };
    return {
      sellers: currentHourData.sellers,
      buyers: currentHourData.buyers,
    };
  }, [currentHourData]);

  const hasTableData =
    tableParticipants.sellers.length > 0 ||
    tableParticipants.buyers.length > 0;

  /* ---- Callbacks ---- */

  const handleSetChartView = useCallback(() => setViewMode("chart"), []);
  const handleSetTableView = useCallback(() => setViewMode("table"), []);

  /* ---- Render ---- */

  return (
    <div className="w-full max-w-6xl px-2 sm:px-0">
      <Card padding="lg" className="!p-3 min-[400px]:!p-4 sm:!p-6 lg:!p-8">
        <CardHeader
          title="Energy Exchange"
          subtitle="Real-time market participant visualization"
          icon={<BarChart3 size={20} />}
          action={
            !isPending ? (
              <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-[var(--color-border)]">
                <button
                  onClick={handleSetChartView}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
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
                  onClick={handleSetTableView}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
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
          <DashboardSkeleton />
        ) : (
          <>
            {/* ---- Daily Market Summary ---- */}
            <SectionHeading>Daily Summary</SectionHeading>

            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-6">
              {statCards.map((card, i) => (
                <StatCard key={card.label} index={i} {...card} />
              ))}
            </div>

            {/* ---- Hourly Detail ---- */}
            <SectionHeading>Hourly Detail</SectionHeading>

            <HourSelector
              hours={hourData}
              selectedHour={selectedHour}
              onSelectHour={setSelectedHour}
            />

            <AnimatePresence mode="wait">
              {viewMode === "chart" ? (
                <motion.div
                  key="chart"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <BubbleVisualization
                    data={currentHourData}
                    ethPrice={ethPrice}
                    trades={currentHourTrades}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="table"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Table view -- horizontal scroll keeps columns usable on narrow screens */}
                  <div className="overflow-x-auto -mx-3 min-[400px]:mx-0 rounded-none min-[400px]:rounded-xl border-y min-[400px]:border border-[var(--color-border)]">
                    <table className="w-full text-sm min-w-[28rem]">
                      <thead>
                        <tr className="border-b border-[var(--color-border)] bg-white/[0.02]">
                          <th className="text-left px-3 sm:px-4 py-3 text-[10px] sm:text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                            Type
                          </th>
                          <th className="text-left px-3 sm:px-4 py-3 text-[10px] sm:text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                            Address
                          </th>
                          <th className="text-right px-3 sm:px-4 py-3 text-[10px] sm:text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                            <span className="hidden sm:inline">
                              Amount (kWh)
                            </span>
                            <span className="sm:hidden">kWh</span>
                          </th>
                          <th className="text-right px-3 sm:px-4 py-3 text-[10px] sm:text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                            <span className="hidden sm:inline">
                              Price (ETH)
                            </span>
                            <span className="sm:hidden">ETH</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {hasTableData ? (
                          <>
                            {tableParticipants.sellers.map((s, i) => (
                              <ParticipantRow
                                key={`seller-${i}`}
                                type="seller"
                                participant={s}
                              />
                            ))}
                            {tableParticipants.buyers.map((b, i) => (
                              <ParticipantRow
                                key={`buyer-${i}`}
                                type="buyer"
                                participant={b}
                                ethPrice={ethPrice}
                              />
                            ))}
                          </>
                        ) : (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-12 text-center text-sm text-[var(--color-text-muted)]"
                            >
                              No market activity for this hour
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    {currentHourData?.isCleared &&
                      currentHourData.clearingPrice > 0 && (
                        <div className="px-3 sm:px-4 py-3 border-t border-[var(--color-border)] bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
                          <span className="text-[10px] sm:text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
                            Clearing Price
                          </span>
                          <span className="text-sm font-bold text-amber-400">
                            {currentHourData.clearingPrice.toFixed(6)} ETH/kWh
                            {ethPrice && (
                              <span className="ml-2 text-xs text-[var(--color-text-muted)] font-normal">
                                ({"\u20AC"}
                                {(
                                  currentHourData.clearingPrice * ethPrice
                                ).toFixed(4)}
                                )
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </Card>
    </div>
  );
};

export default EnergyDashboard;
