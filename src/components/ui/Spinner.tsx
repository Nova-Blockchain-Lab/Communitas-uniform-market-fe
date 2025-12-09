import React from "react";

interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  color?: string;
  className?: string;
}

const sizeClasses = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  color = "currentColor",
  className = "",
}) => {
  // Handle Chakra-style color props like "blue.400"
  const getColorClass = (colorProp: string) => {
    if (colorProp === "currentColor") return "text-current";
    if (colorProp.includes(".")) {
      const [colorName, shade] = colorProp.split(".");
      return `text-${colorName}-${shade}`;
    }
    return colorProp.startsWith("text-") ? colorProp : `text-${colorProp}`;
  };

  const colorClass = getColorClass(color);

  return (
    <svg
      className={`
        animate-spin
        ${sizeClasses[size]}
        ${colorClass}
        ${className}
      `}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export default Spinner;
