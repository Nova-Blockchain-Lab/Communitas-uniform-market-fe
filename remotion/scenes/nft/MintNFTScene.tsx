import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, gradients, fonts, shadows } from "../../lib/theme";
import { sec } from "../../lib/timing";
import { CursorAnimation } from "../../components/CursorAnimation";
import { Annotation } from "../../components/Annotation";
import "../../styles/remotion.css";

export const MintNFTScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardAppear = sec(2);
  const cardOpacity = interpolate(frame, [cardAppear, cardAppear + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const mintFrame = sec(8);
  const showMintSuccess = frame >= sec(12);
  const nftAppear = showMintSuccess
    ? spring({ frame: frame - sec(12), fps, config: { damping: 12 } })
    : 0;

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
      }}
    >
      {/* NFT Mint Card */}
      {frame >= cardAppear && (
        <div style={{ position: "absolute", top: 120, left: "50%", transform: "translateX(-50%)", opacity: cardOpacity, width: 460 }}>
          <div style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)", borderRadius: 20, border: `1px solid ${colors.border.default}`, boxShadow: shadows.xl, padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ padding: 8, borderRadius: 12, background: "rgba(139,92,246,0.15)", color: "#a78bfa", fontSize: 18 }}>🎨</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "white" }}>Mint Energy NFT</div>
                <div style={{ fontSize: 13, color: colors.text.secondary }}>Create your community membership token</div>
              </div>
            </div>

            {/* NFT Preview */}
            <div style={{
              width: "100%", aspectRatio: "1", borderRadius: 16, marginBottom: 24,
              background: `linear-gradient(135deg, rgba(51,112,255,0.3), rgba(139,92,246,0.3), rgba(251,191,36,0.2))`,
              display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
              border: "1px solid rgba(255,255,255,0.1)",
              transform: showMintSuccess ? `scale(${nftAppear})` : "scale(1)",
            }}>
              <div style={{ fontSize: 72, opacity: 0.8 }}>⚡</div>
              <div style={{ position: "absolute", bottom: 16, left: 16, right: 16, padding: 12, background: "rgba(0,0,0,0.5)", borderRadius: 10, backdropFilter: "blur(8px)" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "white" }}>COMMUNITAS Energy Member #001</div>
                <div style={{ fontSize: 12, color: colors.text.muted }}>Nova Cidade Community</div>
              </div>
            </div>

            {/* Mint button */}
            <div style={{
              padding: "14px 0", borderRadius: 12, textAlign: "center", fontSize: 16, fontWeight: 600,
              background: "linear-gradient(to right, #7c3aed, #a78bfa)", color: "white",
              boxShadow: "0 0 24px rgba(139,92,246,0.3)",
            }}>
              {showMintSuccess ? "Minted!" : "Mint NFT"}
            </div>
          </div>
        </div>
      )}

      <CursorAnimation
        steps={[
          { target: { x: 0.5, y: 0.82 }, startFrame: sec(7), moveDuration: sec(0.8), click: true },
        ]}
      />

      <Annotation text="Click to mint your Energy NFT" x={650} y={720} startFrame={sec(5)} duration={sec(3)} variant="info" />
      <Annotation text="NFT minted successfully!" x={650} y={450} startFrame={sec(12)} duration={sec(3)} variant="success" />
    </AbsoluteFill>
  );
};
