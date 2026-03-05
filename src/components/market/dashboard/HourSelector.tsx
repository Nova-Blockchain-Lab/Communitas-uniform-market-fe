import React, { useRef, useEffect } from "react";
import { motion } from "motion/react";
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

  return (
    <div className="mb-6">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent snap-x snap-mandatory"
        style={{ scrollbarWidth: "thin" }}
      >
        {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
          const hourInfo = getHourData(hour);
          const isSelected = selectedHour === hour;
          const isCleared = hourInfo?.isCleared ?? false;
          const hasActivity =
            (hourInfo?.buyers.length ?? 0) > 0 ||
            (hourInfo?.sellers.length ?? 0) > 0;

          return (
            <button
              key={hour}
              ref={isSelected ? selectedRef : undefined}
              onClick={() => onSelectHour(hour)}
              className={`
                relative flex flex-col items-center gap-1.5
                px-3 py-2.5 rounded-xl
                text-sm font-medium
                transition-colors duration-200
                flex-shrink-0 min-w-[60px] snap-start
                ${
                  isSelected
                    ? "text-white"
                    : "text-gray-400 hover:text-gray-200 bg-white/5 hover:bg-white/10"
                }
              `}
              aria-label={`${formatHourLabel(hour)}${isCleared ? " - cleared" : ""}${hasActivity ? " - has activity" : ""}`}
              aria-current={isSelected ? "true" : undefined}
            >
              {isSelected && (
                <motion.div
                  layoutId="activeHour"
                  className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl"
                  style={{ boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)" }}
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
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
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-gray-500">Cleared</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-xs text-gray-500">Pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gray-600" />
          <span className="text-xs text-gray-500">No activity</span>
        </div>
      </div>
    </div>
  );
};

export default HourSelector;
