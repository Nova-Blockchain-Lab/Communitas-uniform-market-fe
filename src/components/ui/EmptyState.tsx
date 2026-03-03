import React from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  iconColorClass?: string;
  title: string;
  subtitle?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  iconColorClass = "bg-white/5",
  title,
  subtitle,
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className={`w-12 h-12 rounded-full ${iconColorClass} flex items-center justify-center mb-3`}>
      {icon}
    </div>
    <p className="text-sm text-gray-500">{title}</p>
    {subtitle && <p className="text-xs text-gray-600 mt-1">{subtitle}</p>}
  </div>
);
