import React from 'react';
import DatePicker from 'react-datepicker';
import TimePicker from 'react-time-picker';
import 'react-datepicker/dist/react-datepicker.css';
import 'react-time-picker/dist/TimePicker.css';
import 'tailwindcss/tailwind.css';

interface DateTimePickerProps {
  startDate: Date;
  setStartDate: (date: Date) => void;
  endDate: Date;
  setEndDate: (date: Date) => void;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}) => {
  const handleStartTimeChange = (value: string) => {
    const [hours, minutes] = value.split(':').map(Number);
    const newStartDate = new Date(startDate);
    newStartDate.setHours(hours);
    newStartDate.setMinutes(0);
    setStartDate(newStartDate);
  };

  const handleEndTimeChange = (value: string) => {
    const [hours, minutes] = value.split(':').map(Number);
    const newEndDate = new Date(endDate);
    newEndDate.setHours(hours);
    newEndDate.setMinutes(0);
    setEndDate(newEndDate);
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg mb-6">
      <h2 className="text-2xl font-semibold mb-4">Select Date Range</h2>
      <div className="mb-4">
        <label className="block text-lg font-medium mb-2">Start Date: </label>
        <DatePicker
          selected={startDate}
          onChange={(date: Date) => setStartDate(date)}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          minDate={new Date()}
          dateFormat="yyyy/MM/dd"
          className="p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="mb-6">
        <label className="block text-lg font-medium mb-2">End Date: </label>
        <DatePicker
          selected={endDate}
          onChange={(date: Date) => setEndDate(date)}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate}
          dateFormat="yyyy/MM/dd"
          className="p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <h2 className="text-2xl font-semibold mb-4">Select Time Range</h2>
      <div className="mb-4">
        <label className="block text-lg font-medium mb-2">Start Time: </label>
        <TimePicker
          onChange={handleStartTimeChange}
          value={startDate.toTimeString().slice(0, 5)}
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
          value={endDate.toTimeString().slice(0, 5)}
          disableClock
          format="HH:mm"
          hourPlaceholder="hh"
          minutePlaceholder="mm"
          clearIcon={null}
          className="p-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

export default DateTimePicker;
