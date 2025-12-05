import React, { useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import TimePicker from "react-time-picker";
import { Value } from "react-time-picker/dist/cjs/shared/types";

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

  const handleSelectDates = (dates: Date[]) => {
    const now = new Date();
    for (let i = 0; i < dates.length; i++) {
      dates[i].setHours(
        startTime ? startTime.getHours() : getNextHour(1).getHours()
      );
      dates[i].setMinutes(0);
      if (dates[i] < now) {
        dates.splice(i, 1); // delete date if it is in the past
      }
    }

    setSelectedDates(dates);
  };

  const handleStartTimeChange = (value: Value) => {
    if (!value) return;
    const [hours, minutes] = value.split(":").map(Number);
    const newStartTime = new Date();
    newStartTime.setHours(hours);
    newStartTime.setMinutes(0);
    newStartTime.setMilliseconds(0);
    setStartTime(newStartTime);
  };

  const handleEndTimeChange = (value: Value) => {
    if (!value) return;
    const [hours, minutes] = value.split(":").map(Number);
    const newEndTime = new Date();
    newEndTime.setHours(hours);
    newEndTime.setMinutes(0);
    newEndTime.setMilliseconds(0);
    setEndTime(newEndTime);
  };

  useEffect(() => {
    if (!startTime) setStartTime(getNextHour(1));
    if (!endTime) setEndTime(getNextHour(2));
  }, []);

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div className="flex justify-center">
        <DayPicker
          showOutsideDays
          mode="multiple"
          selected={selectedDates}
          onSelect={(dates) => handleSelectDates(dates || [])}
        />
      </div>

      {/* Selected dates count */}
      {selectedDates.length > 0 && (
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/15 border border-blue-500/30 rounded-xl">
            <span className="text-blue-400 font-semibold">{selectedDates.length}</span>
            <span className="text-blue-300 text-sm">
              {selectedDates.length === 1 ? "day" : "days"} selected
            </span>
          </div>
        </div>
      )}

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
                  startTime
                    ? startTime.toTimeString().slice(0, 5)
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
                  endTime
                    ? endTime.toTimeString().slice(0, 5)
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

      {/* Warning for next day span */}
      {startTime && endTime && endTime.getHours() < startTime.getHours() && (
        <div className="flex justify-center">
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/15 border border-amber-500/30 rounded-xl max-w-md">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-amber-500/20 rounded-lg">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-sm text-amber-300">
              The selected hours span into the next day. Please ensure this is intended.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateMultiplePicker;
