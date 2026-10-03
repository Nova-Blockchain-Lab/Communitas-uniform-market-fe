import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { colors, gradients, fonts, shadows } from "../../lib/theme";
import { sec } from "../../lib/timing";
import { Annotation } from "../../components/Annotation";
import "../../styles/remotion.css";

export const DashboardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  // Stats cards
  const statsAppear = sec(2);
  const statsOpacity = interpolate(frame, [statsAppear, statsAppear + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Chart area
  const chartAppear = sec(5);
  const chartOpacity = interpolate(frame, [chartAppear, chartAppear + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Animated chart bars
  const barProgress = interpolate(frame, [chartAppear, chartAppear + sec(3)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const stats = [
    { label: "Total Volume", value: "1,234 kWh", change: "+12.5%", positive: true },
    { label: "Active Traders", value: "47", change: "+3", positive: true },
    { label: "Avg. Price", value: "€0.14/kWh", change: "-2.1%", positive: false },
    { label: "Market Cleared", value: "98.5%", change: "+0.3%", positive: true },
  ];

  const barData = [0.3, 0.5, 0.7, 0.45, 0.8, 0.65, 0.9, 0.4, 0.6, 0.75, 0.55, 0.85];

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
      <div style={{ opacity: headerOpacity, position: "absolute", top: 0, left: 0, right: 0, height: 72, background: "rgba(10,10,18,0.95)", backdropFilter: "blur(24px)", borderBottom: `1px solid ${colors.border.default}`, display: "flex", alignItems: "center", padding: "0 40px" }}>
        <div style={{ fontSize: 24, fontWeight: 800, background: gradients.primary, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>COMMUNITAS</div>
        <div style={{ marginLeft: 32, fontSize: 18, fontWeight: 600, color: "white" }}>Energy Dashboard</div>
      </div>

      {/* Stats row */}
      <div style={{ position: "absolute", top: 100, left: 40, right: 40, display: "flex", gap: 16, opacity: statsOpacity }}>
        {stats.map((stat, i) => {
          const delay = i * 5;
          const scale = spring({ frame: Math.max(0, frame - statsAppear - delay), fps, config: { damping: 14 } });
          return (
            <div key={stat.label} style={{
              flex: 1, padding: 20, borderRadius: 16,
              background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)",
              border: `1px solid ${colors.border.default}`,
              transform: `scale(${scale})`,
            }}>
              <div style={{ fontSize: 13, color: colors.text.muted, marginBottom: 8 }}>{stat.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "white", marginBottom: 4 }}>{stat.value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: stat.positive ? "#34d399" : "#f87171" }}>{stat.change}</div>
            </div>
          );
        })}
      </div>

      {/* Chart area */}
      <div style={{ position: "absolute", top: 260, left: 40, right: 40, bottom: 40, opacity: chartOpacity }}>
        <div style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)", borderRadius: 20, border: `1px solid ${colors.border.default}`, boxShadow: shadows.xl, padding: 28, height: "100%" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 8 }}>Hourly Trading Volume</div>
          <div style={{ fontSize: 13, color: colors.text.muted, marginBottom: 24 }}>Energy traded per hour (kWh)</div>

          {/* Bar chart */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 300, padding: "0 20px" }}>
            {barData.map((value, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: "100%",
                  height: value * 280 * barProgress,
                  borderRadius: "6px 6px 0 0",
                  background: i % 2 === 0
                    ? `linear-gradient(180deg, ${colors.primary[500]}, ${colors.primary[700]})`
                    : `linear-gradient(180deg, ${colors.accent.green}, ${colors.accent.emerald})`,
                  boxShadow: `0 0 12px ${i % 2 === 0 ? "rgba(51,112,255,0.2)" : "rgba(16,185,129,0.2)"}`,
                }} />
                <div style={{ fontSize: 11, color: colors.text.muted }}>{i + 8}:00</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Annotation text="Real-time market statistics" x={200} y={80} startFrame={sec(2)} duration={sec(3)} variant="info" />
      <Annotation text="Hourly volume visualization" x={300} y={240} startFrame={sec(8)} duration={sec(4)} variant="info" />
      <Annotation text="Track clearing prices and trends" x={800} y={240} startFrame={sec(13)} duration={sec(5)} variant="success" />
    </AbsoluteFill>
  );
};
