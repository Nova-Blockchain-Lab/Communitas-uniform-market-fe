import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
  Img,
  staticFile,
} from "remotion";
import { colors, gradients, fonts } from "../lib/theme";
import "../styles/remotion.css";

interface IntroCardProps {
  title?: string;
  subtitle?: string;
}

export const IntroCard: React.FC<IntroCardProps> = ({
  title = "COMMUNITAS",
  subtitle = "Energy Market Tutorial",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const logoOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const titleOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [20, 35], [30, 0], { extrapolateRight: "clamp" });

  const subtitleOpacity = interpolate(frame, [35, 50], [0, 1], { extrapolateRight: "clamp" });

  const glowRadius = interpolate(frame, [0, 60], [0, 120], { extrapolateRight: "clamp" });
  const glowOpacity = interpolate(frame, [10, 40], [0, 0.6], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: colors.bg.dark,
        fontFamily: fonts.base,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Grid background */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          opacity: interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" }),
        }}
      />

      {/* Central glow */}
      <div
        style={{
          position: "absolute",
          width: glowRadius * 4,
          height: glowRadius * 4,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(51, 112, 255, ${glowOpacity * 0.3}) 0%, transparent 70%)`,
        }}
      />

      {/* Energy glow */}
      <div
        style={{
          position: "absolute",
          width: glowRadius * 3,
          height: glowRadius * 3,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(251, 191, 36, ${glowOpacity * 0.15}) 0%, transparent 70%)`,
          top: "40%",
        }}
      />

      {/* Logo */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            background: gradients.primary,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {title}
        </div>
      </div>

      {/* Subtitle */}
      <div
        style={{
          opacity: subtitleOpacity,
          fontSize: 32,
          fontWeight: 400,
          color: colors.text.secondary,
          letterSpacing: "0.05em",
        }}
      >
        {subtitle}
      </div>

      {/* Decorative line */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          width: interpolate(frame, [20, 50], [0, 200], { extrapolateRight: "clamp" }),
          height: 2,
          background: gradients.primary,
          borderRadius: 1,
          marginTop: 32,
        }}
      />
    </AbsoluteFill>
  );
};
