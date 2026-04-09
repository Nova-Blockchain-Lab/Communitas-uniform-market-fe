import React, { useRef, useEffect, useMemo, useCallback } from "react";
import { motion } from "motion/react";
import { SkipForward } from "lucide-react";
import type { HourData } from "@/hooks/useDashboardData";

interface HourSelectorProps {
  hours: HourData[];
  selectedHour: number;
  onSelectHour: (hour: number) => void;
}

/** Static array [0..23] — never recreated. */
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const formatHourLabel = (hour: number): string =>
  `${hour.toString().padStart(2, "0")}:00`;

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

  // O(1) hour lookup instead of .find() on every render of every button
  const hourMap = useMemo(() => {
    const map = new Map<number, HourData>();
    for (const h of hours) {
      map.set(h.hour, h);
    }
    return map;
  }, [hours]);

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

  const handleSelectHour = useCallback(
    (hour: number) => {
      onSelectHour(hour);
    },
    [onSelectHour],
  );

  const handleSkipToActive = useCallback(() => {
    onSelectHour(currentActiveHour);
  }, [onSelectHour, currentActiveHour]);

  // Keyboard navigation: left/right arrows move selection, Home/End jump
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      let nextHour: number | null = null;

      switch (e.key) {
        case "ArrowRight":
          nextHour = selectedHour < 23 ? selectedHour + 1 : 0;
          break;
        case "ArrowLeft":
          nextHour = selectedHour > 0 ? selectedHour - 1 : 23;
          break;
        case "Home":
          nextHour = 0;
          break;
        case "End":
          nextHour = 23;
          break;
        default:
          return; // don't prevent default for unhandled keys
      }

      e.preventDefault();
      onSelectHour(nextHour);

      // Move focus to the newly selected button
      const container = scrollRef.current;
      if (container) {
        const buttons = container.querySelectorAll<HTMLButtonElement>(
          'button[role="option"]',
        );
        buttons[nextHour]?.focus();
      }
    },
    [selectedHour, onSelectHour],
  );

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        {/* Hour grid: compact 6-col grid on mobile, horizontal scroll on sm+ */}
        <div
          ref={scrollRef}
          role="listbox"
          aria-label="Select trading hour"
          aria-activedescendant={`hour-option-${selectedHour}`}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="
            grid grid-cols-6 gap-1.5
            sm:flex sm:gap-2 sm:overflow-x-auto sm:pb-2
            sm:scrollbar-thin sm:scrollbar-thumb-white/10 sm:scrollbar-track-transparent
            sm:snap-x sm:snap-mandatory
            flex-1
            outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:rounded-xl
          "
          style={{ scrollbarWidth: "thin" }}
        >
          {HOURS.map((hour) => {
            const hourInfo = hourMap.get(hour);
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
                    sellerVol > 0 ? 8 : 0,
                  )
                : 0;

            return (
              <button
                key={hour}
                id={`hour-option-${hour}`}
                role="option"
                aria-selected={isSelected}
                ref={isSelected ? selectedRef : undefined}
                onClick={() => handleSelectHour(hour)}
                tabIndex={-1}
                className={`
                  relative flex flex-col items-center gap-0.5 sm:gap-1
                  px-1.5 py-2.5 sm:px-3 sm:py-2 rounded-xl
                  text-sm font-medium
                  transition-all duration-200 ease-out
                  flex-shrink-0 min-h-[44px] min-w-[44px] sm:min-w-[60px] sm:snap-start
                  outline-none
                  focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent
                  active:scale-95
                  ${
                    isSelected
                      ? "text-white"
                      : isActiveHour
                        ? "text-[var(--color-text-primary)] bg-white/8 hover:bg-white/14 ring-1 ring-[var(--color-primary-500)]/30"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-white/5 hover:bg-white/10"
                  }
                `}
                aria-label={`${formatHourLabel(hour)}${isCleared ? " - cleared" : ""}${hasActivity ? " - has activity" : ""}${isActiveHour ? " - current hour" : ""}`}
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
                <span className="relative z-10 text-[11px] sm:text-xs font-mono leading-tight">
                  {formatHourLabel(hour)}
                </span>
                <span className="relative z-10 flex items-center gap-1">
                  <span
                    className={`
                      w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors duration-200
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
                <div className="relative z-10 flex gap-0.5 w-full h-1.5 sm:h-2 mt-0.5">
                  <div
                    className="rounded-sm bg-emerald-400/60 transition-all duration-300"
                    style={{
                      width: `${sellerPct}%`,
                      minWidth: sellerVol > 0 ? "2px" : "0",
                    }}
                    title={
                      sellerVol > 0
                        ? `Sellers: ${sellerVol.toFixed(1)} kWh`
                        : undefined
                    }
                  />
                  <div
                    className="rounded-sm bg-blue-400/60 transition-all duration-300"
                    style={{
                      width: `${buyerPct}%`,
                      minWidth: buyerVol > 0 ? "2px" : "0",
                    }}
                    title={
                      buyerVol > 0
                        ? `Buyers: ${buyerVol.toFixed(1)} kWh`
                        : undefined
                    }
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Skip to active hour button */}
        <button
          onClick={handleSkipToActive}
          className="
            flex-shrink-0 flex items-center justify-center gap-1.5
            min-h-[44px] min-w-[44px] sm:min-w-0
            px-2.5 sm:px-3 py-2 rounded-xl text-xs font-medium
            border border-[var(--color-border)] hover:border-[var(--color-border-hover)]
            bg-white/5 hover:bg-white/10
            text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]
            transition-all duration-200
            active:scale-95
            outline-none focus-visible:ring-2 focus-visible:ring-blue-400
          "
          title={`Jump to current hour (${formatHourLabel(currentActiveHour)})`}
          aria-label={`Skip to active hour ${formatHourLabel(currentActiveHour)}`}
        >
          <SkipForward size={14} />
          <span className="hidden sm:inline">Now</span>
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 mt-1 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)]">
            Cleared
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)]">
            Pending
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-600" />
          <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)]">
            No activity
          </span>
        </div>
        <span className="text-[var(--color-text-muted)]/50 text-xs hidden sm:inline">|</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-emerald-400/60" />
          <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)]">
            Seller vol.
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm bg-blue-400/60" />
          <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)]">
            Buyer vol.
          </span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(HourSelector);
