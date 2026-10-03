import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, gradients, fonts } from "../lib/theme";
import "../styles/remotion.css";

interface ChapterCardProps {
  chapter: number;
  title: string;
  description?: string;
}

export const ChapterCard: React.FC<ChapterCardProps> = ({ chapter, title, description }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numberScale = spring({ frame, fps, config: { damping: 10, stiffness: 120 } });
  const numberOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  const titleOpacity = interpolate(frame, [10, 25], [0, 1], { extrapolateRight: "clamp" });
  const titleX = interpolate(frame, [10, 25], [-30, 0], { extrapolateRight: "clamp" });

  const descOpacity = interpolate(frame, [20, 35], [0, 1], { extrapolateRight: "clamp" });

  const lineWidth = interpolate(frame, [5, 30], [0, 120], { extrapolateRight: "clamp" });

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

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        {/* Chapter number */}
        <div
          style={{
            opacity: numberOpacity,
            transform: `scale(${numberScale})`,
            fontSize: 20,
            fontWeight: 700,
            color: colors.primary[400],
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Chapter {chapter}
        </div>

        {/* Accent line */}
        <div
          style={{
            width: lineWidth,
            height: 3,
            background: gradients.energy,
            borderRadius: 2,
          }}
        />

        {/* Title */}
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateX(${titleX}px)`,
            fontSize: 48,
            fontWeight: 800,
            color: colors.text.primary,
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          {title}
        </div>

        {/* Description */}
        {description && (
          <div
            style={{
              opacity: descOpacity,
              fontSize: 24,
              color: colors.text.secondary,
              textAlign: "center",
              maxWidth: 600,
              lineHeight: 1.5,
            }}
          >
            {description}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
