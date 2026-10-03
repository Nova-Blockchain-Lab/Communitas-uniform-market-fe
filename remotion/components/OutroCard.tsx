import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, gradients, fonts } from "../lib/theme";
import "../styles/remotion.css";

export const OutroCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ frame, fps, config: { damping: 12 } });
  const titleOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const ctaOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const ctaY = interpolate(frame, [20, 40], [20, 0], { extrapolateRight: "clamp" });
  const urlOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: colors.bg.dark,
        fontFamily: fonts.base,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Background grid */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
        }}
      />

      {/* Central glow */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)",
        }}
      />

      {/* Title */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `scale(${titleScale})`,
          fontSize: 56,
          fontWeight: 800,
          background: gradients.success,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          marginBottom: 20,
        }}
      >
        Start Trading Energy
      </div>

      {/* CTA */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `translateY(${ctaY}px)`,
          padding: "16px 48px",
          background: gradients.btnSuccess,
          borderRadius: 12,
          fontSize: 24,
          fontWeight: 600,
          color: "white",
          boxShadow: "0 0 32px rgba(16, 185, 129, 0.3)",
        }}
      >
        Visit COMMUNITAS Energy Market
      </div>

      {/* URL */}
      <div
        style={{
          opacity: urlOpacity,
          marginTop: 32,
          fontSize: 20,
          color: colors.text.muted,
          fontFamily: fonts.mono,
        }}
      >
        communitas-energy-market.vercel.app
      </div>
    </AbsoluteFill>
  );
};
