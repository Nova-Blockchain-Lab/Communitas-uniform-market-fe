import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  const modalRef = useRef<HTMLDivElement>(null);

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

  const goToToday = useCallback(() => onDayChange(new Date()), [onDayChange]);

  const openCalendar = useCallback(() => setIsCalendarOpen(true), []);
  const closeCalendar = useCallback(() => setIsCalendarOpen(false), []);

  const handleDaySelect = useCallback(
    (day: Date | undefined) => {
      if (day) {
        onDayChange(day);
        setIsCalendarOpen(false);
      }
    },
    [onDayChange]
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        closeCalendar();
      }
    },
    [closeCalendar]
  );

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

  // Close on Escape key
  useEffect(() => {
    if (!isCalendarOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCalendar();
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isCalendarOpen, closeCalendar]);

  // Lock body scroll when modal open
  useEffect(() => {
    if (isCalendarOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isCalendarOpen]);

  const weekday = useMemo(
    () => selectedDay.toLocaleDateString("en-US", { weekday: "long" }),
    [selectedDay]
  );

  const dateStr = useMemo(
    () => selectedDay.toLocaleDateString("en-US", { month: "long", day: "numeric" }),
    [selectedDay]
  );

  const isToday = useMemo(
    () => selectedDay.toDateString() === new Date().toDateString(),
    [selectedDay]
  );

  return (
    <>
      <div className="flex items-center justify-between p-3 sm:p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl mb-6 gap-2">
        <button
          onClick={goToPreviousDay}
          aria-label="Previous day"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-white transition-all duration-[var(--transition-fast)] active:scale-95 shrink-0"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={openCalendar}
            aria-label="Open calendar"
            className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-[var(--transition-fast)] min-h-[44px] min-w-0 active:scale-[0.98]"
          >
            <Calendar size={18} className="text-[var(--color-primary-500)] shrink-0" />
            <div className="flex flex-col items-start sm:flex-row sm:items-baseline sm:gap-2 min-w-0">
              <span className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                {weekday}
              </span>
              <span className="text-xs sm:text-sm text-[var(--color-text-secondary)] truncate">
                {dateStr}
              </span>
            </div>
          </button>
          {!isToday && (
            <button
              onClick={goToToday}
              className="min-h-[44px] px-3 py-1.5 text-xs font-medium bg-[var(--color-primary-500)]/15 text-[var(--color-primary-500)] rounded-lg hover:bg-[var(--color-primary-500)]/25 transition-all duration-[var(--transition-fast)] border border-[var(--color-primary-500)]/20 shrink-0 active:scale-95"
            >
              Today
            </button>
          )}
        </div>

        <button
          onClick={goToNextDay}
          aria-label="Next day"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-white transition-all duration-[var(--transition-fast)] active:scale-95 shrink-0"
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
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
            onClick={handleBackdropClick}
          >
            <motion.div
              ref={modalRef}
              initial={{ y: 40, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 w-full sm:w-auto sm:max-w-md max-h-[85vh] overflow-y-auto [&_.rdp-root]:w-full [&_.rdp-root]:sm:w-auto [&_.rdp-months]:w-full [&_.rdp-months]:sm:w-auto [&_.rdp-month]:w-full [&_.rdp-month]:sm:w-auto [&_.rdp-month_table]:w-full [&_.rdp-month_table]:sm:w-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Date picker"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Select Date</h3>
                <button
                  onClick={closeCalendar}
                  aria-label="Close calendar"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-white transition-colors duration-[var(--transition-fast)]"
                >
                  <X size={18} />
                </button>
              </div>
              <DayPicker
                mode="single"
                selected={selectedDay}
                onSelect={handleDaySelect}
                className="!bg-transparent"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default DateNavigationBar;
