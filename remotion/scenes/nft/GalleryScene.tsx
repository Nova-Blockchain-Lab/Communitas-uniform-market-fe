import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, gradients, fonts, shadows } from "../../lib/theme";
import { sec } from "../../lib/timing";
import "../../styles/remotion.css";

export const GalleryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const nfts = [
    { name: "Energy Member #001", rarity: "Common" },
    { name: "Solar Pioneer #042", rarity: "Rare" },
    { name: "Wind Guardian #007", rarity: "Epic" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: colors.bg.dark,
        fontFamily: fonts.base,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
        `,
        backgroundSize: "64px 64px",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: 24 }}>
        {nfts.map((nft, i) => {
          const delay = i * 8;
          const scale = spring({ frame: Math.max(0, frame - delay - sec(1)), fps, config: { damping: 12 } });
          const opacity = interpolate(frame, [sec(1) + delay, sec(1.5) + delay], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          const gradientColors = [
            "linear-gradient(135deg, rgba(51,112,255,0.3), rgba(139,92,246,0.3))",
            "linear-gradient(135deg, rgba(251,191,36,0.3), rgba(234,88,12,0.3))",
            "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.3))",
          ];

          return (
            <div
              key={nft.name}
              style={{
                opacity,
                transform: `scale(${scale})`,
                width: 280,
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(24px)",
                borderRadius: 20,
                border: `1px solid ${colors.border.default}`,
                boxShadow: shadows.xl,
                overflow: "hidden",
              }}
            >
              <div style={{ width: "100%", aspectRatio: "1", background: gradientColors[i], display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 64 }}>⚡</span>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "white", marginBottom: 4 }}>{nft.name}</div>
                <div style={{ fontSize: 12, color: colors.text.muted }}>{nft.rarity}</div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
