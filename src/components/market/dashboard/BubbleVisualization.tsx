import React, { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  forceCollide,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationNodeDatum,
} from "d3-force";
import { motion, AnimatePresence } from "motion/react";
import { Users, Zap, TrendingUp, Activity } from "lucide-react";
import type { HourData, Participant } from "@/hooks/useDashboardData";
import type { Trade } from "@/hooks/useTradeData";
import { truncateAddress } from "@/utils/dateHelpers";
import { wattsToKWh } from "@/utils/units";
import { EmptyState } from "@/components/ui/EmptyState";

interface BubbleVisualizationProps {
  data: HourData | undefined;
  ethPrice?: number;
  trades?: Trade[];
}

interface BubbleNode extends SimulationNodeDatum {
  id: string;
  address: string;
  amount: number;
  price?: number;
  type: "buyer" | "seller";
  radius: number;
}

type PlacedNode = BubbleNode & { x: number; y: number };

interface TradeLink {
  source: PlacedNode;
  target: PlacedNode;
  amount: number;
  buyer: string;
  seller: string;
}

/** The hovered, focused or tapped bubble or trade line. `key` is the node id or `trade-<index>`. */
interface Tip {
  key: string;
  style: ReturnType<typeof tooltipStyle>;
  node?: PlacedNode;
  link?: TradeLink;
}

const BUYER_COLOR = "#3B82F6";
const SELLER_COLOR = "#10B981";
const BUYER_COLOR_LIGHT = "rgba(59, 130, 246, 0.15)";
const SELLER_COLOR_LIGHT = "rgba(16, 185, 129, 0.15)";
const PRICE_COLOR = "#F59E0B";
const TOOLTIP_WIDTH = 220;

/** Below this chart width the participants are shown as a card list */
const CARD_LIST_BELOW = 380;

/** Minimum touch target radius for mobile accessibility (44px logical) */
const MIN_TOUCH_TARGET = 22;

/** Scale bubble radii based on container width to prevent overflow on tablets */
function getRadiusBounds(containerWidth: number): {
  minRadius: number;
  maxRadius: number;
} {
  if (containerWidth < 380) {
    return { minRadius: 18, maxRadius: 30 };
  }
  if (containerWidth < 480) {
    return { minRadius: 22, maxRadius: 38 };
  }
  if (containerWidth < 640) {
    return { minRadius: 26, maxRadius: 44 };
  }
  if (containerWidth < 800) {
    return { minRadius: 28, maxRadius: 48 };
  }
  return { minRadius: 32, maxRadius: 56 };
}

/** Scale font sizes inside bubbles based on radius */
function getBubbleFontSize(radius: number): string {
  if (radius < 22) return "7px";
  if (radius >= 44) return "10px";
  if (radius >= 34) return "9px";
  return "8px";
}

/** d3.scaleSqrt().domain([0, max]).range([lo, hi]) */
const sqrtScale = (value: number, max: number, lo: number, hi: number) =>
  lo + (hi - lo) * Math.sqrt(value / max);

/**
 * Places sellers left and buyers right with d3-force, run to completion up front: the same
 * forces and tick count as an animated run, each tick clamped to the chart bounds.
 */
