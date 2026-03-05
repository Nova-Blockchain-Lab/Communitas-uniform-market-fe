import React, { useRef, useEffect, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { SkipForward } from "lucide-react";
import type { HourData } from "@/hooks/useDashboardData";

interface HourSelectorProps {
  hours: HourData[];
  selectedHour: number;
  onSelectHour: (hour: number) => void;
}

const HourSelector: React.FC<HourSelectorProps> = ({
  hours,
  selectedHour,
  onSelectHour,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // Scroll the selected hour into view on mount and when selection changes
  useEffect(() => {
    if (selectedRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const element = selectedRef.current;
      const containerRect = container.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();

      if (
        elementRect.left < containerRect.left ||
        elementRect.right > containerRect.right
      ) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [selectedHour]);

  const formatHourLabel = (hour: number): string => {
    return `${hour.toString().padStart(2, "0")}:00`;
  };

  const getHourData = (hour: number): HourData | undefined => {
    return hours.find((h) => h.hour === hour);
  };

  // Compute the max buyer/seller volume across all hours for relative bar sizing
  const maxVolume = useMemo(() => {
    let max = 0;
    for (const h of hours) {
      const buyerVol = h.buyers.reduce((sum, b) => sum + b.amount, 0);
      const sellerVol = h.sellers.reduce((sum, s) => sum + s.amount, 0);
      max = Math.max(max, buyerVol, sellerVol);
    }
    return max;
  }, [hours]);

  const currentActiveHour = new Date().getHours();

  const handleSkipToActive = useCallback(() => {
    onSelectHour(currentActiveHour);
  }, [onSelectHour, currentActiveHour]);

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent snap-x snap-mandatory flex-1"
          style={{ scrollbarWidth: "thin" }}
        >
          {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
            const hourInfo = getHourData(hour);
            const isSelected = selectedHour === hour;
            const isCleared = hourInfo?.isCleared ?? false;
            const isActiveHour = hour === currentActiveHour;
            const hasActivity =
              (hourInfo?.buyers.length ?? 0) > 0 ||
              (hourInfo?.sellers.length ?? 0) > 0;

            // Compute buyer/seller volumes for mini bars
            const buyerVol = hourInfo
              ? hourInfo.buyers.reduce((sum, b) => sum + b.amount, 0)
              : 0;
            const sellerVol = hourInfo
              ? hourInfo.sellers.reduce((sum, s) => sum + s.amount, 0)
              : 0;
            const buyerPct =
              maxVolume > 0
                ? Math.max((buyerVol / maxVolume) * 100, buyerVol > 0 ? 8 : 0)
                : 0;
            const sellerPct =
              maxVolume > 0
                ? Math.max(
                    (sellerVol / maxVolume) * 100,
                    sellerVol > 0 ? 8 : 0
                  )
                : 0;

            return (
              <button
                key={hour}
                ref={isSelected ? selectedRef : undefined}
                onClick={() => onSelectHour(hour)}
                className={`
                  relative flex flex-col items-center gap-1
                  px-3 py-2 rounded-xl
                  text-sm font-medium
                  transition-colors duration-200
                  flex-shrink-0 min-w-[60px] snap-start
                  ${
                    isSelected
                      ? "text-white"
                      : isActiveHour
                        ? "text-[var(--color-text-primary)] bg-white/8 hover:bg-white/12 ring-1 ring-[var(--color-primary-500)]/30"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-white/5 hover:bg-white/10"
                  }
                `}
                aria-label={`${formatHourLabel(hour)}${isCleared ? " - cleared" : ""}${hasActivity ? " - has activity" : ""}`}
                aria-current={isSelected ? "true" : undefined}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeHour"
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl"
                    style={{
                      boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                    }}
                    transition={{
                      type: "spring",
                      bounce: 0.2,
                      duration: 0.6,
                    }}
                  />
                )}
                <span className="relative z-10 text-xs font-mono">
                  {formatHourLabel(hour)}
                </span>
                <span className="relative z-10 flex items-center gap-1">
                  <span
                    className={`
                      w-2 h-2 rounded-full
                      ${
                        isCleared
                          ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                          : hasActivity
                            ? "bg-amber-400 shadow-sm shadow-amber-400/50"
                            : "bg-gray-600"
                      }
                    `}
                  />
                </span>

                {/* Mini stacked volume bars */}
                <div className="relative z-10 flex gap-0.5 w-full h-2 mt-0.5">
                  <div
                    className="rounded-sm bg-emerald-400/60 transition-all duration-300"
                    style={{ width: `${sellerPct}%`, minWidth: sellerVol > 0 ? "2px" : "0" }}
                    title={sellerVol > 0 ? `Sellers: ${sellerVol.toFixed(1)} kWh` : undefined}
                  />
                  <div
                    className="rounded-sm bg-blue-400/60 transition-all duration-300"
                    style={{ width: `${buyerPct}%`, minWidth: buyerVol > 0 ? "2px" : "0" }}
                    title={buyerVol > 0 ? `Buyers: ${buyerVol.toFixed(1)} kWh` : undefined}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Skip to active hour button */}
        <button
          onClick={handleSkipToActive}
          className={`
            flex-shrink-0 flex items-center gap-1.5
            px-3 py-2 rounded-xl text-xs font-medium
            border border-[var(--color-border)] hover:border-[var(--color-border-hover)]
            bg-white/5 hover:bg-white/10
            text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
            transition-all duration-200
          `}
          title={`Jump to current hour (${formatHourLabel(currentActiveHour)})`}
          aria-label={`Skip to active hour ${formatHourLabel(currentActiveHour)}`}
        >
          <SkipForward size={14} />
          <span className="hidden sm:inline">Now</span>
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-[var(--color-text-muted)]">
            Cleared
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-xs text-[var(--color-text-muted)]">
            Pending
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-600" />
          <span className="text-xs text-[var(--color-text-muted)]">
            No activity
          </span>
        </div>
        <span className="text-[var(--color-text-muted)]/50 text-xs">|</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-emerald-400/60" />
          <span className="text-xs text-[var(--color-text-muted)]">
            Seller volume
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-blue-400/60" />
          <span className="text-xs text-[var(--color-text-muted)]">
            Buyer volume
          </span>
        </div>
      </div>
    </div>
  );
};

export default HourSelector;
