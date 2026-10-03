import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, gradients, fonts, shadows } from "../../lib/theme";
import { sec } from "../../lib/timing";
import { CursorAnimation } from "../../components/CursorAnimation";
import { Annotation } from "../../components/Annotation";
import "../../styles/remotion.css";

/**
 * TC09.03 — Bidding on Energy (Buyer)
 * Steps: Connect → Buy tab → Date/time → Amount/price → Confirm → Verify
 */
export const BidOnEnergyScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Tab selection - "Buy" gets highlighted
  const buyTabActive = frame >= sec(3);
  const tabSliderX = interpolate(frame, [sec(3), sec(3.5)], [0, 0], { extrapolateRight: "clamp" });

  // Two-card layout appears
  const cardsAppear = sec(4);
  const cardOpacity = interpolate(frame, [cardsAppear, cardsAppear + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Calendar interaction
  const calendarClickFrame = sec(8);
  const calendarHighlight = frame >= calendarClickFrame && frame < sec(12);

  // Amount typing
  const amountFrame = sec(14);
  const amountChars = frame >= amountFrame ? Math.min(Math.floor((frame - amountFrame) / 3), "25".length) : 0;
  const typedAmount = "25".slice(0, amountChars);

  // Price adjustment
  const priceFrame = sec(18);
  const priceChars = frame >= priceFrame ? Math.min(Math.floor((frame - priceFrame) / 3), "0.15".length) : 0;
  const typedPrice = "0.15".slice(0, priceChars);

  // Submit
  const submitFrame = sec(24);
  const showSubmit = frame >= submitFrame;

  // Wallet popup
  const walletFrame = sec(27);
  const showWallet = frame >= walletFrame && frame < sec(32);
  const walletScale = showWallet
    ? spring({ frame: frame - walletFrame, fps, config: { damping: 14 } })
    : 0;

  // Success
  const successFrame = sec(33);
  const showSuccess = frame >= successFrame;
  const successOpacity = interpolate(frame, [successFrame, successFrame + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tab items
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

        {/* Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10 }}>
          {tabs.map((tab, i) => (
            <div key={tab} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, color: (buyTabActive && i === 0) ? "white" : colors.text.muted, background: (buyTabActive && i === 0) ? "rgba(51,112,255,0.2)" : "transparent", transition: "all 0.2s" }}>
              {tab}
            </div>
          ))}
        </div>

        {/* Connected wallet */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ padding: "8px 16px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, color: "#34d399", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
            0x1234...5678
          </div>
        </div>
      </div>

      {/* Two-card layout */}
      {frame >= cardsAppear && (
        <div style={{ position: "absolute", top: 110, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 24, opacity: cardOpacity }}>
          {/* Left Card: Date/Time Picker */}
          <div style={{ width: 440, background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)", borderRadius: 20, border: `1px solid ${colors.border.default}`, boxShadow: shadows.xl, padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ padding: 8, borderRadius: 12, background: "rgba(51,112,255,0.15)", color: colors.primary[400], fontSize: 18 }}>📅</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "white" }}>Select Time Period</div>
                <div style={{ fontSize: 13, color: colors.text.secondary }}>Choose when you want to buy energy</div>
              </div>
            </div>

            {/* Calendar mockup */}
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <span style={{ color: colors.text.muted }}>◀</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: "white" }}>March 2026</span>
                <span style={{ color: colors.text.muted }}>▶</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, textAlign: "center" }}>
                {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
                  <div key={d} style={{ fontSize: 11, color: colors.text.muted, fontWeight: 600, padding: 6, textTransform: "uppercase" }}>{d}</div>
                ))}
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <div key={day} style={{
                    fontSize: 13, fontWeight: 500, padding: 8, borderRadius: 8,
                    color: (calendarHighlight && day === 18) ? "white" : (day === 17 ? colors.primary[400] : colors.text.secondary),
                    background: (calendarHighlight && day === 18) ? colors.primary[500] : (day === 17 ? "rgba(51,112,255,0.15)" : "transparent"),
                    border: day === 17 ? `2px solid ${colors.primary[400]}` : "2px solid transparent",
                  }}>{day}</div>
                ))}
              </div>

              {/* Hour selector */}
              <div style={{ marginTop: 12, display: "flex", gap: 4, flexWrap: "wrap" }}>
                {[14, 15, 16, 17].map(h => (
                  <div key={h} style={{
                    padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                    background: (calendarHighlight && (h === 14 || h === 15)) ? "rgba(51,112,255,0.2)" : "rgba(255,255,255,0.05)",
                    color: (calendarHighlight && (h === 14 || h === 15)) ? colors.primary[400] : colors.text.muted,
                    border: `1px solid ${(calendarHighlight && (h === 14 || h === 15)) ? "rgba(51,112,255,0.3)" : colors.border.default}`,
                  }}>{h}:00</div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Card: Bid Form */}
          <div style={{ width: 440, background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)", borderRadius: 20, border: `1px solid ${colors.border.default}`, boxShadow: shadows.xl, padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <div style={{ padding: 8, borderRadius: 12, background: "rgba(51,112,255,0.15)", color: colors.primary[400], fontSize: 18 }}>⚡</div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "white" }}>Place Your Bid</div>
                <div style={{ fontSize: 13, color: colors.text.secondary }}>Set energy amount and price</div>
              </div>
            </div>

            {/* Energy Amount */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: colors.text.secondary, marginBottom: 8 }}>Energy Amount</div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ padding: "10px 16px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>⚡</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#fbbf24" }}>kWh</span>
                </div>
                <div style={{ flex: 1, padding: "10px 16px", background: "rgba(255,255,255,0.05)", border: `1px solid ${colors.border.default}`, borderRadius: 12, fontSize: 18, fontWeight: 600, color: typedAmount ? "white" : colors.text.muted }}>
                  {typedAmount || "0"}
                </div>
              </div>
              {/* Slider */}
              <div style={{ marginTop: 8, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.1)", position: "relative" }}>
                <div style={{ width: `${(Number(typedAmount) || 0) / 100 * 100}%`, height: "100%", borderRadius: 4, background: colors.primary[500] }} />
              </div>
            </div>

            {/* Price per kWh */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: colors.text.secondary }}>Price per kWh</span>
                <div style={{ padding: "4px 12px", background: "rgba(255,255,255,0.05)", borderRadius: 6, fontSize: 12, color: colors.text.muted }}>EUR ↔ ETH</div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ padding: "10px 16px", background: "rgba(51,112,255,0.1)", border: "1px solid rgba(51,112,255,0.2)", borderRadius: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>€</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: colors.primary[400] }}>EUR</span>
                </div>
                <div style={{ flex: 1, padding: "10px 16px", background: "rgba(255,255,255,0.05)", border: `1px solid ${colors.border.default}`, borderRadius: 12, fontSize: 18, fontWeight: 600, color: typedPrice ? "white" : colors.text.muted }}>
                  {typedPrice || "0"}
                </div>
              </div>
            </div>

            {/* Summary */}
            <div style={{ padding: 16, background: "rgba(255,255,255,0.05)", borderRadius: 12, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 8 }}>
                <span style={{ color: colors.text.muted }}>Bidding for</span>
                <span style={{ color: "white", fontWeight: 600 }}>2 hours</span>
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.1)", marginBottom: 8 }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 13, color: colors.text.muted }}>Total Cost</span>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "white" }}>0.000342 <span style={{ fontSize: 16, color: "#fbbf24" }}>ETH</span></div>
                  <div style={{ fontSize: 13, color: colors.text.muted }}>~7.50 EUR</div>
                </div>
              </div>
            </div>

            {/* Submit button */}
            <div style={{ padding: "14px 0", background: gradients.btnPrimary, borderRadius: 12, textAlign: "center", color: "white", fontSize: 16, fontWeight: 600, boxShadow: shadows.lg }}>
              Submit Bid
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
                <span style={{ color: "white", fontWeight: 600 }}>placeBid</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 8 }}>
                <span style={{ color: colors.text.secondary }}>Value</span>
                <span style={{ color: "white", fontWeight: 600 }}>0.000342 ETH</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                <span style={{ color: colors.text.secondary }}>Gas Fee</span>
                <span style={{ color: colors.text.secondary }}>~0.0002 ETH</span>
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
              <div style={{ fontSize: 14, fontWeight: 600, color: "#34d399" }}>Bid Placed Successfully!</div>
              <div style={{ fontSize: 12, color: "rgba(52,211,153,0.7)" }}>25 kWh bid submitted to market</div>
            </div>
          </div>
        </div>
      )}

      {/* Cursor */}
      <CursorAnimation
        steps={[
          { target: { x: 0.37, y: 0.033 }, startFrame: sec(2), moveDuration: sec(0.6), click: true },
          { target: { x: 0.33, y: 0.45 }, startFrame: sec(7), moveDuration: sec(0.8), click: true },
          { target: { x: 0.29, y: 0.62 }, startFrame: sec(10), moveDuration: sec(0.5), click: true },
          { target: { x: 0.71, y: 0.28 }, startFrame: sec(13), moveDuration: sec(0.8), click: true },
          { target: { x: 0.71, y: 0.45 }, startFrame: sec(17), moveDuration: sec(0.6), click: true },
          { target: { x: 0.71, y: 0.78 }, startFrame: sec(23), moveDuration: sec(0.8), click: true },
          { target: { x: 0.56, y: 0.55 }, startFrame: sec(28), moveDuration: sec(0.6), click: true },
        ]}
      />

      {/* Annotations */}
      <Annotation text='Click "Buy Energy" tab' x={550} y={90} startFrame={sec(2)} duration={sec(2)} variant="info" arrowDirection="up" />
      <Annotation text="Select date and hours" x={200} y={350} startFrame={sec(7)} duration={sec(4)} variant="info" />
      <Annotation text="Enter energy amount: 25 kWh" x={960} y={250} startFrame={sec(13)} duration={sec(3)} variant="info" />
      <Annotation text="Set price per kWh in EUR" x={960} y={400} startFrame={sec(17)} duration={sec(3)} variant="info" />
      <Annotation text='Click "Submit Bid"' x={960} y={700} startFrame={sec(23)} duration={sec(2.5)} variant="info" />
      <Annotation text="Confirm in wallet" x={650} y={350} startFrame={sec(28)} duration={sec(2.5)} variant="warning" />
      <Annotation text="Bid successfully added ✓" x={700} y={500} startFrame={sec(34)} duration={sec(5)} variant="success" />
    </AbsoluteFill>
  );
};