function layoutBubbles(data: HourData, width: number, height: number): PlacedNode[] {
  const { minRadius, maxRadius } = getRadiusBounds(width);
  const maxAmount = Math.max(
    1,
    ...data.buyers.map((b) => b.amount),
    ...data.sellers.map((s) => s.amount)
  );
  const toNode =
    (type: BubbleNode["type"]) =>
    (p: Participant, i: number): BubbleNode => ({
      id: `${type}-${p.address}-${i}`,
      address: p.address,
      amount: p.amount,
      price: p.price,
      type,
      radius: sqrtScale(p.amount, maxAmount, minRadius, maxRadius),
    });
  const nodes = [...data.sellers.map(toNode("seller")), ...data.buyers.map(toNode("buyer"))];

  const simulation = forceSimulation(nodes)
    .force("x", forceX<BubbleNode>((d) => (d.type === "seller" ? width * 0.3 : width * 0.7)).strength(0.12))
    .force("y", forceY<BubbleNode>(height / 2).strength(0.08))
    .force("collide", forceCollide<BubbleNode>((d) => d.radius + 3).strength(0.9).iterations(3))
    .force("charge", forceManyBody<BubbleNode>().strength(-15))
    .alphaDecay(0.02)
    .velocityDecay(0.3)
    .stop();

  // ponytail: ~340 synchronous ticks, about 12 ms for 20 orders and 100 ms for 100 (it grows
  // faster than n once bubbles crowd). Move it to a worker if hours get that busy.
  const ticks = Math.ceil(Math.log(simulation.alphaMin()) / Math.log(1 - simulation.alphaDecay()));
  for (let i = 0; i < ticks; i++) {
    simulation.tick();
    for (const d of nodes) {
      d.x = Math.max(d.radius, Math.min(width - d.radius, d.x ?? 0));
      d.y = Math.max(d.radius, Math.min(height - d.radius, d.y ?? 0));
    }
  }
  return nodes as PlacedNode[];
}

/** One line per trade, from the seller's first bubble to the buyer's first bubble */
function buildTradeLinks(nodes: PlacedNode[], trades: Trade[]): TradeLink[] {
  const firstBubble = new Map<string, PlacedNode>();
  for (const n of nodes) {
    const key = `${n.type}:${n.address.toLowerCase()}`;
    if (!firstBubble.has(key)) firstBubble.set(key, n);
  }
  return trades.flatMap((t) => {
    const source = firstBubble.get(`seller:${t.seller.toLowerCase()}`);
    const target = firstBubble.get(`buyer:${t.buyer.toLowerCase()}`);
    return source && target
      ? [{ source, target, amount: wattsToKWh(t.amount), buyer: t.buyer, seller: t.seller }]
      : [];
  });
}

/** Same curve as d3.linkHorizontal */
const linkPath = ({ source: s, target: t }: TradeLink) => {
  const mx = (s.x + t.x) / 2;
  return `M${s.x},${s.y}C${mx},${s.y},${mx},${t.y},${t.x},${t.y}`;
};

/**
 * Tooltip position in page coordinates for a point in viewport coordinates. Horizontally it stays
 * within the chart's width; vertically it sits below the point in the top half of the viewport and
 * above it in the bottom half. It is portalled to <body>, so the chart box does not cut it off.
 */
function tooltipStyle(x: number, y: number, chart: DOMRect) {
  const cx = x - chart.left;
  const below = y < window.innerHeight / 2;
  return {
    left:
      window.scrollX +
      chart.left +
      (cx + TOOLTIP_WIDTH > chart.width ? Math.max(cx - TOOLTIP_WIDTH, 4) : Math.min(cx, chart.width - TOOLTIP_WIDTH - 4)),
    top: window.scrollY + (below ? y + 16 : y - 10),
    // motion owns `transform` (it animates scale), so the upward shift goes through its `y`
    y: below ? 0 : "-100%",
  };
}

const bubbleLabel = (n: BubbleNode) =>
  `${n.type === "buyer" ? "Buyer" : "Seller"} ${n.address}, ${n.amount} kWh` +
  (n.price !== undefined ? `, bid ${n.price.toFixed(6)} ETH/kWh` : "");

const chartRect = (el: SVGElement) => el.ownerSVGElement!.getBoundingClientRect();
const tooltipAtPointer = (e: React.MouseEvent<SVGElement>) =>
  tooltipStyle(e.clientX, e.clientY, chartRect(e.currentTarget));

