import React from "react";
import { motion } from "motion/react";

interface EmptyStateProps {
  /** Icon rendered inside a circular container */
  icon: React.ReactNode;
  /** Background class for the icon circle (default: "bg-white/5") */
  iconColorClass?: string;
  /** Primary message */
  title: string;
  /** Optional secondary description */
  subtitle?: string;
  /** Optional action element (e.g. a Button) rendered below the text */
  action?: React.ReactNode;
  /** Optional custom illustration replacing the icon circle */
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
    className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 sm:px-6 text-center w-full max-w-md mx-auto"
  >
    {illustration ? (
      <div className="mb-4 max-w-[8rem] sm:max-w-[12rem] w-full">{illustration}</div>
    ) : (
      <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full ${iconColorClass} flex items-center justify-center mb-3`}>
        {icon}
      </div>
    )}
    <p className="text-sm sm:text-base font-medium text-[var(--color-text-secondary)]">{title}</p>
    {subtitle && (
      <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1.5 max-w-[18rem] sm:max-w-xs leading-relaxed">
        {subtitle}
      </p>
    )}
    {action && <div className="mt-5 w-full flex justify-center">{action}</div>}
  </motion.div>
));

EmptyState.displayName = "EmptyState";
