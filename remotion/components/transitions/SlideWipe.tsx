import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

interface SlideWipeProps {
  children: React.ReactNode;
  durationInFrames: number;
  direction?: "left" | "right" | "up" | "down";
  type?: "in" | "out";
}

export const SlideWipe: React.FC<SlideWipeProps> = ({
  children,
  durationInFrames,
  direction = "left",
  type = "in",
}) => {
  const frame = useCurrentFrame();

  const getTransform = () => {
    const axes = {
      left: { prop: "translateX", from: type === "in" ? 100 : 0, to: type === "in" ? 0 : -100 },
      right: { prop: "translateX", from: type === "in" ? -100 : 0, to: type === "in" ? 0 : 100 },
      up: { prop: "translateY", from: type === "in" ? 100 : 0, to: type === "in" ? 0 : -100 },
      down: { prop: "translateY", from: type === "in" ? -100 : 0, to: type === "in" ? 0 : 100 },
    };

    const axis = axes[direction];
    const value = interpolate(frame, [0, durationInFrames], [axis.from, axis.to], {
      extrapolateRight: "clamp",
    });

    return `${axis.prop}(${value}%)`;
  };

  const opacity = interpolate(
    frame,
    [0, durationInFrames * 0.3, durationInFrames * 0.7, durationInFrames],
    type === "in" ? [0, 1, 1, 1] : [1, 1, 1, 0],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill style={{ transform: getTransform(), opacity }}>
      {children}
    </AbsoluteFill>
  );
};
