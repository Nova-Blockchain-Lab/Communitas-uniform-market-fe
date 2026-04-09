import React, { useState, useCallback, useEffect, useMemo } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { AlertTriangle, Clock } from "lucide-react";

import { getNextHour, computeHourTimestamps } from "@/utils/dateHelpers";

interface DateTimePickerProps {
  onChange: (timestamps: number[]) => void;
  maxHours?: number;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  onChange,
  maxHours = 400,
}) => {
  const [mode, setMode] = useState<"range" | "multiple">("range");

  // Range mode state
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: getNextHour(1),
    to: getNextHour(1),
  });

  // Multiple mode state
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);

  // Hour state
  const defaultStart = getNextHour(1).getHours();
  const defaultEnd = Math.min(defaultStart + 1, 23);
  const [startHour, setStartHour] = useState<number>(defaultStart);
  const [endHour, setEndHour] = useState<number>(defaultEnd + 1); // exclusive

  // Compute and emit timestamps whenever inputs change
  useEffect(() => {
    let days: Date[] = [];

    if (mode === "range" && dateRange?.from) {
      const from = new Date(dateRange.from);
      const to = dateRange.to ? new Date(dateRange.to) : new Date(from);
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
      }
    } else if (mode === "multiple") {
      days = [...selectedDays];
    }

    if (days.length === 0 || startHour >= endHour) {
      onChange([]);
      return;
    }

    const timestamps = computeHourTimestamps(days, startHour, endHour);
    onChange(timestamps.slice(0, maxHours));
  }, [mode, dateRange, selectedDays, startHour, endHour, maxHours, onChange]);

  const handleModeSwitch = useCallback(() => {
    setMode((prev) => (prev === "range" ? "multiple" : "range"));
    setSelectedDays([]);
    setDateRange({ from: getNextHour(1), to: getNextHour(1) });
  }, []);

  const handleRangeSelect = useCallback((range: DateRange | undefined) => {
    setDateRange(range);
  }, []);

  const handleMultipleSelect = useCallback((dates: Date[] | undefined) => {
    setSelectedDays(dates || []);
  }, []);

  const handleStartHourClick = useCallback(
    (h: number) => {
      setStartHour(h);
      if (h >= endHour) setEndHour(Math.min(h + 1, 24));
    },
    [endHour]
  );

  const handleEndHourClick = useCallback((hourValue: number) => {
    setEndHour(hourValue);
  }, []);

  const spansNextDay = endHour <= startHour && endHour !== 0;

  // Determine which hours are in the past (for today only)
  const now = new Date();
  const currentHour = now.getHours();

  const isDayToday = useCallback((days: Date[]): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return days.some((d) => {
      const day = new Date(d);
      day.setHours(0, 0, 0, 0);
      return day.getTime() === today.getTime();
    });
  }, []);

  // Get all selected days to check if today is among them
  const allSelectedDays = useMemo((): Date[] => {
    if (mode === "range" && dateRange?.from) {
      const days: Date[] = [];
      const from = new Date(dateRange.from);
      const to = dateRange.to ? new Date(dateRange.to) : new Date(from);
      for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
      }
      return days;
    }
    return selectedDays;
  }, [mode, dateRange, selectedDays]);

  const hasTodaySelected = useMemo(
    () => isDayToday(allSelectedDays),
    [isDayToday, allSelectedDays]
  );

  // Memoize disabled date matcher
  const disabledMatcher = useMemo(() => ({ before: new Date() }), []);

  // Time range bar percentages
  const timeBarStyle = useMemo(
    () => ({
      left: `${(startHour / 24) * 100}%`,
      width: `${((endHour - startHour) / 24) * 100}%`,
    }),
    [startHour, endHour]
  );

  // Quick preset handlers
  const setPresetToday = useCallback(() => {
    const today = new Date();
    setMode("range");
    setDateRange({ from: today, to: today });
    const nextHour = Math.min(new Date().getHours() + 1, 23);
    setStartHour(nextHour);
    setEndHour(24);
  }, []);

  const setPresetTomorrow = useCallback(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setMode("range");
    setDateRange({ from: tomorrow, to: tomorrow });
    setStartHour(0);
    setEndHour(24);
  }, []);

  return (
    <div className="space-y-6">
      {/* Quick Preset Buttons */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={setPresetToday}
          className="min-h-[44px] px-4 py-2 text-xs font-medium rounded-lg bg-[var(--color-primary-500)]/10 text-[var(--color-primary-400)] hover:bg-[var(--color-primary-500)]/20 border border-[var(--color-primary-500)]/20 transition-all duration-[var(--transition-fast)] active:scale-95"
        >
          Today
        </button>
        <button
          onClick={setPresetTomorrow}
          className="min-h-[44px] px-4 py-2 text-xs font-medium rounded-lg bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10 hover:text-white border border-[var(--color-border)] transition-all duration-[var(--transition-fast)] active:scale-95"
        >
          Tomorrow
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center p-1 bg-white/5 rounded-xl border border-[var(--color-border)]">
          <button
            onClick={() => {
              if (mode !== "range") handleModeSwitch();
            }}
            className={`
              min-h-[44px] px-4 py-2 text-sm font-medium rounded-lg transition-all duration-[var(--transition-base)]
              ${mode === "range"
                ? "bg-[var(--color-primary-600)] text-white shadow-lg shadow-[var(--color-primary-500)]/30"
                : "text-[var(--color-text-secondary)] hover:text-white"
              }
            `}
          >
            Date Range
          </button>
          <button
            onClick={() => {
              if (mode !== "multiple") handleModeSwitch();
            }}
            className={`
              min-h-[44px] px-4 py-2 text-sm font-medium rounded-lg transition-all duration-[var(--transition-base)]
              ${mode === "multiple"
                ? "bg-[var(--color-primary-600)] text-white shadow-lg shadow-[var(--color-primary-500)]/30"
                : "text-[var(--color-text-secondary)] hover:text-white"
              }
            `}
          >
            Pick Days
          </button>
        </div>
      </div>

      {/* Calendar — full-width on mobile */}
      <div className="flex justify-center [&_.rdp-root]:w-full [&_.rdp-root]:max-w-full [&_.rdp-root]:sm:w-auto [&_.rdp-months]:w-full [&_.rdp-months]:sm:w-auto [&_.rdp-month]:w-full [&_.rdp-month]:sm:w-auto [&_.rdp-month_table]:w-full [&_.rdp-month_table]:sm:w-auto">
        {mode === "range" ? (
          <DayPicker
            showOutsideDays
            mode="range"
            selected={dateRange}
            onSelect={handleRangeSelect}
            disabled={disabledMatcher}
          />
        ) : (
          <DayPicker
            showOutsideDays
            mode="multiple"
            selected={selectedDays}
            onSelect={handleMultipleSelect}
            disabled={disabledMatcher}
          />
        )}
      </div>

      {/* Selected count for multiple mode */}
      {mode === "multiple" && selectedDays.length > 0 && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary-500)]/15 border border-[var(--color-primary-500)]/30 rounded-xl">
            <span className="text-[var(--color-primary-400)] font-semibold">{selectedDays.length}</span>
            <span className="text-[var(--color-primary-300)] text-sm">
              {selectedDays.length === 1 ? "day" : "days"} selected
            </span>
          </div>
        </div>
      )}

      {/* Visual Time Range Indicator */}
      {startHour < endHour && (
        <div className="px-1">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-[var(--color-primary-400)]" />
            <span className="text-xs text-[var(--color-text-secondary)]">
              Hours {String(startHour).padStart(2, "0")} &ndash; {String(endHour - 1).padStart(2, "0")} ({endHour - startHour}h)
            </span>
          </div>
          <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-primary-400)] rounded-full transition-all duration-[var(--transition-slow)]"
              style={timeBarStyle}
            />
            {/* Hour markers */}
            {[0, 6, 12, 18, 24].map((h) => (
              <div
                key={h}
                className="absolute top-0 bottom-0 w-px bg-white/10"
                style={{ left: `${(h / 24) * 100}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-[var(--color-text-muted)]">
            <span>00</span>
            <span>06</span>
            <span>12</span>
            <span>18</span>
            <span>24</span>
          </div>
        </div>
      )}

      {/* Hour Grid: Start */}
      <div>
        <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-3 uppercase tracking-wide text-center">
          Start Hour
        </label>
        <div className="grid grid-cols-4 min-[400px]:grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1.5">
          {HOURS.map((h) => {
            const isPast = hasTodaySelected && h <= currentHour;
            const isSelected = h === startHour;
            const isInRange = h >= startHour && h < endHour;

            return (
              <button
                key={`start-${h}`}
                onClick={() => handleStartHourClick(h)}
                disabled={isPast}
                className={`
                  min-h-[44px] py-2 text-sm font-mono rounded-lg transition-all duration-[var(--transition-fast)]
                  ${isSelected
                    ? "bg-[var(--color-primary-600)] text-white shadow-lg shadow-[var(--color-primary-500)]/30 ring-1 ring-[var(--color-primary-400)]"
                    : isPast
                      ? "bg-white/5 text-[var(--color-text-muted)] opacity-30 cursor-not-allowed"
                      : isInRange
                        ? "bg-[var(--color-primary-500)]/10 text-[var(--color-primary-300)] hover:bg-[var(--color-primary-500)]/20"
                        : "bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10 hover:text-white"
                  }
                  active:scale-95
                `}
              >
                {String(h).padStart(2, "0")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hour Grid: End */}
      <div>
        <label className="block text-sm font-semibold text-[var(--color-text-secondary)] mb-3 uppercase tracking-wide text-center">
          Last Hour
        </label>
        <div className="grid grid-cols-4 min-[400px]:grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1.5">
          {HOURS.map((h) => {
            // End hour is exclusive, so endHour = h+1 means "up to h:59"
            const hourValue = h + 1;
            const isPast = hasTodaySelected && h < currentHour;
            const isSelected = hourValue === endHour;
            const isBefore = hourValue <= startHour;
            const isInRange = hourValue > startHour && hourValue <= endHour && !isSelected;

            return (
              <button
                key={`end-${h}`}
                onClick={() => handleEndHourClick(hourValue)}
                disabled={isPast || isBefore}
                className={`
                  min-h-[44px] py-2 text-sm font-mono rounded-lg transition-all duration-[var(--transition-fast)]
                  ${isSelected
                    ? "bg-[var(--color-primary-600)] text-white shadow-lg shadow-[var(--color-primary-500)]/30 ring-1 ring-[var(--color-primary-400)]"
                    : isPast || isBefore
                      ? "bg-white/5 text-[var(--color-text-muted)] opacity-30 cursor-not-allowed"
                      : isInRange
                        ? "bg-[var(--color-primary-500)]/10 text-[var(--color-primary-300)] hover:bg-[var(--color-primary-500)]/20"
                        : "bg-white/5 text-[var(--color-text-secondary)] hover:bg-white/10 hover:text-white"
                  }
                  active:scale-95
                `}
              >
                {String(h).padStart(2, "0")}
              </button>
            );
          })}
        </div>
      </div>

      {/* Warning for next-day spans */}
      {spansNextDay && (
        <div className="flex justify-center">
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/15 border border-amber-500/30 rounded-xl max-w-md">
            <AlertTriangle size={18} className="text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-300">
              The selected hours span into the next day. Please ensure this is intended.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;
