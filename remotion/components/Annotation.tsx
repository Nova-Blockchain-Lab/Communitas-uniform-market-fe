import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, fonts } from "../lib/theme";

interface AnnotationProps {
  text: string;
  x: number;
  y: number;
  startFrame: number;
  duration: number;
  variant?: "info" | "success" | "warning" | "error";
  arrowDirection?: "up" | "down" | "left" | "right";
}

const variantColors = {
  info: { bg: "rgba(51, 112, 255, 0.15)", border: "rgba(51, 112, 255, 0.4)", text: "#5992ff", arrow: "#3370ff" },
  success: { bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.4)", text: "#34d399", arrow: "#10b981" },
  warning: { bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.4)", text: "#fbbf24", arrow: "#f59e0b" },
  error: { bg: "rgba(239, 68, 68, 0.15)", border: "rgba(239, 68, 68, 0.4)", text: "#f87171", arrow: "#ef4444" },
};

export const Annotation: React.FC<AnnotationProps> = ({
  text,
  x,
  y,
  startFrame,
  duration,
  variant = "info",
  arrowDirection = "down",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const relFrame = frame - startFrame;
  if (relFrame < 0 || relFrame > duration) return null;

  const c = variantColors[variant];
  const scale = spring({ frame: relFrame, fps, config: { damping: 12, stiffness: 150 } });
  const opacity = interpolate(
    relFrame,
    [0, 10, duration - 10, duration],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" }
  );

  const arrowSize = 8;
  const arrowStyle: React.CSSProperties = {
    position: "absolute",
    width: 0,
    height: 0,
    ...(arrowDirection === "down" && {
      bottom: -arrowSize,
      left: "50%",
      transform: "translateX(-50%)",
      borderLeft: `${arrowSize}px solid transparent`,
      borderRight: `${arrowSize}px solid transparent`,
      borderTop: `${arrowSize}px solid ${c.border}`,
    }),
    ...(arrowDirection === "up" && {
      top: -arrowSize,
      left: "50%",
      transform: "translateX(-50%)",
      borderLeft: `${arrowSize}px solid transparent`,
      borderRight: `${arrowSize}px solid transparent`,
      borderBottom: `${arrowSize}px solid ${c.border}`,
    }),
    ...(arrowDirection === "left" && {
      left: -arrowSize,
      top: "50%",
      transform: "translateY(-50%)",
      borderTop: `${arrowSize}px solid transparent`,
      borderBottom: `${arrowSize}px solid transparent`,
      borderRight: `${arrowSize}px solid ${c.border}`,
    }),
    ...(arrowDirection === "right" && {
      right: -arrowSize,
      top: "50%",
      transform: "translateY(-50%)",
      borderTop: `${arrowSize}px solid transparent`,
      borderBottom: `${arrowSize}px solid transparent`,
      borderLeft: `${arrowSize}px solid ${c.border}`,
    }),
  };

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity,
        transform: `scale(${scale})`,
        transformOrigin: arrowDirection === "down" ? "bottom center" : "top center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          position: "relative",
          padding: "10px 18px",
          background: c.bg,
          border: `1px solid ${c.border}`,
          borderRadius: 10,
          backdropFilter: "blur(12px)",
          fontFamily: fonts.base,
          fontSize: 16,
          fontWeight: 600,
          color: c.text,
          whiteSpace: "nowrap",
        }}
      >
        {text}
        <div style={arrowStyle} />
      </div>
    </div>
  );
};
