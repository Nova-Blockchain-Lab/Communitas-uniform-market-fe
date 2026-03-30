import React, { useState, useCallback, useEffect } from "react";
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

  const handleModeSwitch = () => {
    setMode((prev) => (prev === "range" ? "multiple" : "range"));
    setSelectedDays([]);
    setDateRange({ from: getNextHour(1), to: getNextHour(1) });
  };

  const spansNextDay = endHour <= startHour && endHour !== 0;

  // Determine which hours are in the past (for today only)
  const now = new Date();
  const currentHour = now.getHours();

  const isDayToday = (days: Date[]): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return days.some((d) => {
      const day = new Date(d);
      day.setHours(0, 0, 0, 0);
      return day.getTime() === today.getTime();
    });
  };

  // Get all selected days to check if today is among them
  const getAllSelectedDays = (): Date[] => {
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
  };

  const hasTodaySelected = isDayToday(getAllSelectedDays());

  // Quick preset handlers
  const setPresetToday = () => {
    const today = new Date();
    setMode("range");
    setDateRange({ from: today, to: today });
    const nextHour = Math.min(new Date().getHours() + 1, 23);
    setStartHour(nextHour);
    setEndHour(24);
  };

  const setPresetTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setMode("range");
    setDateRange({ from: tomorrow, to: tomorrow });
    setStartHour(0);
    setEndHour(24);
  };

  return (
    <div className="space-y-6">
      {/* Quick Preset Buttons */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={setPresetToday}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-all"
        >
          Today
        </button>
        <button
          onClick={setPresetTomorrow}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10 transition-all"
        >
          Tomorrow
        </button>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center justify-center">
        <div className="inline-flex items-center p-1 bg-white/5 rounded-xl border border-white/10">
          <button
            onClick={() => {
              if (mode !== "range") handleModeSwitch();
            }}
            className={`
              px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
              ${mode === "range"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "text-gray-400 hover:text-white"
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
              px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
              ${mode === "multiple"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "text-gray-400 hover:text-white"
              }
            `}
          >
            Pick Days
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex justify-center">
        {mode === "range" ? (
          <DayPicker
            showOutsideDays
            mode="range"
            selected={dateRange}
            onSelect={setDateRange}
            disabled={{ before: new Date() }}
          />
        ) : (
          <DayPicker
            showOutsideDays
            mode="multiple"
            selected={selectedDays}
            onSelect={(dates) => setSelectedDays(dates || [])}
            disabled={{ before: new Date() }}
          />
        )}
      </div>

      {/* Selected count for multiple mode */}
      {mode === "multiple" && selectedDays.length > 0 && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/15 border border-blue-500/30 rounded-xl">
            <span className="text-blue-400 font-semibold">{selectedDays.length}</span>
            <span className="text-blue-300 text-sm">
              {selectedDays.length === 1 ? "day" : "days"} selected
            </span>
          </div>
        </div>
      )}

      {/* Visual Time Range Indicator */}
      {startHour < endHour && (
        <div className="px-1">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-blue-400" />
            <span className="text-xs text-gray-400">
              Hours {String(startHour).padStart(2, "0")} &ndash; {String(endHour - 1).padStart(2, "0")} ({endHour - startHour}h)
            </span>
          </div>
          <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full transition-all duration-300"
              style={{
                left: `${(startHour / 24) * 100}%`,
                width: `${((endHour - startHour) / 24) * 100}%`,
              }}
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
          <div className="flex justify-between mt-1 text-[10px] text-gray-600">
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
        <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide text-center">
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
                onClick={() => {
                  setStartHour(h);
                  if (h >= endHour) setEndHour(Math.min(h + 1, 24));
                }}
                disabled={isPast}
                className={`
                  py-2 text-sm font-mono rounded-lg transition-all duration-150
                  ${isSelected
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-400"
                    : isPast
                      ? "bg-white/5 text-gray-600 opacity-30 cursor-not-allowed"
                      : isInRange
                        ? "bg-blue-500/10 text-blue-300 hover:bg-blue-500/20"
                        : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                  }
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
        <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide text-center">
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
                onClick={() => setEndHour(hourValue)}
                disabled={isPast || isBefore}
                className={`
                  py-2 text-sm font-mono rounded-lg transition-all duration-150
                  ${isSelected
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-400"
                    : isPast || isBefore
                      ? "bg-white/5 text-gray-600 opacity-30 cursor-not-allowed"
                      : isInRange
                        ? "bg-blue-500/10 text-blue-300 hover:bg-blue-500/20"
                        : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white"
                  }
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
