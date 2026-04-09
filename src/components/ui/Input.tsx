import React, { useRef } from "react";
import { motion } from "motion/react";

interface InputProps {
  label?: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number" | "email";
  disabled?: boolean;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
  prefix?: React.ReactNode;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  ref?: React.Ref<HTMLInputElement>;
}

export const Input: React.FC<InputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  error,
  helperText,
  icon,
  suffix,
  prefix,
  className = "",
  min,
  max,
  step,
  ref,
}) => {
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = (ref as React.RefObject<HTMLInputElement>) ?? internalRef;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
          {label}
        </label>
      )}
      <div
        className="relative"
        style={error ? { animation: "shake 0.4s ease-in-out" } : undefined}
      >
        {prefix && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center text-[var(--color-text-muted)]">
            {prefix}
          </div>
        )}
        {icon && !prefix && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center text-[var(--color-text-muted)]">
            {icon}
          </div>
        )}
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          className={`
            w-full px-4 py-3 min-h-[44px]
            bg-white/4
            border rounded-xl
            text-base text-white placeholder-[var(--color-text-muted)]
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)]
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/2
            ${icon || prefix ? "pl-11" : ""}
            ${suffix ? "pr-16" : ""}
            ${error
              ? "border-red-500/60 focus:ring-red-500/40 focus:border-red-500/60"
              : "border-[var(--color-border)] hover:border-[var(--color-border-hover)]"
            }
          `}
        />
        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-[var(--color-text-muted)]">
            {suffix}
          </div>
        )}
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-red-400 flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </motion.p>
      )}
      {helperText && !error && (
        <p className="text-sm text-[var(--color-text-muted)]">{helperText}</p>
      )}
    </div>
  );
};

interface NumberInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  unit?: string;
  unitIcon?: React.ReactNode;
  showStepper?: boolean;
  className?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  disabled = false,
  unit,
  unitIcon,
  showStepper = true,
  className = "",
}) => {
  const handleIncrement = () => {
    const newValue = value + step;
    if (max === undefined || newValue <= max) {
      onChange(newValue);
    }
  };

  const handleDecrement = () => {
    const newValue = value - step;
    if (newValue >= min) {
      onChange(newValue);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
          {label}
        </label>
      )}
      <div className="flex items-center gap-3">
        {(unit || unitIcon) && (
          <div className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-[var(--color-primary-500)]/10 border border-[var(--color-primary-500)]/20 rounded-xl">
            {unitIcon}
            {unit && (
              <span className="text-sm font-medium text-[var(--color-primary-400)] uppercase">
                {unit}
              </span>
            )}
          </div>
        )}
        <div className="relative flex-1">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className={`
              w-full px-4 py-3 min-h-[44px]
              bg-white/4
              border border-[var(--color-border)] rounded-xl
              text-base text-white sm:text-lg font-medium
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)]
              hover:border-[var(--color-border-hover)]
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/2
              ${showStepper ? "pr-20" : ""}
              [appearance:textfield]
              [&::-webkit-outer-spin-button]:appearance-none
              [&::-webkit-inner-spin-button]:appearance-none
            `}
          />
          {showStepper && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
              <button
                type="button"
                onClick={handleIncrement}
                disabled={disabled || (max !== undefined && value >= max)}
                className="px-2 py-1 min-h-[22px] text-[var(--color-text-muted)] hover:text-white transition-colors disabled:opacity-30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleDecrement}
                disabled={disabled || value <= min}
                className="px-2 py-1 min-h-[22px] text-[var(--color-text-muted)] hover:text-white transition-colors disabled:opacity-30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Input;
