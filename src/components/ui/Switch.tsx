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
  },
  md: {
    track: "w-10 h-5",
    thumb: "w-4 h-4",
    translate: "translate-x-5",
  },
  lg: {
    track: "w-12 h-6",
    thumb: "w-5 h-5",
    translate: "translate-x-6",
  },
};

const colorClasses = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  emerald: "bg-emerald-500",
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
  const activeColor = colorClasses[colorScheme];

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
        transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${isChecked ? activeColor : "bg-white/20"}
      `}
    >
      <span
        className={`
          ${sizes.thumb}
          inline-block
          rounded-full
          bg-white
          shadow-lg
          transform
          transition-transform duration-200 ease-in-out
          ${isChecked ? sizes.translate : "translate-x-0.5"}
        `}
      />
    </button>
  );
};

export default Switch;
