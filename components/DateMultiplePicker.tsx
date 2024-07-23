import React, { useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

import "react-time-picker/dist/TimePicker.css";

import "react-clock/dist/Clock.css";
import "tailwindcss/tailwind.css";
import { Alert, AlertIcon } from "@chakra-ui/react";
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
    <>
      <div className="flex justify-center mb-2">
        <DayPicker
          showOutsideDays
          mode="multiple"
          selected={selectedDates}
          onSelect={(dates) => handleSelectDates(dates || [])}
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
                startTime
                  ? startTime.toTimeString().slice(0, 5)
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
                endTime
                  ? endTime.toTimeString().slice(0, 5)
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
      {startTime && endTime && endTime.getHours() < startTime.getHours() && (
        <div className="flex justify-center">
          <Alert status="warning" variant="subtle" className="mt-4" width="50%">
            <AlertIcon />
            The selected hours span into the next day. Please ensure this is
            intended.
          </Alert>
        </div>
      )}
    </>
  );
};

export default DateMultiplePicker;
