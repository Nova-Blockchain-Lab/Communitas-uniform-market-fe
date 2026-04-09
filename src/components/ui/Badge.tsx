import React, { memo } from "react";

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "energy";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  pulse?: boolean;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  error: "bg-red-500/15 text-red-400 border-red-500/25",
  info: "bg-[var(--color-primary-500)]/15 text-[var(--color-primary-400)] border-[var(--color-primary-500)]/25",
  neutral: "bg-gray-500/15 text-[var(--color-text-secondary)] border-gray-500/25",
  energy: "bg-[var(--color-energy-500)]/15 text-[var(--color-energy-300)] border-[var(--color-energy-500)]/25",
};

const pulseColors: Record<BadgeVariant, string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  error: "bg-red-400",
  info: "bg-[var(--color-primary-400)]",
  neutral: "bg-gray-400",
  energy: "bg-[var(--color-energy-300)]",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px] sm:text-xs min-h-[22px]",
  md: "px-2.5 py-1 text-xs sm:text-sm min-h-[26px] sm:min-h-[28px]",
};

export const Badge: React.FC<BadgeProps> = memo(({
  children,
  variant = "neutral",
  size = "md",
  icon,
  pulse = false,
  className = "",
}) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1 sm:gap-1.5
        font-medium rounded-full border
        whitespace-nowrap max-w-full
        leading-tight
        transition-colors duration-[var(--transition-fast)]
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColors[variant]}`} />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 ${pulseColors[variant]}`} />
        </span>
      )}
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span className="truncate">{children}</span>
    </span>
  );
});

Badge.displayName = "Badge";

interface StatusDotProps {
  status: "online" | "offline" | "pending" | "error";
  pulse?: boolean;
}

export const StatusDot: React.FC<StatusDotProps> = memo(({
  status,
  pulse = false,
}) => {
  const statusColors: Record<string, string> = {
    online: "bg-[var(--color-accent-green)]",
    offline: "bg-gray-500",
    pending: "bg-[var(--color-energy-500)]",
    error: "bg-[var(--color-accent-red)]",
  };

  return (
    <span className="relative flex h-3 w-3">
      {pulse && (
        <span
          className={`
            animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
            ${statusColors[status]}
          `}
        />
      )}
      <span
        className={`
          relative inline-flex rounded-full h-3 w-3
          ${statusColors[status]}
        `}
      />
    </span>
  );
});

StatusDot.displayName = "StatusDot";

export default Badge;
