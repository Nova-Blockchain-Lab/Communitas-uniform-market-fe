import React from "react";
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

const paddingClasses = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

const variantClasses: Record<CardVariant, string> = {
  default: "glass-card rounded-2xl",
  elevated: "bg-[var(--color-bg-elevated)] border border-[var(--color-border)] rounded-2xl shadow-xl",
  outlined: "bg-transparent border border-[var(--color-border-hover)] rounded-2xl",
};

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hover = false,
  glow = false,
  padding = "md",
  variant = "default",
  loading = false,
}) => {
  if (loading) {
    return (
      <div
        className={`
          ${variantClasses[variant]}
          ${paddingClasses[padding]}
          ${className}
        `}
      >
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${hover ? "card-hover cursor-pointer" : ""}
        ${glow ? "glow-primary" : ""}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

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
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="p-2 rounded-xl bg-blue-500/15 text-blue-400">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {subtitle && (
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
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
  className = "",
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {title && (
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</label>
      )}
      {children}
    </div>
  );
};

export default Card;
