import React, { memo } from "react";

interface SwitchProps {
  isChecked: boolean;
  onChange: () => void;
  label: string;
}

export const Switch: React.FC<SwitchProps> = memo(({ isChecked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={isChecked}
    aria-label={label}
    onClick={onChange}
    className="
      relative inline-flex items-center justify-center shrink-0
      min-w-[44px] min-h-[44px]
      rounded-full
      cursor-pointer
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-dark)]
      select-none
    "
  >
    <span
      className={`
        relative inline-flex items-center shrink-0
        w-9 h-5
        rounded-full
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${isChecked ? "bg-[var(--color-primary-500)] shadow-[0_0_8px_rgba(51,112,255,0.4)]" : "bg-white/15"}
      `}
    >
      <span
        className={`
          w-3.5 h-3.5
          inline-block
          rounded-full
          bg-white
          shadow-md
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isChecked ? "translate-x-[18px] scale-110" : "translate-x-[3px]"}
        `}
      />
    </span>
  </button>
));

Switch.displayName = "Switch";

export default Switch;
