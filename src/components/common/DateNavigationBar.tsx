import React, { useState, useEffect, useCallback } from "react";
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

  const goToPreviousDay = useCallback(() => {
    const prev = new Date(selectedDay);
    prev.setDate(prev.getDate() - 1);
    onDayChange(prev);
  }, [selectedDay, onDayChange]);

  const goToNextDay = useCallback(() => {
    const next = new Date(selectedDay);
    next.setDate(next.getDate() + 1);
    onDayChange(next);
  }, [selectedDay, onDayChange]);

  const goToToday = () => onDayChange(new Date());

  // Keyboard navigation: left/right arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (isCalendarOpen) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPreviousDay();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNextDay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPreviousDay, goToNextDay, isCalendarOpen]);

  const weekday = selectedDay.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = selectedDay.toLocaleDateString("en-US", { month: "long", day: "numeric" });

  return (
    <>
      <div className="flex items-center justify-between p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl mb-6">
        <button
          onClick={goToPreviousDay}
          aria-label="Previous day"
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-white transition-all duration-[var(--transition-fast)] active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCalendarOpen(true)}
            aria-label="Open calendar"
            className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-[var(--transition-fast)]"
          >
            <Calendar size={18} className="text-[var(--color-primary-500)]" />
            <div className="flex flex-col items-start sm:flex-row sm:items-baseline sm:gap-2">
              <span className="text-base sm:text-lg font-bold text-white tracking-tight">
                {weekday}
              </span>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {dateStr}
              </span>
            </div>
          </button>
          {selectedDay.toDateString() !== new Date().toDateString() && (
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs font-medium bg-[var(--color-primary-500)]/15 text-[var(--color-primary-500)] rounded-lg hover:bg-[var(--color-primary-500)]/25 transition-all duration-[var(--transition-fast)] border border-[var(--color-primary-500)]/20"
            >
              Today
            </button>
          )}
        </div>

        <button
          onClick={goToNextDay}
          aria-label="Next day"
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-white transition-all duration-[var(--transition-fast)] active:scale-95"
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
