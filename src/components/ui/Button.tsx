import React from "react";
import { motion } from "framer-motion";
import { Spinner } from "./Spinner";

type ButtonVariant = "primary" | "secondary" | "success" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-r from-blue-600 to-blue-500 text-white
    hover:from-blue-500 hover:to-blue-400
    shadow-lg hover:shadow-xl hover:shadow-blue-500/25
    border-0
  `,
  secondary: `
    bg-white/10 text-white
    hover:bg-white/20
    border border-white/10 hover:border-white/20
  `,
  success: `
    bg-gradient-to-r from-emerald-600 to-emerald-500 text-white
    hover:from-emerald-500 hover:to-emerald-400
    shadow-lg hover:shadow-xl hover:shadow-emerald-500/25
    border-0
  `,
  danger: `
    bg-gradient-to-r from-red-600 to-red-500 text-white
    hover:from-red-500 hover:to-red-400
    shadow-lg hover:shadow-xl hover:shadow-red-500/25
    border-0
  `,
  ghost: `
    bg-transparent text-gray-400
    hover:bg-white/5 hover:text-white
    border border-transparent
  `,
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm rounded-lg",
  md: "px-6 py-3 text-base rounded-xl",
  lg: "px-8 py-4 text-lg rounded-xl",
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = "left",
  onClick,
  type = "button",
  className = "",
}) => {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={isDisabled ? {} : { scale: 1.02 }}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2
        font-semibold
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
    >
      {loading ? (
        <Spinner size="sm" color="currentColor" />
      ) : (
        <>
          {icon && iconPosition === "left" && icon}
          {children}
          {icon && iconPosition === "right" && icon}
        </>
      )}
    </motion.button>
  );
};

interface IconButtonProps {
  icon: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onClick?: () => void;
  disabled?: boolean;
  label: string;
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = "ghost",
  size = "md",
  onClick,
  disabled = false,
  label,
  className = "",
}) => {
  const sizeMap: Record<ButtonSize, string> = {
    sm: "p-2",
    md: "p-3",
    lg: "p-4",
  };

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.1 }}
      whileTap={disabled ? {} : { scale: 0.9 }}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`
        inline-flex items-center justify-center
        rounded-xl
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeMap[size]}
        ${className}
      `}
    >
      {icon}
    </motion.button>
  );
};

export default Button;
