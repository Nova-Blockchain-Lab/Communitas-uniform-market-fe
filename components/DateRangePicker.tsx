import React from "react";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/dist/style.css";

import "react-time-picker/dist/TimePicker.css";
import "tailwindcss/tailwind.css";
import TimePicker from "react-time-picker";

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
    if (newStartDate < new Date())
      return;
    setStartDate(newStartDate);
    if (dateRange.to) {
      const endHours = endDate
        ? endDate.getHours()
        : getNextHour(2).getHours();
      const newEndDate = new Date(dateRange.to);
      newEndDate.setHours(endHours);
      setEndDate(newEndDate);
    } else {
      setEndDate(new Date(newStartDate.getTime() + 60 * 60 * 1000)); // 1 hour later
      return;
    }
  };

  const handleStartTimeChange = (value: string) => {
    if (!startDate) return;
    const [hours, minutes] = value.split(":").map(Number);
    const newStartDate = new Date(startDate);
    newStartDate.setHours(hours);
    newStartDate.setMinutes(0);
    newStartDate.setSeconds(0);
    setStartDate(newStartDate);
  };

  const handleEndTimeChange = (value: string) => {
    if (!endDate) return;
    const [hours, minutes] = value.split(":").map(Number);
    const newEndDate = new Date(endDate);
    newEndDate.setHours(hours);
    newEndDate.setMinutes(0);
    newEndDate.setSeconds(0);
    setEndDate(newEndDate);
  };

  console.log(startDate, endDate);

  return (
    <>
      <div className="flex justify-center mb-2">
      <DayPicker
      showOutsideDays
      mode="range"
      selected={{ from: startDate, to: endDate }}
      onSelect={setDateRange}
    />
      </div>
      <div className="flex justify-center mb-2">
        <div className="flex items-center">
          <div className="mr-8">
            <label className="block text-lg font-medium mb-2">
              Start Time:{" "}
            </label>
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
              className="p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-lg font-medium mb-2">End Time: </label>
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
              className="p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default DateRangePicker;
