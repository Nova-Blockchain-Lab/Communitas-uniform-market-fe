import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, gradients, fonts, shadows } from "../../lib/theme";
import { sec } from "../../lib/timing";
import { CursorAnimation } from "../../components/CursorAnimation";
import { Annotation } from "../../components/Annotation";
import "../../styles/remotion.css";

/**
 * TC09.07 — Claiming Refunded Money (Buyer)
 * Steps: Connect → Check claimable → Click Claim → Wallet confirm → Verify 0
 */
export const ClaimBuyerRefundScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const cardAppear = sec(3);
  const cardOpacity = interpolate(frame, [cardAppear, cardAppear + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Wallet popup
  const walletFrame = sec(10);
  const showWallet = frame >= walletFrame && frame < sec(14);
  const walletScale = showWallet
    ? spring({ frame: frame - walletFrame, fps, config: { damping: 14 } })
    : 0;

  // Success
  const successFrame = sec(15);
  const showSuccess = frame >= successFrame;
  const successOpacity = interpolate(frame, [successFrame, successFrame + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Balance update to 0
  const balanceZero = frame >= sec(18);
  const balanceDisplay = balanceZero ? "0.000000" : "0.001425";
  const balanceEUR = balanceZero ? "0.00" : "3.75";

  const tabs = ["Buy", "Sell", "Orders", "History", "Claim", "NFTs", "Dashboard"];

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
            <div key={tab} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, color: i === 4 ? "white" : colors.text.muted, background: i === 4 ? "rgba(51,112,255,0.2)" : "transparent" }}>
              {tab}
            </div>
          ))}
        </div>
        <div style={{ padding: "8px 16px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, color: "#34d399", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
          0x1234...5678
        </div>
      </div>

      {/* Claim Card */}
      {frame >= cardAppear && (
        <div style={{ position: "absolute", top: 120, left: "50%", transform: "translateX(-50%)", opacity: cardOpacity, width: 440 }}>
          <div style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)", borderRadius: 20, border: `1px solid ${colors.border.default}`, boxShadow: shadows.xl, padding: 28 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ padding: 8, borderRadius: 12, background: "rgba(51,112,255,0.15)", color: colors.primary[400], fontSize: 18 }}>💰</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "white" }}>Claim Earnings</div>
                <div style={{ fontSize: 13, color: colors.text.secondary }}>Withdraw your available balance</div>
              </div>
            </div>

            {/* Balance display */}
            <div style={{
              position: "relative", overflow: "hidden", padding: 24, borderRadius: 16,
              background: "linear-gradient(135deg, rgba(51,112,255,0.2), rgba(139,92,246,0.2))",
              border: "1px solid rgba(255,255,255,0.1)", marginBottom: 24,
            }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: 128, height: 128, borderRadius: "50%", background: "rgba(51,112,255,0.1)", filter: "blur(40px)" }} />
              <div style={{ position: "relative" }}>
                <div style={{ fontSize: 14, color: colors.text.muted, marginBottom: 4 }}>Available Balance</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 36, fontWeight: 700, color: "white" }}>{balanceDisplay}</span>
                  <span style={{ fontSize: 20, color: colors.text.muted }}>ETH</span>
                </div>
                <div style={{ fontSize: 16, color: colors.text.muted }}>~{balanceEUR} EUR</div>
              </div>
            </div>

            {/* Arrow indicator */}
            {!balanceZero && (
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                <div style={{ padding: 12, borderRadius: "50%", background: "rgba(16,185,129,0.2)", color: "#34d399", fontSize: 24 }}>↓</div>
              </div>
            )}

            {/* Destination */}
            <div style={{ padding: 16, background: "rgba(255,255,255,0.05)", borderRadius: 12, marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ padding: 8, borderRadius: 8, background: "rgba(51,112,255,0.2)" }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#627EEA" }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "white" }}>0x1234...5678</div>
                  <div style={{ fontSize: 12, color: colors.text.muted }}>Your connected wallet</div>
                </div>
              </div>
            </div>

            {/* Claim button */}
            <div style={{
              padding: "14px 0", borderRadius: 12, textAlign: "center", fontSize: 16, fontWeight: 600,
              background: balanceZero ? "rgba(255,255,255,0.06)" : gradients.btnSuccess,
              color: balanceZero ? colors.text.muted : "white",
              boxShadow: balanceZero ? "none" : "0 0 24px rgba(16,185,129,0.3)",
            }}>
              {balanceZero ? "No Balance to Claim" : "Claim Earnings"}
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
                <span style={{ color: "white", fontWeight: 600 }}>claimBalance</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: colors.text.secondary }}>Gas Fee</span>
                <span style={{ color: colors.text.secondary }}>~0.0001 ETH</span>
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
          <div style={{ padding: "14px 24px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 14, fontWeight: 700 }}>✓</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#34d399" }}>Successfully Claimed!</div>
              <div style={{ fontSize: 12, color: "rgba(52,211,153,0.7)" }}>0.001425 ETH sent to your wallet</div>
            </div>
          </div>
        </div>
      )}

      {/* Cursor */}
      <CursorAnimation
        steps={[
          { target: { x: 0.52, y: 0.033 }, startFrame: sec(1.5), moveDuration: sec(0.5), click: true },
          { target: { x: 0.5, y: 0.62 }, startFrame: sec(5), moveDuration: sec(0.5) },
          { target: { x: 0.5, y: 0.72 }, startFrame: sec(8), moveDuration: sec(0.6), click: true },
          { target: { x: 0.56, y: 0.55 }, startFrame: sec(11), moveDuration: sec(0.6), click: true },
        ]}
      />

      {/* Annotations */}
      <Annotation text='Navigate to "Claim" tab' x={750} y={90} startFrame={sec(1)} duration={sec(2)} variant="info" arrowDirection="up" />
      <Annotation text="Check claimable balance (ETH + EUR)" x={650} y={350} startFrame={sec(4)} duration={sec(3)} variant="info" />
      <Annotation text='Click "Claim Earnings"' x={650} y={650} startFrame={sec(8)} duration={sec(2)} variant="info" />
      <Annotation text="Confirm in wallet" x={650} y={350} startFrame={sec(11)} duration={sec(2.5)} variant="warning" />
      <Annotation text="Refund claimed, balance updated to 0 ✓" x={500} y={500} startFrame={sec(18)} duration={sec(5)} variant="success" />
    </AbsoluteFill>
  );
};
