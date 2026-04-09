import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, gradients, fonts, shadows } from "../../lib/theme";
import { sec } from "../../lib/timing";
import { CursorAnimation } from "../../components/CursorAnimation";
import { Annotation } from "../../components/Annotation";
import "../../styles/remotion.css";

export const BridgeNFTScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardOpacity = interpolate(frame, [sec(1), sec(1.5)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bridgeSuccess = frame >= sec(10);

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
      {/* Bridge NFT Card */}
      <div style={{ position: "absolute", top: 120, left: "50%", transform: "translateX(-50%)", opacity: cardOpacity, width: 460 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)", borderRadius: 20, border: `1px solid ${colors.border.default}`, boxShadow: shadows.xl, padding: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ padding: 8, borderRadius: 12, background: "rgba(16,185,129,0.15)", color: "#34d399", fontSize: 18 }}>↔</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "white" }}>Bridge NFT</div>
              <div style={{ fontSize: 13, color: colors.text.secondary }}>Transfer NFT between L1 and L2</div>
            </div>
          </div>

          {/* NFT being bridged */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, marginBottom: 24 }}>
            <div style={{ width: 120, height: 120, borderRadius: 12, background: "linear-gradient(135deg, rgba(51,112,255,0.3), rgba(139,92,246,0.3))", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
              <span style={{ fontSize: 48 }}>⚡</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontSize: 24, color: bridgeSuccess ? "#34d399" : colors.primary[400] }}>→</div>
              <div style={{ fontSize: 11, color: colors.text.muted }}>L1 → L2</div>
            </div>
            <div style={{ width: 120, height: 120, borderRadius: 12, background: bridgeSuccess ? "linear-gradient(135deg, rgba(16,185,129,0.3), rgba(20,184,166,0.3))" : "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${bridgeSuccess ? "rgba(16,185,129,0.3)" : colors.border.default}` }}>
              {bridgeSuccess ? <span style={{ fontSize: 48 }}>⚡</span> : <span style={{ fontSize: 14, color: colors.text.muted }}>L2</span>}
            </div>
          </div>

          <div style={{ padding: "14px 0", borderRadius: 12, textAlign: "center", fontSize: 16, fontWeight: 600, background: gradients.btnSuccess, color: "white" }}>
            {bridgeSuccess ? "Bridged!" : "Bridge to L2"}
          </div>
        </div>
      </div>

      <CursorAnimation
        steps={[
          { target: { x: 0.5, y: 0.65 }, startFrame: sec(5), moveDuration: sec(0.8), click: true },
        ]}
      />

      <Annotation text="Bridge your NFT to L2" x={650} y={550} startFrame={sec(3)} duration={sec(3)} variant="info" />
      <Annotation text="NFT bridged to L2 successfully!" x={650} y={400} startFrame={sec(10)} duration={sec(4)} variant="success" />
    </AbsoluteFill>
  );
};
