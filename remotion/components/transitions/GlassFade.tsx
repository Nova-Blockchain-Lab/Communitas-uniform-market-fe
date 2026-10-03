import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

interface GlassFadeProps {
  children: React.ReactNode;
  durationInFrames: number;
  direction?: "in" | "out";
}

export const GlassFade: React.FC<GlassFadeProps> = ({
  children,
  durationInFrames,
  direction = "in",
}) => {
  const frame = useCurrentFrame();

  const opacity =
    direction === "in"
      ? interpolate(frame, [0, durationInFrames], [0, 1], { extrapolateRight: "clamp" })
      : interpolate(frame, [0, durationInFrames], [1, 0], { extrapolateRight: "clamp" });

  const blur =
    direction === "in"
      ? interpolate(frame, [0, durationInFrames], [16, 0], { extrapolateRight: "clamp" })
      : interpolate(frame, [0, durationInFrames], [0, 16], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity, filter: `blur(${blur}px)` }}>
      {children}
    </AbsoluteFill>
  );
};
