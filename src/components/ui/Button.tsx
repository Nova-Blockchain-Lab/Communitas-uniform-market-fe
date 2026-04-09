import React, { forwardRef } from "react";
import { motion } from "motion/react";
import { Spinner } from "./Spinner";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "ghost"
  | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}

/** Merge class strings, filtering out falsy values and collapsing whitespace */
function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: cn(
    "bg-gradient-to-r from-[#1b4ff5] to-[#3370ff] text-white",
    "hover:from-[#3370ff] hover:to-[#5992ff]",
    "shadow-lg hover:shadow-xl hover:shadow-blue-500/20",
    "active:from-[#1647d9] active:to-[#2d63e6]",
    "border-0",
  ),
  secondary: cn(
    "bg-white/6 text-white",
    "hover:bg-white/12",
    "active:bg-white/16",
    "border border-[var(--color-border)] hover:border-[var(--color-border-hover)]",
  ),
  success: cn(
    "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white",
    "hover:from-emerald-500 hover:to-emerald-400",
    "shadow-lg hover:shadow-xl hover:shadow-emerald-500/20",
    "active:from-emerald-700 active:to-emerald-600",
    "border-0",
  ),
  danger: cn(
    "bg-gradient-to-r from-red-600 to-red-500 text-white",
    "hover:from-red-500 hover:to-red-400",
    "shadow-lg hover:shadow-xl hover:shadow-red-500/20",
    "active:from-red-700 active:to-red-600",
    "border-0",
  ),
  ghost: cn(
    "bg-transparent text-[var(--color-text-secondary)]",
    "hover:bg-white/5 hover:text-white",
    "active:bg-white/8",
    "border border-transparent",
  ),
  outline: cn(
    "bg-transparent text-[var(--color-primary-400)]",
    "border border-[var(--color-primary-500)]/30",
    "hover:bg-[var(--color-primary-500)]/10 hover:border-[var(--color-primary-500)]/50",
    "active:bg-[var(--color-primary-500)]/15",
  ),
};

/** Size classes enforce 44px min-height on md/lg for touch targets */
const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg min-h-[36px]",
  md: "px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl min-h-[44px]",
  lg: "px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg rounded-xl min-h-[48px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      fullWidth = false,
      icon,
      iconPosition = "left",
      onClick,
      type = "button",
      className,
    },
    ref,
  ) {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        whileHover={isDisabled ? {} : { scale: 1.02 }}
        whileTap={isDisabled ? {} : { scale: 0.98 }}
        type={type}
        onClick={onClick}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 sm:gap-2",
          "font-semibold select-none",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-dark)]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className,
        )}
      >
        {loading ? (
          <>
            <Spinner size="sm" color="currentColor" />
            <span className="truncate">{children}</span>
          </>
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <span className="shrink-0 inline-flex">{icon}</span>
            )}
            <span className="truncate">{children}</span>
            {icon && iconPosition === "right" && (
              <span className="shrink-0 inline-flex">{icon}</span>
            )}
          </>
        )}
      </motion.button>
    );
  },
);

Button.displayName = "Button";

interface IconButtonProps {
  icon: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onClick?: () => void;
  disabled?: boolean;
  label: string;
  className?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      icon,
      variant = "ghost",
      size = "md",
      onClick,
      disabled = false,
      label,
      className,
    },
    ref,
  ) {
    /** Square sizing with 44px minimum for touch on md/lg */
    const sizeMap: Record<ButtonSize, string> = {
      sm: "p-2 min-h-[36px] min-w-[36px]",
      md: "p-2.5 sm:p-3 min-h-[44px] min-w-[44px]",
      lg: "p-3 sm:p-4 min-h-[48px] min-w-[48px]",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={disabled ? {} : { scale: 1.1 }}
        whileTap={disabled ? {} : { scale: 0.9 }}
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={cn(
          "inline-flex items-center justify-center",
          "rounded-xl select-none",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-dark)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantClasses[variant],
          sizeMap[size],
          className,
        )}
      >
        {icon}
      </motion.button>
    );
  },
);

IconButton.displayName = "IconButton";

export default Button;
