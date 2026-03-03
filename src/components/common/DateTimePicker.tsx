import React, { useState, useCallback, useEffect } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { AlertTriangle } from "lucide-react";

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

  return (
    <div className="space-y-6">
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
          />
        ) : (
          <DayPicker
            showOutsideDays
            mode="multiple"
            selected={selectedDays}
            onSelect={(dates) => setSelectedDays(dates || [])}
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

      {/* Hour Grid: Start */}
      <div>
        <label className="block text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide text-center">
          Start Hour
        </label>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1.5">
          {HOURS.map((h) => {
            const isPast = hasTodaySelected && h <= currentHour;
            const isSelected = h === startHour;

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
          End Hour
        </label>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1.5">
          {HOURS.map((h) => {
            // End hour is exclusive, so endHour = h+1 means "up to h:59"
            const hourValue = h + 1;
            const isPast = hasTodaySelected && h < currentHour;
            const isSelected = hourValue === endHour;
            const isBefore = hourValue <= startHour;

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
