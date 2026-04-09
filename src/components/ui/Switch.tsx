import React from "react";

interface SwitchProps {
  isChecked: boolean;
  onChange: () => void;
  size?: "sm" | "md" | "lg";
  colorScheme?: "blue" | "green" | "emerald";
  disabled?: boolean;
  label?: string;
}

const sizeClasses = {
  sm: {
    track: "w-9 h-5",
    thumb: "w-3.5 h-3.5",
    translate: "translate-x-[18px]",
    rest: "translate-x-[3px]",
    tapArea: "min-w-[44px] min-h-[44px]",
  },
  md: {
    track: "w-11 h-6",
    thumb: "w-4.5 h-4.5",
    translate: "translate-x-[22px]",
    rest: "translate-x-[3px]",
    tapArea: "min-w-[44px] min-h-[44px]",
  },
  lg: {
    track: "w-13 h-7",
    thumb: "w-5.5 h-5.5",
    translate: "translate-x-[26px]",
    rest: "translate-x-[3px]",
    tapArea: "min-w-[52px] min-h-[44px]",
  },
};

const colorClasses = {
  blue: { active: "bg-[var(--color-primary-500)]", glow: "shadow-[0_0_8px_rgba(51,112,255,0.4)]" },
  green: { active: "bg-green-500", glow: "shadow-[0_0_8px_rgba(34,197,94,0.4)]" },
  emerald: { active: "bg-emerald-500", glow: "shadow-[0_0_8px_rgba(16,185,129,0.4)]" },
};

export const Switch: React.FC<SwitchProps> = ({
  isChecked,
  onChange,
  size = "md",
  colorScheme = "blue",
  disabled = false,
  label,
}) => {
  const sizes = sizeClasses[size];
  const colors = colorClasses[colorScheme];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`
        relative inline-flex items-center justify-center shrink-0
        ${sizes.tapArea}
        rounded-full
        cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-dark)]
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        select-none
        -webkit-tap-highlight-color-transparent
      `}
    >
      <span
        className={`
          relative inline-flex items-center shrink-0
          ${sizes.track}
          rounded-full
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${isChecked ? `${colors.active} ${colors.glow}` : "bg-white/15"}
        `}
      >
        <span
          className={`
            ${sizes.thumb}
            inline-block
            rounded-full
            bg-white
            shadow-md
            transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
            ${isChecked ? sizes.translate : sizes.rest}
          `}
        />
      </span>
    </button>
  );
};

export default Switch;