/** Inline SVG illustration for the empty state */
const EmptyChartIllustration: React.FC = () => (
  <svg
    width="64"
    height="64"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="4"
      y="4"
      width="56"
      height="56"
      rx="12"
      stroke="var(--color-text-muted)"
      strokeOpacity="0.3"
      strokeWidth="1.5"
    />
    <path
      d="M16 44 L24 32 L32 38 L42 22 L50 28"
      stroke="var(--color-primary-500)"
      strokeOpacity="0.5"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <circle cx="24" cy="32" r="2.5" fill="var(--color-primary-500)" fillOpacity="0.6" />
    <circle cx="32" cy="38" r="2.5" fill="var(--color-primary-500)" fillOpacity="0.6" />
    <circle cx="42" cy="22" r="2.5" fill="var(--color-accent-green)" fillOpacity="0.6" />
    <path
      d="M12 48 L52 48"
      stroke="var(--color-text-muted)"
      strokeOpacity="0.2"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M12 16 L12 48"
      stroke="var(--color-text-muted)"
      strokeOpacity="0.2"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

/** Mobile card fallback -- renders participants as a list of cards */
const MobileCardList: React.FC<{
  data: HourData;
  ethPrice?: number;
  isCleared: boolean;
  clearingPrice: number;
}> = ({ data, ethPrice, isCleared, clearingPrice }) => (
  <div className="space-y-2">
    {data.sellers.map((s, i) => (
      <div
        key={`seller-${i}`}
        className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Seller
          </span>
          <span className="text-sm font-bold text-emerald-400">
            {s.amount} kWh
          </span>
        </div>
        <p className="text-xs font-mono text-[var(--color-text-secondary)] truncate">
          {s.address}
        </p>
      </div>
    ))}
    {data.buyers.map((b, i) => (
      <div
        key={`buyer-${i}`}
        className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/5"
      >
        <div className="flex items-center justify-between mb-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 uppercase tracking-wide">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            Buyer
          </span>
          <span className="text-sm font-bold text-blue-400">
            {b.amount} kWh
          </span>
        </div>
        <p className="text-xs font-mono text-[var(--color-text-secondary)] truncate">
          {b.address}
        </p>
        {b.price !== undefined && (
          <p className="text-xs text-amber-400 mt-1">
            Bid: {b.price.toFixed(6)} ETH/kWh
            {ethPrice && (
              <span className="text-[var(--color-text-muted)] ml-1">
                ({"€"}{(b.price * ethPrice).toFixed(4)})
              </span>
            )}
          </p>
        )}
      </div>
    ))}
    {isCleared && clearingPrice > 0 && (
      <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-center justify-between">
        <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
          Clearing Price
        </span>
        <span className="text-sm font-bold text-amber-400">
          {clearingPrice.toFixed(6)} ETH/kWh
        </span>
      </div>
    )}
  </div>
);

const BubbleTooltip: React.FC<{
  node: BubbleNode;
  ethPrice?: number;
  clearingPrice: number;
}> = ({ node, ethPrice, clearingPrice }) => (
  <div className="bg-[var(--color-bg-card)]/95 backdrop-blur-xl border border-white/15 rounded-xl p-2.5 sm:p-3 shadow-2xl min-w-[180px] sm:min-w-[200px] max-w-[220px] sm:max-w-[240px]">
    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[var(--color-border)]">
      <span
        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
          node.type === "buyer" ? "bg-blue-500" : "bg-emerald-500"
        }`}
      />
      <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
        {node.type === "buyer" ? "Buyer" : "Seller"}
      </span>
    </div>

    <div className="space-y-1.5">
      <div>
        <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)]">Address</span>
        <p className="text-[10px] sm:text-xs text-[var(--color-text-primary)] font-mono break-all">
          {node.address}
        </p>
      </div>

      <div>
        <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)]">Amount</span>
        <p
          className={`text-xs sm:text-sm font-bold ${
            node.type === "buyer" ? "text-blue-400" : "text-emerald-400"
          }`}
        >
          {node.amount} kWh
        </p>
      </div>

      {node.price !== undefined && (
        <div>
          <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)]">Bid Price</span>
          <p className="text-xs sm:text-sm font-bold text-amber-400">
            {node.price.toFixed(6)} ETH/kWh
          </p>
          {ethPrice && (
            <p className="text-[10px] sm:text-xs text-[var(--color-text-muted)]">
              ~{"€"}{(node.price * ethPrice).toFixed(4)}
            </p>
          )}
        </div>
      )}

      {clearingPrice > 0 && (
        <>
          <div>
            <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)]">
              Clearing Price
            </span>
            <p className="text-xs sm:text-sm font-bold text-amber-400">
              {clearingPrice.toFixed(6)} ETH/kWh
            </p>
          </div>

          <div className="pt-1.5 mt-1.5 border-t border-[var(--color-border)]">
            <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)]">Total Value</span>
            <p className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">
              {(clearingPrice * node.amount).toFixed(6)} ETH
            </p>
            {ethPrice && (
              <p className="text-[10px] sm:text-xs text-[var(--color-text-muted)]">
                ~{"€"}
                {(clearingPrice * node.amount * ethPrice).toFixed(2)}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  </div>
);

const TradeTooltip: React.FC<{ link: TradeLink }> = ({ link }) => (
  <div className="bg-[var(--color-bg-card)]/95 backdrop-blur-xl border border-violet-500/30 rounded-xl p-2.5 sm:p-3 shadow-2xl min-w-[180px] sm:min-w-[200px] max-w-[220px] sm:max-w-[240px]">
    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-violet-500/20">
      <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shrink-0" />
      <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
        Trade
      </span>
    </div>

    <div className="space-y-1.5">
      <div>
        <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)]">Seller</span>
        <p className="text-[10px] sm:text-xs text-emerald-400 font-mono break-all">
          {link.seller}
        </p>
      </div>
      <div>
        <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)]">Buyer</span>
        <p className="text-[10px] sm:text-xs text-blue-400 font-mono break-all">
          {link.buyer}
        </p>
      </div>
      <div>
        <span className="text-[10px] sm:text-xs text-[var(--color-text-muted)]">Amount</span>
        <p className="text-xs sm:text-sm font-bold text-violet-400">
          {link.amount.toFixed(2)} kWh
        </p>
      </div>
    </div>
  </div>
);

const BubbleVisualization: React.FC<BubbleVisualizationProps> = ({
  data,
  ethPrice,
  trades,
}) => {
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [tip, setTip] = useState<Tip | null>(null);

  // A tooltip pinned by a tap belongs to the hour it was opened on
  const [tipData, setTipData] = useState(data);
  if (tipData !== data) {
    setTipData(data);
    setTip(null);
  }

  // A callback ref, so the box is measured each time it mounts (empty hours unmount it).
  // The first read happens during commit, so the first paint already has the real width.
  const containerRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const measure = () => {
      if (el.clientWidth > 0) setMeasuredWidth(el.clientWidth);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isMobile = measuredWidth > 0 && measuredWidth < CARD_LIST_BELOW;
  const width = Math.max(measuredWidth, 280);
  const height = Math.max(Math.min(width * 0.65, 500), 220);
  const showChart = measuredWidth >= CARD_LIST_BELOW;

  const nodes = useMemo(
    () => (data && showChart ? layoutBubbles(data, width, height) : []),
    [data, showChart, width, height]
  );

  const links = useMemo(
    () => (data?.isCleared && trades?.length ? buildTradeLinks(nodes, trades) : []),
    [data, trades, nodes]
  );

  // Summary statistics
  const buyerCount = data?.buyers.length ?? 0;
  const sellerCount = data?.sellers.length ?? 0;
  const totalEnergy = data?.totalAvailableEnergy ?? 0;
  const clearingPrice = data?.clearingPrice ?? 0;
  const isCleared = data?.isCleared ?? false;

  // Empty state
  if (!data || (buyerCount === 0 && sellerCount === 0)) {
    return (
      <EmptyState
        icon={<Activity size={24} className="text-[var(--color-text-muted)]" />}
        iconColorClass="bg-white/5"
        title="No market activity for this hour"
        subtitle="Participants will appear when bids and asks are placed"
        illustration={<EmptyChartIllustration />}
      />
    );
  }

  // While a bubble or trade is active, dim everything it is not connected to (only when there are trades)
  const activeAddress = tip?.node?.address.toLowerCase();
  let lit: Set<string> | null = null;
  if (tip?.link) {
    lit = new Set([tip.link.seller.toLowerCase(), tip.link.buyer.toLowerCase()]);
  } else if (activeAddress && links.length > 0) {
    lit = new Set([activeAddress]);
    for (const l of links) {
      if (l.seller.toLowerCase() === activeAddress) lit.add(l.buyer.toLowerCase());
      if (l.buyer.toLowerCase() === activeAddress) lit.add(l.seller.toLowerCase());
    }
  }
  const lineOpacity = (l: TradeLink, key: string) => {
    if (tip?.link) return tip.key === key ? 0.9 : 0.1;
    if (activeAddress) {
      return l.seller.toLowerCase() === activeAddress || l.buyer.toLowerCase() === activeAddress ? 0.7 : 0.1;
    }
    return 0.4;
  };
  const maxTradeAmount = Math.max(1, ...links.map((l) => l.amount));

  // Mouse hover shows the tooltip, a tap or click toggles it
  const tipHandlers = (key: string, item: Pick<Tip, "node" | "link">) => ({
    onPointerEnter: (e: React.PointerEvent<SVGElement>) => {
      if (e.pointerType === "mouse") setTip({ key, ...item, style: tooltipAtPointer(e) });
    },
    onPointerMove: (e: React.PointerEvent<SVGElement>) => {
      if (e.pointerType === "mouse") setTip({ key, ...item, style: tooltipAtPointer(e) });
    },
    onPointerLeave: (e: React.PointerEvent<SVGElement>) => {
      if (e.pointerType === "mouse") setTip(null);
    },
    onClick: (e: React.MouseEvent<SVGElement>) => {
      const style = tooltipAtPointer(e);
      setTip((prev) => (prev?.key === key ? null : { key, ...item, style }));
    },
  });

  const clearingLabelWidth = width < 500 ? 130 : 160;
  const svgFontSize = width < 480 ? "7" : width < 640 ? "8" : "10";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="p-2.5 sm:p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <Users size={14} className="text-blue-400 shrink-0" />
            <span className="text-[10px] sm:text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
              Buyers
            </span>
          </div>
          <p className="text-base sm:text-lg font-bold text-blue-400">{buyerCount}</p>
        </div>

        <div className="p-2.5 sm:p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <Users size={14} className="text-emerald-400 shrink-0" />
            <span className="text-[10px] sm:text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
              Sellers
            </span>
          </div>
          <p className="text-base sm:text-lg font-bold text-emerald-400">{sellerCount}</p>
        </div>

        <div className="p-2.5 sm:p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <TrendingUp size={14} className="text-amber-400 shrink-0" />
            <span className="text-[10px] sm:text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
              Clearing Price
            </span>
          </div>
          <p className="text-sm sm:text-lg font-bold text-amber-400 break-all">
            {isCleared ? `${clearingPrice.toFixed(6)} ETH/kWh` : "Pending"}
          </p>
          {isCleared && ethPrice ? (
            <p className="text-[10px] sm:text-xs text-[var(--color-text-muted)]">
              ~{"€"}{(clearingPrice * ethPrice).toFixed(4)}
            </p>
          ) : null}
        </div>

        <div className="p-2.5 sm:p-3 bg-white/5 border border-[var(--color-border)] rounded-xl">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <Zap size={14} className="text-[var(--color-text-secondary)] shrink-0" />
            <span className="text-[10px] sm:text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
              Total Energy
            </span>
          </div>
          <p className="text-base sm:text-lg font-bold text-[var(--color-text-primary)]">{totalEnergy} kWh</p>
        </div>
      </div>

      {/* Bubble chart / mobile card fallback */}
      <div
        ref={containerRef}
        className="relative w-full bg-white/[0.02] border border-[var(--color-border)] rounded-xl overflow-hidden"
      >
        {isMobile && (
          <div className="p-4">
            <MobileCardList
              data={data}
              ethPrice={ethPrice}
              isCleared={isCleared}
              clearingPrice={clearingPrice}
            />
          </div>
        )}
        {showChart && (
          <>
            {/* Side labels */}
            <div className="absolute top-2 sm:top-3 left-2 sm:left-4 z-10 flex items-center gap-1 sm:gap-1.5">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[10px] sm:text-xs font-medium text-emerald-400/90">
                Sellers
              </span>
            </div>
            <div className="absolute top-2 sm:top-3 right-2 sm:right-4 z-10 flex items-center gap-1 sm:gap-1.5">
              <span className="text-[10px] sm:text-xs font-medium text-blue-400/90">Buyers</span>
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-500 shrink-0" />
            </div>

            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full select-none"
              preserveAspectRatio="xMidYMid meet"
              role="group"
              aria-label="Bubble chart showing market participants"
              onClick={(e) => {
                // A tap on the background dismisses the tooltip
                if (!(e.target as Element).closest(".bubble, .trade-line")) setTip(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setTip(null);
              }}
            >
              {/* Center divider */}
              <line
                x1={width / 2}
                y1={20}
                x2={width / 2}
                y2={height - 20}
                stroke="white"
                strokeOpacity={0.06}
                strokeWidth={1}
                strokeDasharray="4 6"
              />

              {/* Clearing price line */}
              {isCleared && clearingPrice > 0 && (
                <g>
                  <line
                    x1={20}
                    y1={height * 0.2}
                    x2={width - 20}
                    y2={height * 0.2}
                    stroke={PRICE_COLOR}
                    strokeOpacity={0.4}
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                  />
                  <rect
                    x={width - clearingLabelWidth - 20}
                    y={height * 0.2 - 12}
                    width={clearingLabelWidth}
                    height={20}
                    rx={4}
                    fill="rgba(0,0,0,0.6)"
                  />
                  <text
                    x={width - clearingLabelWidth / 2 - 20}
                    y={height * 0.2 + 1}
                    textAnchor="middle"
                    fill={PRICE_COLOR}
                    fontSize={svgFontSize}
                    fontWeight="600"
                    fontFamily="monospace"
                  >
                    Clearing: {clearingPrice.toFixed(6)} ETH
                  </text>
                </g>
              )}

              {/* Side gradient backgrounds */}
              <defs>
                <linearGradient id="sellerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={SELLER_COLOR} stopOpacity={0.03} />
                  <stop offset="100%" stopColor={SELLER_COLOR} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="buyerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={BUYER_COLOR} stopOpacity={0} />
                  <stop offset="100%" stopColor={BUYER_COLOR} stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="tradeLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                  <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.9} />
                </linearGradient>
              </defs>
              <rect x={0} y={0} width={width / 2} height={height} fill="url(#sellerGrad)" />
              <rect x={width / 2} y={0} width={width / 2} height={height} fill="url(#buyerGrad)" />

              {/* Keyed by hour so the intro animation replays when the hour changes */}
              <g key={data.timestamp}>
                {/* Trade connection lines (behind bubbles) */}
                {links.map((l, i) => {
                  const key = `trade-${i}`;
                  return (
                    <path
                      key={key}
                      className="trade-line"
                      d={linkPath(l)}
                      fill="none"
                      stroke="url(#tradeLineGrad)"
                      strokeLinecap="round"
                      style={{
                        strokeWidth: sqrtScale(l.amount, maxTradeAmount, 1.5, 6) + (tip?.key === key ? 2 : 0),
                        opacity: lineOpacity(l, key),
                        animationDelay: `${i * 100}ms`,
                      }}
                      {...tipHandlers(key, { link: l })}
                    />
                  );
                })}

                {nodes.map((n, i) => {
                  const color = n.type === "buyer" ? BUYER_COLOR : SELLER_COLOR;
                  const fontSize = getBubbleFontSize(n.radius);
                  return (
                    <g
                      key={n.id}
                      className="bubble"
                      transform={`translate(${n.x},${n.y})`}
                      tabIndex={0}
                      role="img"
                      aria-label={bubbleLabel(n)}
                      data-active={tip?.key === n.id || undefined}
                      style={{
                        opacity: lit && !lit.has(n.address.toLowerCase()) ? 0.15 : 1,
                        animationDelay: `${i * 80}ms`,
                      }}
                      {...tipHandlers(n.id, { node: n })}
                      onFocus={(e) => {
                        // Keyboard focus only; a click focuses too, and onClick handles that
                        if (!e.currentTarget.matches(":focus-visible")) return;
                        const r = e.currentTarget.getBoundingClientRect();
                        const style = tooltipStyle(r.left + r.width / 2, r.top + r.height / 2, chartRect(e.currentTarget));
                        setTip({ key: n.id, node: n, style });
                      }}
                      onBlur={() => setTip((prev) => (prev?.key === n.id ? null : prev))}
                    >
                      {/* Larger invisible hit area for touch */}
                      <circle r={Math.max(n.radius + 8, MIN_TOUCH_TARGET)} fill="transparent" />
                      {/* Stroke changes on hover and focus live in globals.css */}
                      <circle
                        className="bubble-glow"
                        r={n.radius + 4}
                        fill="none"
                        stroke={color}
                        strokeWidth={1}
                        strokeOpacity={0.2}
                      />
                      <circle
                        className="bubble-main"
                        r={n.radius}
                        fill={n.type === "buyer" ? BUYER_COLOR_LIGHT : SELLER_COLOR_LIGHT}
                        stroke={color}
                        strokeWidth={1.5}
                        strokeOpacity={0.6}
                      />
                      <text
                        textAnchor="middle"
                        dy="-0.3em"
                        fill="#E2E8F0"
                        fontSize={fontSize}
                        fontFamily="monospace"
                        fontWeight="600"
                        pointerEvents="none"
                        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
                      >
                        {truncateAddress(n.address)}
                      </text>
                      <text
                        textAnchor="middle"
                        dy="1em"
                        fill={color}
                        fontSize={fontSize}
                        fontWeight="bold"
                        pointerEvents="none"
                        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
                      >
                        {n.amount} kWh
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            {/* The trade lines for screen readers; each bubble carries its own label */}
            {links.length > 0 && (
              <ul className="sr-only" aria-label="Trades this hour">
                {links.map((l, i) => (
                  <li key={i}>
                    {l.seller} sold {l.amount.toFixed(2)} kWh to {l.buyer}
                  </li>
                ))}
              </ul>
            )}

            {/* Tooltip, in <body> so the chart's rounded, clipped box cannot cut it off */}
            {createPortal(
              <AnimatePresence>
                {tip && (
                  <motion.div
                    key={tip.link ? "trade" : "bubble"}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-50 pointer-events-none"
                    style={tip.style}
                  >
                    {tip.link ? (
                      <TradeTooltip link={tip.link} />
                    ) : (
                      tip.node && (
                        <BubbleTooltip
                          node={tip.node}
                          ethPrice={ethPrice}
                          clearingPrice={isCleared ? clearingPrice : 0}
                        />
                      )
                    )}
                  </motion.div>
                )}
              </AnimatePresence>,
              document.body
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default BubbleVisualization;
