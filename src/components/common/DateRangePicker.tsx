import React, { useState, useMemo } from "react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { ChevronUp, ChevronDown, Clock, Sun, Moon, Sunrise, Sunset } from "lucide-react";
import { format, addDays, isSameDay, isToday, isBefore, startOfHour, addHours } from "date-fns";

interface DateRangePickerProps {
  startDate?: Date;
  setStartDate: (date?: Date) => void;
  endDate?: Date;
  setEndDate: (date?: Date) => void;
}

// Time period definitions for quick selection
const TIME_PERIODS = [
  { label: "Morning", icon: Sunrise, start: 6, end: 12, color: "amber" },
  { label: "Afternoon", icon: Sun, start: 12, end: 18, color: "yellow" },
  { label: "Evening", icon: Sunset, start: 18, end: 22, color: "orange" },
  { label: "Night", icon: Moon, start: 22, end: 6, color: "indigo" },
];

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}) => {
  const getNextHour = (hourOffset = 0) => {
    const now = new Date();
    now.setHours(now.getHours() + hourOffset);
    now.setMinutes(0, 0, 0);
    return now;
  };

  const setDateRange = (dateRange?: DateRange) => {
    if (!dateRange || !dateRange.from) {
      setStartDate(undefined);
      setEndDate(undefined);
      return;
    }
    const startHours = startDate
      ? startDate.getHours()
      : getNextHour(1).getHours();
    const newStartDate = new Date(dateRange.from);
    newStartDate.setHours(startHours);
    if (newStartDate < new Date()) return;
    setStartDate(newStartDate);
    if (dateRange.to) {
      const endHours = endDate ? endDate.getHours() : getNextHour(2).getHours();
      const newEndDate = new Date(dateRange.to);
      newEndDate.setHours(endHours);
      setEndDate(newEndDate);
    } else {
      setEndDate(new Date(newStartDate.getTime() + 60 * 60 * 1000));
    }
  };

  const adjustHour = (type: "start" | "end", increment: number) => {
    if (type === "start" && startDate) {
      const newDate = new Date(startDate);
      newDate.setHours(newDate.getHours() + increment);
      if (newDate >= new Date()) {
        setStartDate(newDate);
      }
    } else if (type === "end" && endDate) {
      const newDate = new Date(endDate);
      newDate.setHours(newDate.getHours() + increment);
      setEndDate(newDate);
    }
  };

  // Calculate duration
  const duration = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)));
  }, [startDate, endDate]);

  // Check if spanning multiple days
  const isMultiDay = useMemo(() => {
    if (!startDate || !endDate) return false;
    return !isSameDay(startDate, endDate);
  }, [startDate, endDate]);

  // Quick period selection
  const selectTimePeriod = (period: typeof TIME_PERIODS[0]) => {
    if (!startDate) return;
    const newStart = new Date(startDate);
    newStart.setHours(period.start, 0, 0, 0);

    const newEnd = new Date(startDate);
    if (period.end < period.start) {
      // Night period spans to next day
      newEnd.setDate(newEnd.getDate() + 1);
    }
    newEnd.setHours(period.end, 0, 0, 0);

    if (newStart >= new Date()) {
      setStartDate(newStart);
      setEndDate(newEnd);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Calendar */}
      <div className="flex justify-center overflow-x-auto pb-2">
        <DayPicker
          showOutsideDays
          mode="range"
          selected={{ from: startDate, to: endDate }}
          onSelect={setDateRange}
          disabled={{ before: new Date() }}
          footer={
            startDate && (
              <p className="text-center text-xs text-gray-400 mt-2">
                {format(startDate, "MMM d")}
                {endDate && !isSameDay(startDate, endDate) && ` - ${format(endDate, "MMM d")}`}
              </p>
            )
          }
        />
      </div>

      {/* Quick Time Period Selection - Mobile Friendly */}
      {startDate && isSameDay(startDate, endDate || startDate) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TIME_PERIODS.map((period) => {
            const Icon = period.icon;
            const isActive = startDate?.getHours() === period.start;
            const isPast = isToday(startDate) && period.start < new Date().getHours();

            return (
              <button
                key={period.label}
                onClick={() => !isPast && selectTimePeriod(period)}
                disabled={isPast}
                className={`
                  flex flex-col items-center gap-1 p-3 rounded-xl transition-all
                  ${isPast
                    ? "opacity-40 cursor-not-allowed bg-white/5"
                    : isActive
                      ? `bg-${period.color}-500/20 border border-${period.color}-500/40 text-${period.color}-400`
                      : "bg-white/5 hover:bg-white/10 border border-transparent text-gray-400 hover:text-white"
                  }
                `}
              >
                <Icon size={18} />
                <span className="text-xs font-medium">{period.label}</span>
                <span className="text-[10px] opacity-60">
                  {period.start}:00 - {period.end}:00
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Time Selection */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-6">
        {/* Start Time */}
        <div className="flex-1 sm:flex-initial">
          <label className="block text-xs font-semibold text-gray-400 mb-2 text-center uppercase tracking-wide">
            Start Time
          </label>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => adjustHour("start", -1)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors active:scale-95"
            >
              <ChevronDown size={18} />
            </button>
            <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl min-w-[100px] justify-center">
              <Clock size={16} className="text-blue-400" />
              <span className="text-xl font-bold text-white tabular-nums">
                {startDate ? format(startDate, "HH:00") : "--:00"}
              </span>
            </div>
            <button
              onClick={() => adjustHour("start", 1)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors active:scale-95"
            >
              <ChevronUp size={18} />
            </button>
          </div>
          {startDate && (
            <p className="text-[10px] text-gray-500 text-center mt-1">
              {format(startDate, "EEE, MMM d")}
            </p>
          )}
        </div>

        {/* Arrow indicator - hidden on mobile */}
        <div className="hidden sm:flex items-center justify-center">
          <div className="w-12 h-px bg-gradient-to-r from-blue-500/50 to-emerald-500/50 relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-6 border-transparent border-l-emerald-500/50" />
          </div>
        </div>

        {/* Duration indicator - mobile only */}
        <div className="flex sm:hidden items-center justify-center gap-2 py-2">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <span className="text-xs font-medium text-gray-400 px-2">
            {duration} {duration === 1 ? "hour" : "hours"}
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* End Time */}
        <div className="flex-1 sm:flex-initial">
          <label className="block text-xs font-semibold text-gray-400 mb-2 text-center uppercase tracking-wide">
            End Time
          </label>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => adjustHour("end", -1)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors active:scale-95"
            >
              <ChevronDown size={18} />
            </button>
            <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl min-w-[100px] justify-center">
              <Clock size={16} className="text-emerald-400" />
              <span className="text-xl font-bold text-white tabular-nums">
                {endDate ? format(endDate, "HH:00") : "--:00"}
              </span>
            </div>
            <button
              onClick={() => adjustHour("end", 1)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors active:scale-95"
            >
              <ChevronUp size={18} />
            </button>
          </div>
          {endDate && (
            <p className="text-[10px] text-gray-500 text-center mt-1">
              {format(endDate, "EEE, MMM d")}
            </p>
          )}
        </div>
      </div>

      {/* Duration Summary */}
      <div className="flex items-center justify-center gap-4 p-3 bg-gradient-to-r from-blue-500/10 via-transparent to-emerald-500/10 rounded-xl border border-white/5">
        <div className="text-center">
          <p className="text-2xl font-bold text-white">{duration}</p>
          <p className="text-xs text-gray-400">{duration === 1 ? "hour" : "hours"}</p>
        </div>
        {isMultiDay && (
          <>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-xs text-amber-400 font-medium">Multi-day</p>
              <p className="text-[10px] text-gray-500">Spans multiple days</p>
            </div>
          </>
        )}
      </div>

      {/* Next day warning */}
      {endDate && startDate && endDate.getHours() < startDate.getHours() && isSameDay(startDate, endDate) && (
        <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <Moon size={16} className="text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-300">
            This time range spans into the next day
          </p>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
