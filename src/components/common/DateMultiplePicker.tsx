import React, { useEffect, useMemo } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { ChevronUp, ChevronDown, Clock, Calendar, X, AlertTriangle } from "lucide-react";
import { format, isSameDay, isToday, isBefore, startOfDay } from "date-fns";

interface DateMultiplePickerProps {
  selectedDates: Date[];
  setSelectedDates: (date: Date[]) => void;
  startTime?: Date;
  setStartTime: (date?: Date) => void;
  endTime?: Date;
  setEndTime: (date?: Date) => void;
}

const DateMultiplePicker: React.FC<DateMultiplePickerProps> = ({
  selectedDates,
  setSelectedDates,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
}) => {
  const getNextHour = (hourOffset = 0) => {
    const now = new Date();
    now.setHours(now.getHours() + hourOffset);
    now.setMinutes(0, 0, 0);
    return now;
  };

  const handleSelectDates = (dates: Date[] | undefined) => {
    if (!dates) {
      setSelectedDates([]);
      return;
    }

    const now = new Date();
    const validDates = dates.filter((date) => {
      const dateWithTime = new Date(date);
      dateWithTime.setHours(startTime ? startTime.getHours() : getNextHour(1).getHours());
      dateWithTime.setMinutes(0, 0, 0);
      return dateWithTime >= now;
    });

    setSelectedDates(validDates);
  };

  const removeDate = (dateToRemove: Date) => {
    setSelectedDates(selectedDates.filter((d) => !isSameDay(d, dateToRemove)));
  };

  const adjustHour = (type: "start" | "end", increment: number) => {
    if (type === "start") {
      const current = startTime || getNextHour(1);
      const newDate = new Date(current);
      newDate.setHours((newDate.getHours() + increment + 24) % 24);
      setStartTime(newDate);
    } else {
      const current = endTime || getNextHour(2);
      const newDate = new Date(current);
      newDate.setHours((newDate.getHours() + increment + 24) % 24);
      setEndTime(newDate);
    }
  };

  useEffect(() => {
    if (!startTime) setStartTime(getNextHour(1));
    if (!endTime) setEndTime(getNextHour(2));
  }, []);

  // Calculate hours per day
  const hoursPerDay = useMemo(() => {
    if (!startTime || !endTime) return 0;
    const startH = startTime.getHours();
    const endH = endTime.getHours();
    if (endH > startH) {
      return endH - startH;
    } else if (endH < startH) {
      return 24 - startH + endH;
    }
    return 0;
  }, [startTime, endTime]);

  // Total hours
  const totalHours = selectedDates.length * hoursPerDay;

  // Check if time spans next day
  const spansNextDay = startTime && endTime && endTime.getHours() < startTime.getHours();

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Calendar */}
      <div className="flex justify-center overflow-x-auto pb-2">
        <DayPicker
          showOutsideDays
          mode="multiple"
          selected={selectedDates}
          onSelect={handleSelectDates}
          disabled={{ before: new Date() }}
        />
      </div>

      {/* Selected Dates Display */}
      {selectedDates.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Selected Days
            </span>
            <button
              onClick={() => setSelectedDates([])}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-2 bg-white/5 rounded-xl">
            {selectedDates
              .sort((a, b) => a.getTime() - b.getTime())
              .map((date, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-lg group"
                >
                  <Calendar size={12} className="text-blue-400" />
                  <span className="text-sm font-medium text-blue-300">
                    {format(date, "EEE, MMM d")}
                  </span>
                  <button
                    onClick={() => removeDate(date)}
                    className="p-0.5 rounded hover:bg-blue-500/30 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Summary Badge */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-500/15 border border-blue-500/30 rounded-xl">
          <div className="flex items-center gap-2">
            <span className="text-blue-400 font-bold text-lg">{selectedDates.length}</span>
            <span className="text-blue-300 text-sm">
              {selectedDates.length === 1 ? "day" : "days"}
            </span>
          </div>
          <div className="w-px h-4 bg-blue-500/30" />
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-bold text-lg">{totalHours}</span>
            <span className="text-emerald-300 text-sm">
              {totalHours === 1 ? "hour" : "hours"} total
            </span>
          </div>
        </div>
      </div>

      {/* Time Selection */}
      <div className="p-4 bg-white/5 rounded-xl space-y-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">
          Daily Time Window
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-6">
          {/* Start Time */}
          <div className="flex-1 sm:flex-initial">
            <label className="block text-xs text-gray-500 mb-2 text-center">From</label>
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
                  {startTime ? format(startTime, "HH:00") : "--:00"}
                </span>
              </div>
              <button
                onClick={() => adjustHour("start", 1)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors active:scale-95"
              >
                <ChevronUp size={18} />
              </button>
            </div>
          </div>

          {/* Duration indicator - mobile */}
          <div className="flex sm:hidden items-center justify-center gap-2 py-1">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className="text-xs font-medium text-gray-400 px-2">
              {hoursPerDay}h / day
            </span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          {/* Arrow - desktop */}
          <div className="hidden sm:flex items-center justify-center">
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-px bg-gradient-to-r from-blue-500/50 to-emerald-500/50" />
              <span className="text-[10px] text-gray-500">{hoursPerDay}h</span>
            </div>
          </div>

          {/* End Time */}
          <div className="flex-1 sm:flex-initial">
            <label className="block text-xs text-gray-500 mb-2 text-center">To</label>
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
                  {endTime ? format(endTime, "HH:00") : "--:00"}
                </span>
              </div>
              <button
                onClick={() => adjustHour("end", 1)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors active:scale-95"
              >
                <ChevronUp size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Warning for next day span */}
      {spansNextDay && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/15 border border-amber-500/30 rounded-xl">
          <div className="shrink-0 w-8 h-8 flex items-center justify-center bg-amber-500/20 rounded-lg">
            <AlertTriangle size={18} className="text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-amber-300">Overnight period</p>
            <p className="text-xs text-amber-400/70">
              The time window spans into the next day for each selected date
            </p>
          </div>
        </div>
      )}

      {/* No dates selected helper */}
      {selectedDates.length === 0 && (
        <div className="text-center py-4">
          <Calendar size={32} className="mx-auto text-gray-600 mb-2" />
          <p className="text-sm text-gray-500">Select dates on the calendar above</p>
          <p className="text-xs text-gray-600">You can select multiple non-consecutive days</p>
        </div>
      )}
    </div>
  );
};

export default DateMultiplePicker;