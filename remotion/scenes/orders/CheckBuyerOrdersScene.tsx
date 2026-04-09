import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, gradients, fonts, shadows } from "../../lib/theme";
import { sec } from "../../lib/timing";
import { CursorAnimation } from "../../components/CursorAnimation";
import { Annotation } from "../../components/Annotation";
import "../../styles/remotion.css";

/**
 * TC09.05 — Checking Bid Result (Buyer)
 * Steps: Connect → View Orders → Select day → Check fulfilled/rejected → Check price
 */
export const CheckBuyerOrdersScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const ordersTabActive = frame >= sec(2);

  // Orders card
  const cardAppear = sec(3);
  const cardOpacity = interpolate(frame, [cardAppear, cardAppear + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Date navigation click
  const dateClickFrame = sec(6);
  const dateChanged = frame >= dateClickFrame;

  // Order expanded
  const expandFrame = sec(9);
  const orderExpanded = frame >= expandFrame;
  const expandHeight = orderExpanded
    ? interpolate(frame, [expandFrame, expandFrame + 10], [0, 180], { extrapolateRight: "clamp" })
    : 0;

  // Clearing price highlight
  const priceHighlight = frame >= sec(14);

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
            <div key={tab} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, color: (ordersTabActive && i === 2) ? "white" : colors.text.muted, background: (ordersTabActive && i === 2) ? "rgba(51,112,255,0.2)" : "transparent" }}>
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
        <div style={{ position: "absolute", top: 110, left: "50%", transform: "translateX(-50%)", opacity: cardOpacity, width: 900 }}>
          <div style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)", borderRadius: 20, border: `1px solid ${colors.border.default}`, boxShadow: shadows.xl, padding: 28 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ padding: 8, borderRadius: 12, background: "rgba(51,112,255,0.15)", color: colors.primary[400], fontSize: 18 }}>📋</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "white" }}>My Orders</div>
                <div style={{ fontSize: 13, color: colors.text.secondary }}>View and manage your bids and asks</div>
              </div>
            </div>

            {/* Date Navigation Bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 20, padding: "10px 0" }}>
              <div style={{ color: colors.text.muted, cursor: "pointer" }}>◀</div>
              {["Mar 16", "Mar 17", "Mar 18", "Mar 19"].map((d, i) => (
                <div key={d} style={{
                  padding: "8px 20px", borderRadius: 10,
                  background: (dateChanged && i === 2) ? "rgba(51,112,255,0.15)" : (i === 1 && !dateChanged) ? "rgba(51,112,255,0.15)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${(dateChanged && i === 2) || (i === 1 && !dateChanged) ? "rgba(51,112,255,0.3)" : colors.border.default}`,
                  color: (dateChanged && i === 2) || (i === 1 && !dateChanged) ? colors.primary[400] : colors.text.muted,
                  fontSize: 14, fontWeight: 600,
                }}>
                  {d}
                </div>
              ))}
              <div style={{ color: colors.text.muted, cursor: "pointer" }}>▶</div>
            </div>

            {/* Two-column layout */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Buy Orders Column */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 12, borderBottom: "1px solid rgba(51,112,255,0.2)", marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(51,112,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: colors.primary[400], fontSize: 14, fontWeight: 700 }}>B</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>Buy Orders</div>
                    <div style={{ fontSize: 12, color: colors.text.muted }}>2 orders</div>
                  </div>
                </div>

                {/* Order 1 - Settled */}
                <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", marginBottom: 12 }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: colors.primary[500] }} />
                  <div style={{ marginLeft: 6, padding: 14, background: "linear-gradient(to right, rgba(51,112,255,0.1), transparent)", border: "1px solid rgba(51,112,255,0.2)", borderLeft: "none", borderRadius: "0 12px 12px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(51,112,255,0.2)", color: colors.primary[400], fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const }}>Buy</div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "white" }}>14:00</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: colors.primary[400] }}>25 kWh</span>
                      </div>
                      <div style={{ padding: "4px 10px", borderRadius: 20, background: "rgba(16,185,129,0.15)", color: "#34d399", fontSize: 12, fontWeight: 500, border: "1px solid rgba(16,185,129,0.25)" }}>
                        Settled ✓
                      </div>
                    </div>

                    {/* Expanded details */}
                    {orderExpanded && (
                      <div style={{ overflow: "hidden", height: expandHeight }}>
                        <div style={{ paddingTop: 12, marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                            <div>
                              <div style={{ fontSize: 11, color: colors.text.muted, textTransform: "uppercase" as const, marginBottom: 4 }}>Price/kWh</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: "white" }}>0.000057 ETH</div>
                              <div style={{ fontSize: 11, color: colors.text.muted }}>~€0.15</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 11, color: colors.text.muted, textTransform: "uppercase" as const, marginBottom: 4 }}>Total Value</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: "white" }}>0.001425 ETH</div>
                              <div style={{ fontSize: 11, color: colors.text.muted }}>~€3.75</div>
                            </div>
                          </div>
                          {/* Clearing price */}
                          <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                            <div style={{ fontSize: 11, color: colors.text.muted, textTransform: "uppercase" as const, marginBottom: 4 }}>Clearing Price</div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                              <span style={{ fontSize: 20, fontWeight: 700, color: priceHighlight ? "#fbbf24" : "white", textShadow: priceHighlight ? "0 0 16px rgba(251,191,36,0.3)" : "none" }}>0.000045</span>
                              <span style={{ fontSize: 14, color: colors.text.muted }}>ETH/kWh</span>
                              <span style={{ fontSize: 12, color: colors.text.muted }}>(~€0.12)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order 2 - Refunded */}
                <div style={{ position: "relative", borderRadius: 12, overflow: "hidden" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: colors.primary[500] }} />
                  <div style={{ marginLeft: 6, padding: 14, background: "linear-gradient(to right, rgba(51,112,255,0.1), transparent)", border: "1px solid rgba(51,112,255,0.2)", borderLeft: "none", borderRadius: "0 12px 12px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(51,112,255,0.2)", color: colors.primary[400], fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const }}>Buy</div>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "white" }}>15:00</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: colors.primary[400] }}>10 kWh</span>
                      </div>
                      <div style={{ padding: "4px 10px", borderRadius: 20, background: "rgba(245,158,11,0.15)", color: "#fbbf24", fontSize: 12, fontWeight: 500, border: "1px solid rgba(245,158,11,0.25)" }}>
                        Refunded
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sell Orders Column */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 12, borderBottom: "1px solid rgba(16,185,129,0.2)", marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#34d399", fontSize: 14, fontWeight: 700 }}>S</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>Sell Orders</div>
                    <div style={{ fontSize: 12, color: colors.text.muted }}>0 orders</div>
                  </div>
                </div>
                <div style={{ padding: 32, textAlign: "center" }}>
                  <div style={{ fontSize: 14, color: colors.text.muted }}>No sell orders for this day</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cursor */}
      <CursorAnimation
        steps={[
          { target: { x: 0.46, y: 0.033 }, startFrame: sec(1.5), moveDuration: sec(0.5), click: true },
          { target: { x: 0.52, y: 0.2 }, startFrame: sec(5), moveDuration: sec(0.6), click: true },
          { target: { x: 0.36, y: 0.37 }, startFrame: sec(8), moveDuration: sec(0.6), click: true },
          { target: { x: 0.36, y: 0.55 }, startFrame: sec(12), moveDuration: sec(0.5) },
        ]}
      />

      {/* Annotations */}
      <Annotation text='Navigate to "Orders" tab' x={650} y={90} startFrame={sec(1)} duration={sec(2)} variant="info" arrowDirection="up" />
      <Annotation text="Select order day" x={770} y={190} startFrame={sec(5)} duration={sec(2.5)} variant="info" />
      <Annotation text="Click to expand bid details" x={150} y={340} startFrame={sec(8)} duration={sec(3)} variant="info" />
      <Annotation text="Order fulfilled at clearing price" x={150} y={600} startFrame={sec(14)} duration={sec(4)} variant="success" />
      <Annotation text="Bid refunded — price too low" x={150} y={700} startFrame={sec(16)} duration={sec(3)} variant="warning" />
    </AbsoluteFill>
  );
};
