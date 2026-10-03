import React from "react";

interface SkeletonLineProps {
  /** CSS width value or responsive Tailwind class via className */
  width?: string;
  height?: string;
  className?: string;
}

export const SkeletonLine: React.FC<SkeletonLineProps> = React.memo(({
  width = "100%",
  height = "1rem",
  className = "",
}) => (
  <div
    className={`rounded-md skeleton-pulse ${className}`}
    style={{ width, height, maxWidth: "100%" }}
    role="status"
    aria-label="Loading"
    aria-busy="true"
  />
));

SkeletonLine.displayName = "SkeletonLine";

interface SkeletonBlockProps {
  /** CSS width value. For responsive sizing, prefer passing Tailwind classes via className. */
  width?: string;
  height?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  className?: string;
}

const roundedClasses: Record<string, string> = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
};

export const SkeletonBlock: React.FC<SkeletonBlockProps> = React.memo(({
  width = "100%",
  height = "8rem",
  rounded = "xl",
  className = "",
}) => (
  <div
    className={`skeleton-pulse ${roundedClasses[rounded]} ${className}`}
    style={{ width, height, maxWidth: "100%" }}
    role="status"
    aria-label="Loading"
    aria-busy="true"
  />
));

SkeletonBlock.displayName = "SkeletonBlock";

interface SkeletonRowsProps {
  count?: number;
  gap?: string;
  className?: string;
}

export const SkeletonRows: React.FC<SkeletonRowsProps> = React.memo(({
  count = 3,
  gap = "0.75rem",
  className = "",
}) => (
  <div
    className={`w-full ${className}`}
    style={{ display: "flex", flexDirection: "column", gap }}
    role="status"
    aria-label="Loading"
    aria-busy="true"
  >
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonLine
        key={i}
        width={i === count - 1 ? "60%" : i % 2 === 0 ? "100%" : "85%"}
      />
    ))}
  </div>
));

SkeletonRows.displayName = "SkeletonRows";
