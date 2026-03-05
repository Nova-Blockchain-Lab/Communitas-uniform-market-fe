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
    track: "w-8 h-4",
    thumb: "w-3 h-3",
    translate: "translate-x-4",
    rest: "translate-x-0.5",
  },
  md: {
    track: "w-10 h-5",
    thumb: "w-4 h-4",
    translate: "translate-x-5",
    rest: "translate-x-0.5",
  },
  lg: {
    track: "w-12 h-6",
    thumb: "w-5 h-5",
    translate: "translate-x-6",
    rest: "translate-x-0.5",
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
        relative inline-flex items-center shrink-0
        ${sizes.track}
        rounded-full
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-dark)]
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
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
    </button>
  );
};

export default Switch;
