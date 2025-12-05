import React from "react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";
import "react-time-picker/dist/TimePicker.css";
import TimePicker from "react-time-picker";
import { Value } from "react-time-picker/dist/cjs/shared/types";

interface DateRangePickerProps {
  startDate?: Date;
  setStartDate: (date?: Date) => void;
  endDate?: Date;
  setEndDate: (date?: Date) => void;
}

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
      setEndDate(new Date(newStartDate.getTime() + 60 * 60 * 1000)); // 1 hour later
      return;
    }
  };

  const handleStartTimeChange = (value: Value) => {
    if (!startDate || !value) return;
    const [hours, minutes] = value.split(":").map(Number);
    const newStartDate = new Date(startDate);
    newStartDate.setHours(hours);
    newStartDate.setMinutes(0);
    newStartDate.setSeconds(0);
    setStartDate(newStartDate);
  };

  const handleEndTimeChange = (value: Value) => {
    if (!endDate || !value) return;
    const [hours, minutes] = value.split(":").map(Number);
    const newEndDate = new Date(endDate);
    newEndDate.setHours(hours);
    newEndDate.setMinutes(0);
    newEndDate.setSeconds(0);
    setEndDate(newEndDate);
  };

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div className="flex justify-center">
        <DayPicker
          showOutsideDays
          mode="range"
          selected={{ from: startDate, to: endDate }}
          onSelect={setDateRange}
        />
      </div>

      {/* Time Pickers */}
      <div className="flex justify-center">
        <div className="flex items-center gap-8">
          {/* Start Time */}
          <div className="flex flex-col items-center">
            <label className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
              Start Time
            </label>
            <div className="relative">
              <TimePicker
                onChange={handleStartTimeChange}
                value={
                  startDate
                    ? startDate.toTimeString().slice(0, 5)
                    : getNextHour(1).toTimeString().slice(0, 5)
                }
                disableClock
                format="HH:mm"
                hourPlaceholder="hh"
                minutePlaceholder="mm"
                clearIcon={null}
              />
            </div>
          </div>

          {/* Divider */}
          <div className="h-12 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />

          {/* End Time */}
          <div className="flex flex-col items-center">
            <label className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wide">
              End Time
            </label>
            <div className="relative">
              <TimePicker
                onChange={handleEndTimeChange}
                value={
                  endDate
                    ? endDate.toTimeString().slice(0, 5)
                    : getNextHour(2).toTimeString().slice(0, 5)
                }
                disableClock
                format="HH:mm"
                hourPlaceholder="hh"
                minutePlaceholder="mm"
                clearIcon={null}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;
