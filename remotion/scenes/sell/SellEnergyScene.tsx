import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, gradients, fonts, shadows } from "../../lib/theme";
import { sec } from "../../lib/timing";
import { CursorAnimation } from "../../components/CursorAnimation";
import { Annotation } from "../../components/Annotation";
import "../../styles/remotion.css";

/**
 * TC09.04 — Selling Energy (Seller)
 * Steps: Connect → Sell tab → Amount → Quick presets → Confirm → Verify
 */
export const SellEnergyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Tab switches to Sell
  const sellTabActive = frame >= sec(3);

  // Card appears
  const cardAppear = sec(4);
  const cardOpacity = interpolate(frame, [cardAppear, cardAppear + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Amount interaction
  const amountFrame = sec(8);
  const quickPresetFrame = sec(10);
  const selectedPreset = frame >= quickPresetFrame ? 2 : -1; // "1 kWh"

  // Amount display
  const displayAmount = frame >= quickPresetFrame ? "5" : frame >= amountFrame ? "" : "0";

  // Submit
  const submitFrame = sec(14);

  // Wallet popup
  const walletFrame = sec(16);
  const showWallet = frame >= walletFrame && frame < sec(20);
  const walletScale = showWallet
    ? spring({ frame: frame - walletFrame, fps, config: { damping: 14 } })
    : 0;

  // Success
  const successFrame = sec(21);
  const showSuccess = frame >= successFrame;
  const successOpacity = interpolate(frame, [successFrame, successFrame + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tabs = ["Buy", "Sell", "Orders", "History", "Claim", "NFTs", "Dashboard"];
  const presets = [
    { value: 0.1, label: "100W" },
    { value: 0.5, label: "500W" },
    { value: 1, label: "1 kWh" },
    { value: 5, label: "5 kWh" },
    { value: 10, label: "10 kWh" },
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
      }}
    >
      {/* Header */}
      <div style={{ opacity: headerOpacity, position: "absolute", top: 0, left: 0, right: 0, height: 72, background: "rgba(10,10,18,0.95)", backdropFilter: "blur(24px)", borderBottom: `1px solid ${colors.border.default}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px" }}>
        <div style={{ fontSize: 24, fontWeight: 800, background: gradients.primary, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>COMMUNITAS</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10 }}>
          {tabs.map((tab, i) => (
            <div key={tab} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, color: (sellTabActive && i === 1) ? "white" : colors.text.muted, background: (sellTabActive && i === 1) ? "rgba(16,185,129,0.2)" : "transparent" }}>
              {tab}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ padding: "8px 16px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, color: "#34d399", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
            0x1234...5678
          </div>
        </div>
      </div>

      {/* Sell Card */}
      {frame >= cardAppear && (
        <div style={{ position: "absolute", top: 120, left: "50%", transform: "translateX(-50%)", opacity: cardOpacity, width: 440 }}>
          <div style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)", borderRadius: 20, border: `1px solid ${colors.border.default}`, boxShadow: shadows.xl, padding: 28 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ padding: 8, borderRadius: 12, background: "rgba(16,185,129,0.15)", color: "#34d399", fontSize: 18 }}>📈</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "white" }}>Sell Energy</div>
                <div style={{ fontSize: 13, color: colors.text.secondary }}>List your available energy for sale</div>
              </div>
            </div>

            {/* Current hour display */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 16, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, marginBottom: 20 }}>
              <span style={{ color: "#34d399", fontSize: 18 }}>🕐</span>
              <div>
                <div style={{ fontSize: 12, color: "rgba(52,211,153,0.7)" }}>Selling for current hour</div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#34d399" }}>Tuesday, Mar 17, 02:00 PM</div>
              </div>
            </div>

            {/* Energy Amount */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: colors.text.secondary, marginBottom: 8 }}>Energy Amount</div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ padding: "10px 16px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>⚡</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#fbbf24" }}>kWh</span>
                </div>
                <div style={{ flex: 1, padding: "10px 16px", background: "rgba(255,255,255,0.05)", border: `1px solid ${colors.border.default}`, borderRadius: 12, fontSize: 18, fontWeight: 600, color: displayAmount && displayAmount !== "0" ? "white" : colors.text.muted }}>
                  {displayAmount || "0"}
                </div>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              {presets.map((preset, i) => (
                <div key={preset.label} style={{
                  flex: 1, padding: "12px 0", borderRadius: 8, textAlign: "center", fontSize: 13, fontWeight: 500,
                  background: selectedPreset === i ? "#10b981" : "rgba(255,255,255,0.05)",
                  color: selectedPreset === i ? "white" : colors.text.muted,
                  boxShadow: selectedPreset === i ? "0 0 16px rgba(16,185,129,0.3)" : "none",
                }}>
                  {preset.label}
                </div>
              ))}
            </div>

            {/* Submit button */}
            <div style={{ padding: "14px 0", background: gradients.btnSuccess, borderRadius: 12, textAlign: "center", color: "white", fontSize: 16, fontWeight: 600, boxShadow: "0 0 24px rgba(16,185,129,0.3)" }}>
              List Energy for Sale
            </div>
          </div>
        </div>
      )}

      {/* Wallet popup */}
      {showWallet && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ transform: `scale(${walletScale})`, width: 360, background: colors.bg.elevated, borderRadius: 20, border: `1px solid ${colors.border.hover}`, boxShadow: shadows.xl, padding: 28 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 16 }}>Confirm Transaction</div>
            <div style={{ padding: 14, background: "rgba(255,255,255,0.04)", borderRadius: 10, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                <span style={{ color: colors.text.secondary }}>Function</span>
                <span style={{ color: "white", fontWeight: 600 }}>placeAsk</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                <span style={{ color: colors.text.secondary }}>Amount</span>
                <span style={{ color: "white", fontWeight: 600 }}>5 kWh</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: colors.text.secondary }}>Gas Fee</span>
                <span style={{ color: colors.text.secondary }}>~0.0001 ETH</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1, padding: "12px 0", background: "rgba(255,255,255,0.06)", borderRadius: 10, textAlign: "center", color: colors.text.secondary, fontSize: 14, fontWeight: 600 }}>Reject</div>
              <div style={{ flex: 1, padding: "12px 0", background: gradients.btnSuccess, borderRadius: 10, textAlign: "center", color: "white", fontSize: 14, fontWeight: 600 }}>Confirm</div>
            </div>
          </div>
        </div>
      )}

      {/* Success toast */}
      {showSuccess && (
        <div style={{ position: "absolute", top: 100, right: 40, opacity: successOpacity }}>
          <div style={{ padding: "14px 24px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 12, display: "flex", alignItems: "center", gap: 12, boxShadow: "0 0 24px rgba(16,185,129,0.2)" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, fontWeight: 700 }}>✓</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#34d399" }}>Energy Listed Successfully!</div>
              <div style={{ fontSize: 12, color: "rgba(52,211,153,0.7)" }}>5 kWh listed for sale</div>
            </div>
          </div>
        </div>
      )}

      {/* Cursor */}
      <CursorAnimation
        steps={[
          { target: { x: 0.42, y: 0.033 }, startFrame: sec(2), moveDuration: sec(0.6), click: true },
          { target: { x: 0.57, y: 0.45 }, startFrame: sec(7), moveDuration: sec(0.8), click: true },
          { target: { x: 0.62, y: 0.56 }, startFrame: sec(9.5), moveDuration: sec(0.5), click: true },
          { target: { x: 0.5, y: 0.72 }, startFrame: sec(13), moveDuration: sec(0.8), click: true },
          { target: { x: 0.56, y: 0.55 }, startFrame: sec(17), moveDuration: sec(0.6), click: true },
        ]}
      />

      {/* Annotations */}
      <Annotation text='Click "Sell Energy" tab' x={600} y={90} startFrame={sec(2)} duration={sec(2)} variant="info" arrowDirection="up" />
      <Annotation text="Current hour shown" x={650} y={260} startFrame={sec(5)} duration={sec(2.5)} variant="info" />
      <Annotation text="Enter amount or use quick presets" x={650} y={460} startFrame={sec(7)} duration={sec(4)} variant="info" />
      <Annotation text='Click "List Energy for Sale"' x={650} y={640} startFrame={sec(13)} duration={sec(2)} variant="info" />
      <Annotation text="Confirm in wallet" x={650} y={350} startFrame={sec(17)} duration={sec(2.5)} variant="warning" />
      <Annotation text="Sell order added ✓" x={700} y={500} startFrame={sec(22)} duration={sec(3)} variant="success" />
    </AbsoluteFill>
  );
};
