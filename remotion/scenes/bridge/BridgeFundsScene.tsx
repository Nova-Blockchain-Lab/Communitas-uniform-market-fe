import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig, Sequence } from "remotion";
import { colors, gradients, fonts, shadows } from "../../lib/theme";
import { sec } from "../../lib/timing";
import { CursorAnimation } from "../../components/CursorAnimation";
import { Annotation } from "../../components/Annotation";
import "../../styles/remotion.css";

/**
 * TC09.02 — Bridging Funds into L2
 * Steps: Switch network → Buy ETH on Optimism → Bridge to L2 → Verify balance
 */
export const BridgeFundsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Phases ---
  const phase1End = sec(7);   // Network selector
  const phase2End = sec(14);  // Buy ETH
  const phase3End = sec(24);  // Bridge form
  const phase4End = sec(30);  // Confirm & verify

  // Header
  const headerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Network dropdown
  const dropdownOpen = frame >= sec(2) && frame < sec(4.5);
  const dropdownOpacity = dropdownOpen
    ? spring({ frame: frame - sec(2), fps, config: { damping: 12 } })
    : 0;

  // Network switched to Optimism
  const networkSwitched = frame >= sec(5);

  // Bridge card appears
  const bridgeCardAppear = sec(8);
  const bridgeCardOpacity = interpolate(frame, [bridgeCardAppear, bridgeCardAppear + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bridgeCardY = interpolate(frame, [bridgeCardAppear, bridgeCardAppear + 15], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Amount typed
  const amountTyped = frame >= sec(12);
  const amountChars = amountTyped
    ? Math.min(Math.floor((frame - sec(12)) / 3), "0.05".length)
    : 0;
  const typedAmount = "0.05".slice(0, amountChars);

  // Wallet confirmation popup
  const walletPopupFrame = sec(18);
  const showWalletPopup = frame >= walletPopupFrame && frame < sec(22);
  const walletPopupScale = showWalletPopup
    ? spring({ frame: frame - walletPopupFrame, fps, config: { damping: 14 } })
    : 0;

  // Transaction success
  const txSuccessFrame = sec(23);
  const showSuccess = frame >= txSuccessFrame;
  const successOpacity = interpolate(frame, [txSuccessFrame, txSuccessFrame + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Balance update
  const balanceUpdateFrame = sec(28);
  const showBalanceUpdate = frame >= balanceUpdateFrame;

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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Network selector */}
          <div style={{ position: "relative" }}>
            <div style={{ padding: "8px 16px", background: networkSwitched ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)", borderRadius: 8, border: `1px solid ${networkSwitched ? "rgba(16,185,129,0.3)" : colors.border.default}`, color: networkSwitched ? "#34d399" : colors.text.secondary, fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: networkSwitched ? "#10b981" : colors.text.muted }} />
              {networkSwitched ? "Optimism" : "Ethereum"}
            </div>
            {/* Dropdown */}
            {dropdownOpen && (
              <div style={{ position: "absolute", top: 44, right: 0, width: 200, background: colors.bg.elevated, borderRadius: 12, border: `1px solid ${colors.border.hover}`, boxShadow: shadows.xl, padding: 8, opacity: dropdownOpacity, transform: `scale(${dropdownOpacity})`, transformOrigin: "top right" }}>
                {["Ethereum", "Optimism", "Nova Cidade"].map((net, i) => (
                  <div key={net} style={{ padding: "10px 14px", borderRadius: 8, color: i === 1 ? "#34d399" : colors.text.secondary, fontSize: 14, fontWeight: 500, background: i === 1 ? "rgba(16,185,129,0.1)" : "transparent" }}>
                    {net}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Connected wallet */}
          <div style={{ padding: "8px 16px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, color: "#34d399", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
            0x1234...5678
          </div>
        </div>
      </div>

      {/* Bridge Card */}
      {frame >= bridgeCardAppear && (
        <div style={{ position: "absolute", top: 120, left: "50%", transform: `translateX(-50%) translateY(${bridgeCardY}px)`, opacity: bridgeCardOpacity, width: 520 }}>
          <div style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)", borderRadius: 20, border: `1px solid ${colors.border.default}`, boxShadow: shadows.xl, padding: 32 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ padding: 8, borderRadius: 12, background: "rgba(16,185,129,0.15)", color: "#34d399", fontSize: 20 }}>↔</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "white" }}>Bridge ETH</div>
                <div style={{ fontSize: 14, color: colors.text.secondary }}>Transfer funds between networks</div>
              </div>
            </div>

            {/* From */}
            <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 500, color: colors.text.secondary }}>From</div>
            <div style={{ padding: 16, background: "rgba(255,255,255,0.05)", borderRadius: 12, border: `1px solid ${colors.border.default}`, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 600, color: typedAmount ? "white" : colors.text.muted }}>
                  {typedAmount || "0.0"}
                </div>
                <div style={{ padding: "8px 14px", background: "rgba(255,255,255,0.05)", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#627EEA" }} />
                  <span style={{ fontSize: 14, fontWeight: 500, color: "white" }}>ETH</span>
                </div>
              </div>
              <div style={{ fontSize: 13, color: colors.text.muted, marginTop: 8 }}>Balance: 0.5 ETH</div>
            </div>

            {/* Swap icon */}
            <div style={{ display: "flex", justifyContent: "center", margin: "-8px 0" }}>
              <div style={{ padding: 12, borderRadius: 12, background: "rgba(16,185,129,0.2)", color: "#34d399", fontSize: 20 }}>↕</div>
            </div>

            {/* To */}
            <div style={{ marginTop: 8, marginBottom: 8, fontSize: 14, fontWeight: 500, color: colors.text.secondary }}>To</div>
            <div style={{ padding: 16, background: "rgba(255,255,255,0.05)", borderRadius: 12, border: `1px solid ${colors.border.default}`, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 600, color: colors.text.muted }}>{typedAmount || "0.0"}</div>
                <div style={{ padding: "8px 14px", background: "rgba(255,255,255,0.05)", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#10b981" }} />
                  <span style={{ fontSize: 14, fontWeight: 500, color: "white" }}>ETH</span>
                </div>
              </div>
              <div style={{ fontSize: 13, color: colors.text.muted, marginTop: 8 }}>Nova Cidade · Balance: 0 ETH</div>
            </div>

            {/* Route info */}
            <div style={{ padding: 12, background: "rgba(255,255,255,0.05)", borderRadius: 10, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: colors.text.muted }}>Route</span>
                <span style={{ color: "white", fontWeight: 500 }}>Optimism → Nova Cidade</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginTop: 6 }}>
                <span style={{ color: colors.text.muted }}>Est. Time</span>
                <span style={{ color: "white" }}>~10 min</span>
              </div>
            </div>

            {/* Bridge button */}
            <div style={{ padding: "14px 0", background: gradients.btnSuccess, borderRadius: 12, textAlign: "center", color: "white", fontSize: 16, fontWeight: 600, boxShadow: "0 0 24px rgba(16,185,129,0.3)" }}>
              Bridge ETH
            </div>
          </div>
        </div>
      )}

      {/* Wallet confirmation popup */}
      {showWalletPopup && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ transform: `scale(${walletPopupScale})`, width: 360, background: colors.bg.elevated, borderRadius: 20, border: `1px solid ${colors.border.hover}`, boxShadow: shadows.xl, padding: 28 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 16 }}>Confirm Transaction</div>
            <div style={{ padding: 14, background: "rgba(255,255,255,0.04)", borderRadius: 10, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                <span style={{ color: colors.text.secondary }}>Amount</span>
                <span style={{ color: "white", fontWeight: 600 }}>0.05 ETH</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: colors.text.secondary }}>Gas Fee</span>
                <span style={{ color: colors.text.secondary }}>~0.0003 ETH</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1, padding: "12px 0", background: "rgba(255,255,255,0.06)", borderRadius: 10, textAlign: "center", color: colors.text.secondary, fontSize: 14, fontWeight: 600 }}>Reject</div>
              <div style={{ flex: 1, padding: "12px 0", background: gradients.btnPrimary, borderRadius: 10, textAlign: "center", color: "white", fontSize: 14, fontWeight: 600 }}>Confirm</div>
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
              <div style={{ fontSize: 14, fontWeight: 600, color: "#34d399" }}>Bridge Successful!</div>
              <div style={{ fontSize: 12, color: "rgba(52,211,153,0.7)" }}>0.05 ETH sent to Nova Cidade</div>
            </div>
          </div>
        </div>
      )}

      {/* Cursor */}
      <CursorAnimation
        steps={[
          // Click network selector
          { target: { x: 0.78, y: 0.033 }, startFrame: sec(1.5), moveDuration: sec(0.6), click: true },
          // Select Optimism
          { target: { x: 0.82, y: 0.08 }, startFrame: sec(3), moveDuration: sec(0.5), click: true },
          // Click amount input
          { target: { x: 0.42, y: 0.28 }, startFrame: sec(10), moveDuration: sec(0.8), click: true, typeText: "0.05" },
          // Click Bridge button
          { target: { x: 0.5, y: 0.72 }, startFrame: sec(15), moveDuration: sec(0.8), click: true },
          // Confirm in wallet
          { target: { x: 0.56, y: 0.55 }, startFrame: sec(19), moveDuration: sec(0.6), click: true },
        ]}
      />

      {/* Annotations */}
      <Annotation text="Step 1: Switch to Optimism" x={1200} y={100} startFrame={sec(1)} duration={sec(3)} variant="info" arrowDirection="up" />
      <Annotation text="Step 2: Enter bridge amount" x={350} y={380} startFrame={sec(10)} duration={sec(3)} variant="info" arrowDirection="up" />
      <Annotation text="Step 3: Confirm bridge transaction" x={650} y={430} startFrame={sec(15)} duration={sec(3)} variant="info" />
      <Annotation text="Step 4: Approve in wallet" x={650} y={350} startFrame={sec(19)} duration={sec(2.5)} variant="warning" />
      <Annotation text="Funds visible on L2 wallet ✓" x={700} y={450} startFrame={sec(28)} duration={sec(5)} variant="success" />
    </AbsoluteFill>
  );
};
