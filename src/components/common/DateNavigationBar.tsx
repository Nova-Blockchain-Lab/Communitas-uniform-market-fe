import React, { useEffect, useRef } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface DateNavigationBarProps {
  selectedDay: Date;
  onDayChange: (day: Date) => void;
}

const shiftDay = (day: Date, delta: number) => {
  const d = new Date(day);
  d.setDate(d.getDate() + delta);
  return d;
};

const NAV_BUTTON =
  "min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-[var(--color-text-secondary)] hover:text-white transition-all duration-[var(--transition-fast)] active:scale-95 shrink-0";

const DateNavigationBar: React.FC<DateNavigationBarProps> = ({ selectedDay, onDayChange }) => {
  const dateInputRef = useRef<HTMLInputElement>(null);
  const isToday = selectedDay.toDateString() === new Date().toDateString();

  // Left/right arrow keys step a day, unless the user is typing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        onDayChange(shiftDay(selectedDay, e.key === "ArrowLeft" ? -1 : 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDay, onDayChange]);

  // The native picker. "YYYY-MM-DD" is read as a local date so the day does not shift by timezone.
  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [y, m, d] = e.target.value.split("-").map(Number);
    if (y && m && d) onDayChange(new Date(y, m - 1, d));
  };

  return (
    <div className="flex flex-col xs:flex-row items-center justify-between p-3 sm:p-4 bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-xl mb-6 gap-2">
      <div className="flex items-center justify-between w-full xs:w-auto xs:flex-1 gap-2">
        <button onClick={() => onDayChange(shiftDay(selectedDay, -1))} aria-label="Previous day" className={NAV_BUTTON}>
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 xs:flex-initial justify-center">
          <div className="relative min-w-0">
            <button
              onClick={() => dateInputRef.current?.showPicker?.()}
              aria-label={`Pick a date, ${format(selectedDay, "EEEE MMMM d")}`}
              className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-[var(--transition-fast)] min-h-[44px] min-w-0 active:scale-[0.98]"
            >
              <Calendar size={18} className="text-[var(--color-primary-500)] shrink-0" />
              <div className="flex flex-col items-start sm:flex-row sm:items-baseline sm:gap-2 min-w-0">
                <span className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                  {/* Short weekday on very small screens, full on larger */}
                  <span className="hidden min-[400px]:inline">{format(selectedDay, "EEEE")}</span>
                  <span className="inline min-[400px]:hidden">{format(selectedDay, "EEE")}</span>
                </span>
                <span className="text-xs sm:text-sm text-[var(--color-text-secondary)] truncate">
                  {format(selectedDay, "MMMM d")}
                </span>
              </div>
            </button>
            {/* Invisible, anchored under the button so the native picker opens there */}
            <input
              ref={dateInputRef}
              type="date"
              value={format(selectedDay, "yyyy-MM-dd")}
              onChange={handleDateInput}
              tabIndex={-1}
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-0 w-full opacity-0 pointer-events-none"
            />
          </div>
          {!isToday && (
            <button
              onClick={() => onDayChange(new Date())}
              className="min-h-[44px] px-3 py-1.5 text-xs font-medium bg-[var(--color-primary-500)]/15 text-[var(--color-primary-500)] rounded-lg hover:bg-[var(--color-primary-500)]/25 transition-all duration-[var(--transition-fast)] border border-[var(--color-primary-500)]/20 shrink-0 active:scale-95"
            >
              Today
            </button>
          )}
        </div>

        <button onClick={() => onDayChange(shiftDay(selectedDay, 1))} aria-label="Next day" className={NAV_BUTTON}>
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default DateNavigationBar;
