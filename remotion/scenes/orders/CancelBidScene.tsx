import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, gradients, fonts, shadows } from "../../lib/theme";
import { sec } from "../../lib/timing";
import { CursorAnimation } from "../../components/CursorAnimation";
import { Annotation } from "../../components/Annotation";
import "../../styles/remotion.css";

/**
 * TC09.09 — Cancel Bid Order
 * Steps: Connect → View Orders → Find bid → Click Cancel → Confirm → Verify
 */
export const CancelBidScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const cardAppear = sec(3);
  const cardOpacity = interpolate(frame, [cardAppear, cardAppear + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Expand the bid
  const expandFrame = sec(7);
  const orderExpanded = frame >= expandFrame;
  const expandHeight = orderExpanded
    ? interpolate(frame, [expandFrame, expandFrame + 10], [0, 100], { extrapolateRight: "clamp" })
    : 0;

  // Cancel button clicked
  const cancelClickFrame = sec(12);

  // Wallet popup
  const walletFrame = sec(14);
  const showWallet = frame >= walletFrame && frame < sec(18);
  const walletScale = showWallet
    ? spring({ frame: frame - walletFrame, fps, config: { damping: 14 } })
    : 0;

  // Success + cancelled banner
  const successFrame = sec(19);
  const showSuccess = frame >= successFrame;
  const showCancelled = frame >= sec(20);
  const successOpacity = interpolate(frame, [successFrame, successFrame + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
            <div key={tab} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, color: i === 2 ? "white" : colors.text.muted, background: i === 2 ? "rgba(51,112,255,0.2)" : "transparent" }}>
              {tab}
            </div>
          ))}
        </div>
        <div style={{ padding: "8px 16px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, color: "#34d399", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
          0x1234...5678
        </div>
      </div>

      {/* Orders Card */}
      {frame >= cardAppear && (
        <div style={{ position: "absolute", top: 110, left: "50%", transform: "translateX(-50%)", opacity: cardOpacity, width: 500 }}>
          <div style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)", borderRadius: 20, border: `1px solid ${colors.border.default}`, boxShadow: shadows.xl, padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ padding: 8, borderRadius: 12, background: "rgba(51,112,255,0.15)", color: colors.primary[400], fontSize: 18 }}>📋</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "white" }}>My Orders</div>
                <div style={{ fontSize: 13, color: colors.text.secondary }}>Buy Orders · 1 order</div>
              </div>
            </div>

            {/* Bid to cancel */}
            <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", opacity: showCancelled ? 0.5 : 1 }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: colors.primary[500] }} />
              <div style={{ marginLeft: 6, padding: 14, background: "linear-gradient(to right, rgba(51,112,255,0.1), transparent)", border: "1px solid rgba(51,112,255,0.2)", borderLeft: "none", borderRadius: "0 12px 12px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(51,112,255,0.2)", color: colors.primary[400], fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const }}>Buy</div>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "white" }}>16:00</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: colors.primary[400] }}>10 kWh</span>
                  </div>
                  <div style={{ padding: "4px 10px", borderRadius: 20, background: showCancelled ? "rgba(239,68,68,0.15)" : "rgba(51,112,255,0.15)", color: showCancelled ? "#f87171" : colors.primary[400], fontSize: 12, fontWeight: 500, border: `1px solid ${showCancelled ? "rgba(239,68,68,0.25)" : "rgba(51,112,255,0.25)"}` }}>
                    {showCancelled ? "Canceled" : "Pending"}
                  </div>
                </div>

                {/* Expanded with Cancel button */}
                {orderExpanded && !showCancelled && (
                  <div style={{ overflow: "hidden", height: expandHeight }}>
                    <div style={{ paddingTop: 12, marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 8 }}>
                      <div style={{ padding: "8px 16px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#f87171", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                        ✕ Cancel Bid
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cancelled banner */}
              {showCancelled && (
                <div style={{ position: "absolute", top: 12, right: 12 }}>
                  <div style={{ padding: "4px 12px", background: "rgba(239,68,68,0.9)", color: "white", fontSize: 11, fontWeight: 700, borderRadius: 6, textTransform: "uppercase" as const }}>
                    Canceled
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Wallet popup */}
      {showWallet && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ transform: `scale(${walletScale})`, width: 360, background: colors.bg.elevated, borderRadius: 20, border: `1px solid ${colors.border.hover}`, boxShadow: shadows.xl, padding: 28 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 16 }}>Confirm Cancellation</div>
            <div style={{ padding: 14, background: "rgba(255,255,255,0.04)", borderRadius: 10, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                <span style={{ color: colors.text.secondary }}>Function</span>
                <span style={{ color: "white", fontWeight: 600 }}>cancelBid</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: colors.text.secondary }}>Gas Fee</span>
                <span style={{ color: colors.text.secondary }}>~0.0001 ETH</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1, padding: "12px 0", background: "rgba(255,255,255,0.06)", borderRadius: 10, textAlign: "center", color: colors.text.secondary, fontSize: 14, fontWeight: 600 }}>Reject</div>
              <div style={{ flex: 1, padding: "12px 0", background: "linear-gradient(to right, #dc2626, #ef4444)", borderRadius: 10, textAlign: "center", color: "white", fontSize: 14, fontWeight: 600 }}>Confirm</div>
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
              <div style={{ fontSize: 14, fontWeight: 600, color: "#34d399" }}>Bid Cancelled</div>
              <div style={{ fontSize: 12, color: "rgba(52,211,153,0.7)" }}>Order removed from market</div>
            </div>
          </div>
        </div>
      )}

      {/* Cursor */}
      <CursorAnimation
        steps={[
          { target: { x: 0.46, y: 0.033 }, startFrame: sec(1.5), moveDuration: sec(0.5), click: true },
          { target: { x: 0.5, y: 0.3 }, startFrame: sec(6), moveDuration: sec(0.6), click: true },
          { target: { x: 0.38, y: 0.42 }, startFrame: sec(11), moveDuration: sec(0.6), click: true },
          { target: { x: 0.56, y: 0.55 }, startFrame: sec(15), moveDuration: sec(0.6), click: true },
        ]}
      />

      {/* Annotations */}
      <Annotation text="Navigate to Orders tab" x={650} y={90} startFrame={sec(1)} duration={sec(2)} variant="info" arrowDirection="up" />
      <Annotation text="Expand the bid to cancel" x={400} y={240} startFrame={sec(6)} duration={sec(3)} variant="info" />
      <Annotation text='Click "Cancel Bid"' x={250} y={380} startFrame={sec(11)} duration={sec(2.5)} variant="error" />
      <Annotation text="Confirm cancellation in wallet" x={650} y={350} startFrame={sec(15)} duration={sec(2.5)} variant="warning" />
      <Annotation text="Bid cancelled — excluded from market clearing ✓" x={400} y={500} startFrame={sec(20)} duration={sec(4)} variant="success" />
    </AbsoluteFill>
  );
};
