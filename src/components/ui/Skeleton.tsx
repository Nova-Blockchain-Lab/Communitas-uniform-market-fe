import React from "react";

interface SkeletonLineProps {
  width?: string;
  height?: string;
  className?: string;
}

export const SkeletonLine: React.FC<SkeletonLineProps> = ({
  width = "100%",
  height = "1rem",
  className = "",
}) => (
  <div
    className={`rounded-md skeleton-pulse ${className}`}
    style={{ width, height }}
  />
);

interface SkeletonBlockProps {
  width?: string;
  height?: string;
  rounded?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  className?: string;
}

const roundedClasses = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
};

export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({
  width = "100%",
  height = "8rem",
  rounded = "xl",
  className = "",
}) => (
  <div
    className={`skeleton-pulse ${roundedClasses[rounded]} ${className}`}
    style={{ width, height }}
  />
);

interface SkeletonCircleProps {
  size?: string;
  className?: string;
}

export const SkeletonCircle: React.FC<SkeletonCircleProps> = ({
  size = "3rem",
  className = "",
}) => (
  <div
    className={`rounded-full skeleton-pulse ${className}`}
    style={{ width: size, height: size }}
  />
);

interface SkeletonRowsProps {
  count?: number;
  gap?: string;
  className?: string;
}

export const SkeletonRows: React.FC<SkeletonRowsProps> = ({
  count = 3,
  gap = "0.75rem",
  className = "",
}) => (
  <div className={className} style={{ display: "flex", flexDirection: "column", gap }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonLine
        key={i}
        width={i === count - 1 ? "60%" : i % 2 === 0 ? "100%" : "85%"}
      />
    ))}
  </div>
);
