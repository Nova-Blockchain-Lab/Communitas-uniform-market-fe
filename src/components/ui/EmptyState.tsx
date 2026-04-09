import React from "react";
import { motion } from "motion/react";

interface EmptyStateProps {
  icon: React.ReactNode;
  iconColorClass?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  illustration?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = React.memo(({
  icon,
  iconColorClass = "bg-white/5",
  title,
  subtitle,
  action,
  illustration,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center w-full"
  >
    {illustration ? (
      <div className="mb-4 max-w-[10rem] sm:max-w-[12rem]">{illustration}</div>
    ) : (
      <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full ${iconColorClass} flex items-center justify-center mb-3`}>
        {icon}
      </div>
    )}
    <p className="text-sm text-[var(--color-text-muted)]">{title}</p>
    {subtitle && (
      <p className="text-xs text-[var(--color-text-muted)]/70 mt-1 max-w-[16rem] sm:max-w-xs">
        {subtitle}
      </p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </motion.div>
));

EmptyState.displayName = "EmptyState";
