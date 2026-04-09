import React, { forwardRef } from "react";
import { motion } from "motion/react";

type CardVariant = "default" | "elevated" | "outlined";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
  variant?: CardVariant;
  loading?: boolean;
}

/** Responsive padding: less on mobile, more on desktop */
const paddingClasses = {
  none: "",
  sm: "p-3 sm:p-4",
  md: "p-4 sm:p-6",
  lg: "p-5 sm:p-8",
};

const variantClasses: Record<CardVariant, string> = {
  default: "glass-card rounded-2xl",
  elevated:
    "bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-2xl shadow-xl",
  outlined:
    "bg-transparent border border-[var(--color-border-hover)] rounded-2xl",
};

/** Merge class strings, filtering out falsy values and collapsing whitespace */
function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

export const Card = React.memo(
  forwardRef<HTMLDivElement, CardProps>(function Card(
    {
      children,
      className,
      hover = false,
      glow = false,
      padding = "md",
      variant = "default",
      loading = false,
    },
    ref,
  ) {
    const baseClasses = cn(
      variantClasses[variant],
      paddingClasses[padding],
      "transition-[background-color,border-color,box-shadow] duration-200",
    );

    if (loading) {
      return (
        <div ref={ref} className={cn(baseClasses, className)}>
          <div className="space-y-4 animate-pulse">
            <div className="h-5 w-2/5 rounded-lg skeleton-pulse" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded-md skeleton-pulse" />
              <div className="h-4 w-4/5 rounded-md skeleton-pulse" />
              <div className="h-4 w-3/5 rounded-md skeleton-pulse" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          baseClasses,
          hover && "card-hover cursor-pointer",
          glow && "glow-primary",
          className,
        )}
      >
        {children}
      </motion.div>
    );
  }),
);

Card.displayName = "Card";

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
}) => {
  return (
    <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {icon && (
          <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-blue-500/15 text-blue-400 shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-white truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

interface CardSectionProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export const CardSection: React.FC<CardSectionProps> = ({
  children,
  title,
  className,
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      {title && (
        <label className="text-xs sm:text-sm font-medium text-[var(--color-text-secondary)]">
          {title}
        </label>
      )}
      {children}
    </div>
  );
};

export default Card;
