import React, { useState } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { motion, AnimatePresence } from "motion/react";
import "react-day-picker/dist/style.css";

interface DateNavigationBarProps {
  selectedDay: Date;
  onDayChange: (day: Date) => void;
}

const DateNavigationBar: React.FC<DateNavigationBarProps> = ({
  selectedDay,
  onDayChange,
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const goToPreviousDay = () => {
    const prev = new Date(selectedDay);
    prev.setDate(prev.getDate() - 1);
    onDayChange(prev);
  };

  const goToNextDay = () => {
    const next = new Date(selectedDay);
    next.setDate(next.getDate() + 1);
    onDayChange(next);
  };

  const goToToday = () => onDayChange(new Date());

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl mb-6">
        <button
          onClick={goToPreviousDay}
          aria-label="Previous day"
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCalendarOpen(true)}
            aria-label="Open calendar"
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Calendar size={18} className="text-gray-400" />
            <span className="text-white font-medium">
              {selectedDay.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
          </button>
          {selectedDay.toDateString() !== new Date().toDateString() && (
            <button
              onClick={goToToday}
              className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              Today
            </button>
          )}
        </div>

        <button
          onClick={goToNextDay}
          aria-label="Next day"
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Calendar Modal */}
      <AnimatePresence>
        {isCalendarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setIsCalendarOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-900 border border-white/10 rounded-2xl p-6"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-label="Date picker"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Select Date</h3>
                <button
                  onClick={() => setIsCalendarOpen(false)}
                  aria-label="Close calendar"
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400"
                >
                  <X size={18} />
                </button>
              </div>
              <DayPicker
                mode="single"
                selected={selectedDay}
                onSelect={(day) => {
                  if (day) {
                    onDayChange(day);
                    setIsCalendarOpen(false);
                  }
                }}
                className="!bg-transparent"
                classNames={{
                  day_selected: "bg-blue-500 text-white rounded-lg",
                  day_today: "font-bold text-blue-400",
                }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DateNavigationBar;
