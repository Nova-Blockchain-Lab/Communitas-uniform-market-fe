import React from "react";

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
  info: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  neutral: "bg-gray-500/15 text-gray-400 border-gray-500/25",
  energy: "bg-amber-500/15 text-amber-300 border-amber-500/25",
};

const pulseColors: Record<BadgeVariant, string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  error: "bg-red-400",
  info: "bg-blue-400",
  neutral: "bg-gray-400",
  energy: "bg-amber-300",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
};

export const Badge: React.FC<BadgeProps> = ({
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
        inline-flex items-center gap-1.5
        font-medium rounded-full border
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColors[variant]}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${pulseColors[variant]}`} />
        </span>
      )}
      {icon}
      {children}
    </span>
  );
};

interface StatusDotProps {
  status: "online" | "offline" | "pending" | "error";
  pulse?: boolean;
}

export const StatusDot: React.FC<StatusDotProps> = ({
  status,
  pulse = false,
}) => {
  const statusColors: Record<string, string> = {
    online: "bg-emerald-500",
    offline: "bg-gray-500",
    pending: "bg-amber-500",
    error: "bg-red-500",
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
};

export default Badge;
