import React from "react";

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  error: "bg-red-500/20 text-red-400 border-red-500/30",
  info: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  neutral: "bg-gray-500/20 text-gray-400 border-gray-500/30",
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
