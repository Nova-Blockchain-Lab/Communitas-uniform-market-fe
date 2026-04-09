import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import type { CursorStep } from "../lib/types";

interface CursorAnimationProps {
  steps: CursorStep[];
  /** Video width for denormalizing positions */
  width?: number;
  /** Video height for denormalizing positions */
  height?: number;
}

export const CursorAnimation: React.FC<CursorAnimationProps> = ({
  steps,
  width = 1920,
  height = 1080,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Find the current/most recent step
  let curX = steps[0]?.target.x ?? 0.5;
  let curY = steps[0]?.target.y ?? 0.5;
  let isClicking = false;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const prevX = i > 0 ? steps[i - 1].target.x : step.target.x;
    const prevY = i > 0 ? steps[i - 1].target.y : step.target.y;

    if (frame >= step.startFrame) {
      const progress = interpolate(
        frame,
        [step.startFrame, step.startFrame + step.moveDuration],
        [0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      );

      // Ease in-out
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      curX = prevX + (step.target.x - prevX) * eased;
      curY = prevY + (step.target.y - prevY) * eased;

      // Click detection
      if (step.click) {
        const clickFrame = step.startFrame + step.moveDuration;
        isClicking = frame >= clickFrame && frame <= clickFrame + 8;
      }
    }
  }

  const pixelX = curX * width;
  const pixelY = curY * height;

  // Click ripple
  const clickOpacity = isClicking
    ? interpolate(frame % 9, [0, 8], [0.6, 0], { extrapolateRight: "clamp" })
    : 0;
  const clickScale = isClicking
    ? interpolate(frame % 9, [0, 8], [0.5, 2], { extrapolateRight: "clamp" })
    : 0;

  // Hide cursor before first step starts
  const visible = frame >= (steps[0]?.startFrame ?? 0) - 5;
  if (!visible) return null;

  const fadeIn = interpolate(
    frame,
    [(steps[0]?.startFrame ?? 0) - 5, steps[0]?.startFrame ?? 0],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 200, opacity: fadeIn }}>
      {/* Click ripple */}
      {isClicking && (
        <div
          style={{
            position: "absolute",
            left: pixelX - 20,
            top: pixelY - 20,
            width: 40,
            height: 40,
            borderRadius: "50%",
            border: "2px solid rgba(51, 112, 255, 0.6)",
            opacity: clickOpacity,
            transform: `scale(${clickScale})`,
          }}
        />
      )}

      {/* Cursor SVG */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        style={{
          position: "absolute",
          left: pixelX,
          top: pixelY,
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
          transform: isClicking ? "scale(0.85)" : "scale(1)",
          transition: "transform 0.1s",
        }}
      >
        <path
          d="M5 3l14 8-6 2-4 6z"
          fill="white"
          stroke="#333"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
