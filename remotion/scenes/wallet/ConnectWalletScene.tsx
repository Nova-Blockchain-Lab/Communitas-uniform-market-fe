import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { colors, gradients, fonts, shadows } from "../../lib/theme";
import { DURATIONS, sec } from "../../lib/timing";
import { CursorAnimation } from "../../components/CursorAnimation";
import { Annotation } from "../../components/Annotation";
import "../../styles/remotion.css";

/**
 * ConnectWalletScene — Shared scene: wallet connect + account select
 * Used as the opening for multiple test case tutorials
 */
export const ConnectWalletScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Phase 1: Show header with Connect Wallet button ---
  const headerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // --- Phase 2: Cursor clicks "Connect Wallet" ---
  // --- Phase 3: Wallet modal appears ---
  const modalAppear = sec(3);
  const modalScale = frame >= modalAppear
    ? spring({ frame: frame - modalAppear, fps, config: { damping: 14, stiffness: 100 } })
    : 0;
  const modalOpacity = interpolate(frame, [modalAppear, modalAppear + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- Phase 4: Account selected, modal closes ---
  const accountSelectFrame = sec(6);
  const modalClosing = frame >= accountSelectFrame;
  const modalCloseOpacity = modalClosing
    ? interpolate(frame, [accountSelectFrame, accountSelectFrame + 10], [1, 0], { extrapolateRight: "clamp" })
    : 1;

  // --- Phase 5: Connected state shown ---
  const connectedFrame = sec(7);
  const connectedOpacity = interpolate(frame, [connectedFrame, connectedFrame + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
      {/* Header bar mockup */}
      <div
        style={{
          opacity: headerOpacity,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 72,
          background: "rgba(10, 10, 18, 0.95)",
          backdropFilter: "blur(24px)",
          borderBottom: `1px solid ${colors.border.default}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
        }}
      >
        {/* Logo */}
        <div style={{ fontSize: 24, fontWeight: 800, background: gradients.primary, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          COMMUNITAS
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Network button (pre-connect) */}
          <div style={{ padding: "8px 16px", background: "rgba(255,255,255,0.06)", borderRadius: 8, border: `1px solid ${colors.border.default}`, color: colors.text.secondary, fontSize: 14, fontWeight: 500 }}>
            Optimism
          </div>

          {/* Connect Wallet button */}
          {frame < connectedFrame && (
            <div style={{ padding: "10px 24px", background: gradients.btnPrimary, borderRadius: 10, color: "white", fontSize: 14, fontWeight: 600, boxShadow: shadows.lg }}>
              Connect Wallet
            </div>
          )}

          {/* Connected state */}
          {frame >= connectedFrame && (
            <div
              style={{
                opacity: connectedOpacity,
                padding: "8px 16px",
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                borderRadius: 10,
                color: "#34d399",
                fontSize: 14,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
              0x1234...5678
            </div>
          )}
        </div>
      </div>

      {/* Wallet Modal */}
      {frame >= modalAppear && !modalClosing && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            opacity: modalOpacity,
          }}
        >
          <div
            style={{
              transform: `scale(${modalScale})`,
              width: 400,
              background: colors.bg.elevated,
              borderRadius: 20,
              border: `1px solid ${colors.border.hover}`,
              boxShadow: shadows.xl,
              padding: 32,
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, color: "white", marginBottom: 8 }}>Connect Wallet</div>
            <div style={{ fontSize: 14, color: colors.text.secondary, marginBottom: 24 }}>Choose your preferred wallet</div>

            {/* Wallet options */}
            {["MetaMask", "WalletConnect", "Coinbase Wallet"].map((wallet, i) => (
              <div
                key={wallet}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "14px 18px",
                  background: i === 0 ? "rgba(51, 112, 255, 0.1)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${i === 0 ? "rgba(51, 112, 255, 0.3)" : colors.border.default}`,
                  borderRadius: 12,
                  marginBottom: 10,
                  cursor: "pointer",
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: i === 0 ? "#F6851B" : i === 1 ? "#3B99FC" : "#0052FF", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 18 }}>
                  {wallet[0]}
                </div>
                <span style={{ fontSize: 16, fontWeight: 600, color: "white" }}>{wallet}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Account selection modal */}
      {frame >= sec(4.5) && frame < accountSelectFrame && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 400,
              background: colors.bg.elevated,
              borderRadius: 20,
              border: `1px solid ${colors.border.hover}`,
              boxShadow: shadows.xl,
              padding: 32,
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 700, color: "white", marginBottom: 20 }}>Select Account</div>
            {/* Account option */}
            <div style={{
              display: "flex", alignItems: "center", gap: 16,
              padding: "14px 18px",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: 12,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: gradients.primary }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: "white" }}>Account 1</div>
                <div style={{ fontSize: 13, color: colors.text.secondary }}>0x1234...5678 · 0.5 ETH</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cursor */}
      <CursorAnimation
        steps={[
          { target: { x: 0.88, y: 0.033 }, startFrame: sec(1), moveDuration: sec(0.8), click: true },
          { target: { x: 0.5, y: 0.45 }, startFrame: sec(3.5), moveDuration: sec(0.6), click: true },
          { target: { x: 0.5, y: 0.48 }, startFrame: sec(5), moveDuration: sec(0.5), click: true },
        ]}
      />

      {/* Annotations */}
      <Annotation text='Click "Connect Wallet"' x={1400} y={100} startFrame={sec(1.5)} duration={sec(2)} variant="info" arrowDirection="up" />
      <Annotation text="Select MetaMask" x={800} y={350} startFrame={sec(3.5)} duration={sec(1.5)} variant="info" />
      <Annotation text="Choose funded account" x={800} y={380} startFrame={sec(5)} duration={sec(1.5)} variant="info" />
      <Annotation text="Wallet connected!" x={1400} y={100} startFrame={sec(7.5)} duration={sec(2)} variant="success" arrowDirection="up" />
    </AbsoluteFill>
  );
};
