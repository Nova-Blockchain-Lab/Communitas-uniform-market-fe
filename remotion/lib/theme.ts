/** Design tokens extracted from src/styles/globals.css */

export const colors = {
  primary: {
    50: "#eef4ff",
    100: "#d9e5ff",
    200: "#bcd2ff",
    300: "#8eb8ff",
    400: "#5992ff",
    500: "#3370ff",
    600: "#1b4ff5",
    700: "#143ce1",
    800: "#1732b6",
    900: "#192f8f",
  },
  energy: {
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
  },
  accent: {
    green: "#10b981",
    emerald: "#059669",
    teal: "#14b8a6",
    orange: "#ea580c",
    red: "#ef4444",
    violet: "#8b5cf6",
  },
  bg: {
    dark: "#060609",
    base: "#0a0a12",
    card: "#10101a",
    elevated: "#181824",
    surface: "#1e1e2e",
  },
  border: {
    default: "rgba(255, 255, 255, 0.07)",
    hover: "rgba(255, 255, 255, 0.14)",
    active: "rgba(255, 255, 255, 0.22)",
  },
  text: {
    primary: "#f0f0f5",
    secondary: "#9898a8",
    muted: "#606070",
  },
} as const;

export const gradients = {
  primary: "linear-gradient(135deg, #3370ff 0%, #8b5cf6 100%)",
  success: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
  energy: "linear-gradient(135deg, #fbbf24 0%, #ea580c 100%)",
  glass:
    "linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)",
  glow: "radial-gradient(ellipse 50% 35% at 50% 0%, rgba(51, 112, 255, 0.1) 0%, transparent 100%)",
  btnPrimary: "linear-gradient(to right, #1b4ff5, #3370ff)",
  btnSuccess: "linear-gradient(to right, #059669, #10b981)",
} as const;

export const fonts = {
  base: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", "Fira Code", monospace',
} as const;

export const shadows = {
  sm: "0 1px 2px rgba(0, 0, 0, 0.4)",
  md: "0 4px 12px rgba(0, 0, 0, 0.35)",
  lg: "0 8px 24px rgba(0, 0, 0, 0.4)",
  xl: "0 16px 40px rgba(0, 0, 0, 0.45)",
  glow: "0 0 32px rgba(51, 112, 255, 0.25)",
  glowSuccess: "0 0 32px rgba(16, 185, 129, 0.25)",
  glowEnergy: "0 0 32px rgba(245, 158, 11, 0.2)",
} as const;

export const radii = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.5rem",
  "2xl": "2rem",
  full: "9999px",
} as const;
