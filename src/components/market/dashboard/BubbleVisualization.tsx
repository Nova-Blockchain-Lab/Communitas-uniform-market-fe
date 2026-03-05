import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import * as d3 from "d3";
import { motion, AnimatePresence } from "motion/react";
import { Users, Zap, TrendingUp, Activity } from "lucide-react";
import type { HourData, Participant } from "@/hooks/useDashboardData";
import type { Trade } from "@/hooks/useTradeData";
import { truncateAddress } from "@/utils/dateHelpers";
import { wattsToKWh } from "@/utils/units";
import { EmptyState } from "@/components/ui";

interface BubbleVisualizationProps {
  data: HourData | undefined;
  ethPrice?: number;
  trades?: Trade[];
}

interface TradeLink {
  source: BubbleNode;
  target: BubbleNode;
  amount: number;
  buyer: string;
  seller: string;
}

interface TradeTooltipData {
  x: number;
  y: number;
  link: TradeLink;
}

interface BubbleNode extends d3.SimulationNodeDatum {
  id: string;
  address: string;
  amount: number;
  price?: number;
  type: "buyer" | "seller";
  radius: number;
}

interface TooltipData {
  x: number;
  y: number;
  node: BubbleNode;
}

const BUYER_COLOR = "#3B82F6";
const SELLER_COLOR = "#10B981";
const BUYER_COLOR_LIGHT = "rgba(59, 130, 246, 0.15)";
const SELLER_COLOR_LIGHT = "rgba(16, 185, 129, 0.15)";
const PRICE_COLOR = "#F59E0B";
const MIN_RADIUS = 32;
const MAX_RADIUS = 56;
const TOOLTIP_WIDTH = 220;
const TOOLTIP_HEIGHT_ESTIMATE = 180;

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

/** Mobile card fallback — renders participants as a list of cards */
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
                ({"\u20AC"}{(b.price * ethPrice).toFixed(4)})
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

const BubbleVisualization: React.FC<BubbleVisualizationProps> = ({
  data,
  ethPrice,
  trades,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<BubbleNode, undefined> | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [tradeTooltip, setTradeTooltip] = useState<TradeTooltipData | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Handle resize and detect mobile
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      if (!mountedRef.current) return;
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          setIsMobile(width < 640);
          setDimensions({
            width: Math.max(width, 300),
            height: Math.max(Math.min(width * 0.6, 500), 250),
          });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Compute radius scale
  const getRadius = useCallback(
    (amount: number, allAmounts: number[]): number => {
      if (allAmounts.length === 0) return MIN_RADIUS;
      const maxAmount = Math.max(...allAmounts, 1);
      const scale = d3
        .scaleSqrt()
        .domain([0, maxAmount])
        .range([MIN_RADIUS, MAX_RADIUS]);
      return scale(amount);
    },
    []
  );

  // Track mounted state to avoid state updates during Framer Motion exit animation
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Build nodes from data
  const nodes: BubbleNode[] = useMemo(() => {
    if (!data) return [];

    const allAmounts = [
      ...data.buyers.map((b) => b.amount),
      ...data.sellers.map((s) => s.amount),
    ];

    const buyerNodes: BubbleNode[] = data.buyers.map(
      (buyer: Participant, i: number) => ({
        id: `buyer-${buyer.address}-${i}`,
        address: buyer.address,
        amount: buyer.amount,
        price: buyer.price,
        type: "buyer" as const,
        radius: getRadius(buyer.amount, allAmounts),
      })
    );

    const sellerNodes: BubbleNode[] = data.sellers.map(
      (seller: Participant, i: number) => ({
        id: `seller-${seller.address}-${i}`,
        address: seller.address,
        amount: seller.amount,
        type: "seller" as const,
        radius: getRadius(seller.amount, allAmounts),
      })
    );

    return [...sellerNodes, ...buyerNodes];
  }, [data, getRadius]);

  // Build trade links matching trades to seller/buyer nodes
  const tradeLinks: TradeLink[] = useMemo(() => {
    if (!data?.isCleared || !trades?.length || nodes.length === 0) return [];

    const sellerNodeMap = new Map<string, BubbleNode>();
    const buyerNodeMap = new Map<string, BubbleNode>();

    for (const node of nodes) {
      const key = node.address.toLowerCase();
      if (node.type === "seller" && !sellerNodeMap.has(key)) {
        sellerNodeMap.set(key, node);
      } else if (node.type === "buyer" && !buyerNodeMap.has(key)) {
        buyerNodeMap.set(key, node);
      }
    }

    const links: TradeLink[] = [];
    for (const trade of trades) {
      const sellerNode = sellerNodeMap.get(trade.seller.toLowerCase());
      const buyerNode = buyerNodeMap.get(trade.buyer.toLowerCase());
      if (sellerNode && buyerNode) {
        links.push({
          source: sellerNode,
          target: buyerNode,
          amount: wattsToKWh(trade.amount),
          buyer: trade.buyer,
          seller: trade.seller,
        });
      }
    }

    return links;
  }, [data?.isCleared, trades, nodes]);

  // D3 force simulation
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0 || isMobile) {
      // Clear previous simulation
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
      return;
    }

    const { width, height } = dimensions;
    const svg = d3.select(svgRef.current);

    // Clear all D3-managed elements so React can cleanly unmount
    svg.select(".bubbles-group").selectAll("*").remove();
    svg.select(".trade-lines-group").selectAll("*").remove();

    const g = svg.select<SVGGElement>(".bubbles-group");
    const tradeLineGroup = svg.select<SVGGElement>(".trade-lines-group");

    // Create simulation
    const simulation = d3
      .forceSimulation<BubbleNode>(nodes)
      .force(
        "x",
        d3
          .forceX<BubbleNode>((d) =>
            d.type === "seller" ? width * 0.3 : width * 0.7
          )
          .strength(0.12)
      )
      .force(
        "y",
        d3.forceY<BubbleNode>(height / 2).strength(0.08)
      )
      .force(
        "collide",
        d3
          .forceCollide<BubbleNode>((d) => d.radius + 3)
          .strength(0.9)
          .iterations(3)
      )
      .force("charge", d3.forceManyBody().strength(-15))
      .alphaDecay(0.02)
      .velocityDecay(0.3);

    simulationRef.current = simulation;

    // Create bubble groups
    const bubbleGroups = g
      .selectAll<SVGGElement, BubbleNode>(".bubble")
      .data(nodes, (d: BubbleNode) => d.id)
      .join(
        (enter) => {
          const group = enter
            .append("g")
            .attr("class", "bubble")
            .style("cursor", "pointer")
            .style("opacity", 0);

          // Outer glow circle
          group
            .append("circle")
            .attr("class", "bubble-glow")
            .attr("r", 0)
            .attr("fill", "none")
            .attr("stroke", (d) =>
              d.type === "buyer" ? BUYER_COLOR : SELLER_COLOR
            )
            .attr("stroke-width", 1)
            .attr("stroke-opacity", 0.2)
            .transition()
            .duration(300)
            .attr("r", (d) => d.radius + 4);

          // Main circle
          group
            .append("circle")
            .attr("class", "bubble-main")
            .attr("r", 0)
            .attr("fill", (d) =>
              d.type === "buyer" ? BUYER_COLOR_LIGHT : SELLER_COLOR_LIGHT
            )
            .attr("stroke", (d) =>
              d.type === "buyer" ? BUYER_COLOR : SELLER_COLOR
            )
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", 0.6)
            .transition()
            .duration(300)
            .attr("r", (d) => d.radius);

          // Address text
          group
            .append("text")
            .attr("class", "bubble-address")
            .attr("text-anchor", "middle")
            .attr("dy", "-0.3em")
            .attr("fill", "white")
            .attr("font-size", (d) => (d.radius >= 44 ? "10px" : "8px"))
            .attr("font-family", "monospace")
            .attr("font-weight", "500")
            .attr("pointer-events", "none")
            .text((d) => truncateAddress(d.address));

          // Amount text
          group
            .append("text")
            .attr("class", "bubble-amount")
            .attr("text-anchor", "middle")
            .attr("dy", "1em")
            .attr("fill", (d) =>
              d.type === "buyer" ? BUYER_COLOR : SELLER_COLOR
            )
            .attr("font-size", (d) => (d.radius >= 44 ? "10px" : "8px"))
            .attr("font-weight", "bold")
            .attr("pointer-events", "none")
            .text((d) => `${d.amount} kWh`);

          // Animate in
          group.transition().duration(600).style("opacity", 1);

          return group;
        },
        (update) => {
          // Smooth transition for updated bubbles
          update
            .select(".bubble-glow")
            .transition()
            .duration(300)
            .attr("r", (d) => d.radius + 4);
          update
            .select(".bubble-main")
            .transition()
            .duration(300)
            .attr("r", (d) => d.radius);
          update
            .select(".bubble-amount")
            .text((d) => `${d.amount} kWh`);
          return update;
        },
        (exit) =>
          exit.transition().duration(300).style("opacity", 0).remove()
      );

    // Create trade line paths (rendered behind bubbles)
    let tradePaths: d3.Selection<SVGPathElement, TradeLink, SVGGElement, unknown> | null = null;
    let tradeWidthScale: d3.ScalePower<number, number> | null = null;

    if (tradeLinks.length > 0) {
      const maxAmount = Math.max(...tradeLinks.map(l => l.amount), 1);
      tradeWidthScale = d3.scaleSqrt().domain([0, maxAmount]).range([1.5, 6]);

      tradePaths = tradeLineGroup
        .selectAll<SVGPathElement, TradeLink>(".trade-line")
        .data(tradeLinks)
        .join("path")
        .attr("class", "trade-line")
        .attr("fill", "none")
        .attr("stroke", "url(#tradeLineGrad)")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", d => tradeWidthScale!(d.amount))
        .style("opacity", 0)
        .style("cursor", "pointer");

      // Staggered fade-in
      tradePaths
        .transition()
        .delay((_, i) => i * 100)
        .duration(500)
        .style("opacity", 0.4);

      // Trade line hover interactions
      const ws = tradeWidthScale;
      tradePaths
        .on("mouseenter", function (event: MouseEvent, d: TradeLink) {
          if (!mountedRef.current) return;
          const svgRect = svgRef.current?.getBoundingClientRect();
          if (!svgRect) return;

          // Thicken and brighten this line
          d3.select(this)
            .transition().duration(200)
            .attr("stroke-width", ws(d.amount) + 2)
            .style("opacity", 0.9);

          // Dim other lines
          tradeLineGroup.selectAll<SVGPathElement, TradeLink>(".trade-line")
            .filter(function (l) { return l !== d; })
            .transition().duration(200)
            .style("opacity", 0.1);

          // Highlight connected bubbles, dim others
          const sourceAddr = d.seller.toLowerCase();
          const targetAddr = d.buyer.toLowerCase();
          bubbleGroups
            .transition().duration(200)
            .style("opacity", (n: BubbleNode) =>
              n.address.toLowerCase() === sourceAddr || n.address.toLowerCase() === targetAddr ? 1 : 0.15
            );

          setTooltip(null);
          setTradeTooltip({
            x: event.clientX - svgRect.left,
            y: event.clientY - svgRect.top,
            link: d,
          });
        })
        .on("mousemove", function (event: MouseEvent, d: TradeLink) {
          if (!mountedRef.current) return;
          const svgRect = svgRef.current?.getBoundingClientRect();
          if (!svgRect) return;

          setTradeTooltip({
            x: event.clientX - svgRect.left,
            y: event.clientY - svgRect.top,
            link: d,
          });
        })
        .on("mouseleave", function () {
          if (!mountedRef.current) return;

          // Restore all trade lines
          tradeLineGroup.selectAll<SVGPathElement, TradeLink>(".trade-line")
            .transition().duration(200)
            .attr("stroke-width", (l: TradeLink) => ws(l.amount))
            .style("opacity", 0.4);

          // Restore all bubbles
          bubbleGroups
            .transition().duration(200)
            .style("opacity", 1);

          setTradeTooltip(null);
        });
    }

    // Mouse events for tooltip — guarded against unmounted state updates
    bubbleGroups
      .on("mouseenter", function (event: MouseEvent, d: BubbleNode) {
        if (!mountedRef.current) return;
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (!svgRect) return;

        d3.select(this)
          .select(".bubble-main")
          .transition()
          .duration(200)
          .attr("stroke-width", 2.5)
          .attr("stroke-opacity", 1);

        d3.select(this)
          .select(".bubble-glow")
          .transition()
          .duration(200)
          .attr("stroke-opacity", 0.5)
          .attr("stroke-width", 2);

        // Highlight connected trade lines and dim unconnected elements
        if (tradeLinks.length > 0) {
          const addr = d.address.toLowerCase();
          const connectedAddresses = new Set<string>([addr]);

          for (const link of tradeLinks) {
            if (link.seller.toLowerCase() === addr) connectedAddresses.add(link.buyer.toLowerCase());
            if (link.buyer.toLowerCase() === addr) connectedAddresses.add(link.seller.toLowerCase());
          }

          tradeLineGroup.selectAll<SVGPathElement, TradeLink>(".trade-line")
            .transition().duration(200)
            .style("opacity", (l) =>
              l.seller.toLowerCase() === addr || l.buyer.toLowerCase() === addr ? 0.7 : 0.1
            );

          bubbleGroups
            .transition().duration(200)
            .style("opacity", (n: BubbleNode) =>
              connectedAddresses.has(n.address.toLowerCase()) ? 1 : 0.15
            );
        }

        setTradeTooltip(null);
        setTooltip({
          x: event.clientX - svgRect.left,
          y: event.clientY - svgRect.top,
          node: d,
        });
      })
      .on("mousemove", function (event: MouseEvent, d: BubbleNode) {
        if (!mountedRef.current) return;
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (!svgRect) return;

        setTooltip({
          x: event.clientX - svgRect.left,
          y: event.clientY - svgRect.top,
          node: d,
        });
      })
      .on("mouseleave", function () {
        if (!mountedRef.current) return;

        d3.select(this)
          .select(".bubble-main")
          .transition()
          .duration(200)
          .attr("stroke-width", 1.5)
          .attr("stroke-opacity", 0.6);

        d3.select(this)
          .select(".bubble-glow")
          .transition()
          .duration(200)
          .attr("stroke-opacity", 0.2)
          .attr("stroke-width", 1);

        // Restore trade lines and bubbles
        if (tradeLinks.length > 0) {
          tradeLineGroup.selectAll(".trade-line")
            .transition().duration(200)
            .style("opacity", 0.4);

          bubbleGroups
            .transition().duration(200)
            .style("opacity", 1);
        }

        setTooltip(null);
      })
      .on("click", function (event: MouseEvent, d: BubbleNode) {
        if (!mountedRef.current) return;
        const svgRect = svgRef.current?.getBoundingClientRect();
        if (!svgRect) return;

        setTooltip((prev) =>
          prev?.node.id === d.id
            ? null
            : {
                x: event.clientX - svgRect.left,
                y: event.clientY - svgRect.top,
                node: d,
              }
        );
      });

    // Update positions on tick
    const linkGen = d3.linkHorizontal<{ source: [number, number]; target: [number, number] }, [number, number]>();

    simulation.on("tick", () => {
      bubbleGroups.attr("transform", (d) => {
        // Keep bubbles within bounds
        const x = Math.max(d.radius, Math.min(width - d.radius, d.x ?? 0));
        const y = Math.max(d.radius, Math.min(height - d.radius, d.y ?? 0));
        d.x = x;
        d.y = y;
        return `translate(${x},${y})`;
      });

      // Update trade line paths
      if (tradePaths) {
        tradePaths.attr("d", (d) => {
          const sx = d.source.x ?? 0;
          const sy = d.source.y ?? 0;
          const tx = d.target.x ?? 0;
          const ty = d.target.y ?? 0;
          return linkGen({ source: [sx, sy], target: [tx, ty] }) ?? "";
        });
      }
    });

    return () => {
      simulation.stop();
      simulationRef.current = null;
      // Remove all D3-created elements so React can cleanly reconcile on unmount
      if (svgRef.current) {
        d3.select(svgRef.current).select(".bubbles-group").selectAll("*").remove();
        d3.select(svgRef.current).select(".trade-lines-group").selectAll("*").remove();
      }
    };
  }, [nodes, dimensions, isMobile, tradeLinks]);

  // Summary statistics
  const buyerCount = data?.buyers.length ?? 0;
  const sellerCount = data?.sellers.length ?? 0;
  const totalEnergy = data?.totalAvailableEnergy ?? 0;
  const clearingPrice = data?.clearingPrice ?? 0;
  const isCleared = data?.isCleared ?? false;

  // Compute tooltip position with boundary clamping
  const tooltipStyle = useMemo(() => {
    if (!tooltip) return {};
    const { x, y } = tooltip;
    const containerW = dimensions.width;
    const containerH = dimensions.height;

    // Determine horizontal placement
    const flipLeft = x + TOOLTIP_WIDTH > containerW;
    // Determine vertical placement
    const flipDown = y - TOOLTIP_HEIGHT_ESTIMATE < 0;

    return {
      left: flipLeft ? Math.max(x - TOOLTIP_WIDTH, 0) : x,
      top: flipDown ? y + 16 : y - 10,
      transform: flipDown ? "translateY(0%)" : "translateY(-100%)",
    };
  }, [tooltip, dimensions]);

  // Trade tooltip position with boundary clamping
  const tradeTooltipStyle = useMemo(() => {
    if (!tradeTooltip) return {};
    const { x, y } = tradeTooltip;
    const containerW = dimensions.width;

    const flipLeft = x + TOOLTIP_WIDTH > containerW;
    const flipDown = y - TOOLTIP_HEIGHT_ESTIMATE < 0;

    return {
      left: flipLeft ? Math.max(x - TOOLTIP_WIDTH, 0) : x,
      top: flipDown ? y + 16 : y - 10,
      transform: flipDown ? "translateY(0%)" : "translateY(-100%)",
    };
  }, [tradeTooltip, dimensions]);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-blue-400" />
            <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
              Buyers
            </span>
          </div>
          <p className="text-lg font-bold text-blue-400">{buyerCount}</p>
        </div>

        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-emerald-400" />
            <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
              Sellers
            </span>
          </div>
          <p className="text-lg font-bold text-emerald-400">{sellerCount}</p>
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-amber-400" />
            <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
              Clearing Price
            </span>
          </div>
          <p className="text-lg font-bold text-amber-400">
            {isCleared ? `${clearingPrice.toFixed(6)} ETH/kWh` : "Pending"}
          </p>
          {isCleared && ethPrice ? (
            <p className="text-xs text-[var(--color-text-muted)]">
              ~{"\u20AC"}{(clearingPrice * ethPrice).toFixed(4)}
            </p>
          ) : null}
        </div>

        <div className="p-3 bg-white/5 border border-[var(--color-border)] rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-[var(--color-text-secondary)]" />
            <span className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide">
              Total Energy
            </span>
          </div>
          <p className="text-lg font-bold text-[var(--color-text-primary)]">{totalEnergy} kWh</p>
        </div>
      </div>

      {/* Bubble chart / mobile card fallback */}
      <div
        ref={containerRef}
        className="relative w-full bg-white/[0.02] border border-[var(--color-border)] rounded-xl overflow-hidden"
      >
        {isMobile ? (
          /* Mobile: card list instead of D3 bubbles */
          <div className="p-4">
            <MobileCardList
              data={data}
              ethPrice={ethPrice}
              isCleared={isCleared}
              clearingPrice={clearingPrice}
            />
          </div>
        ) : (
          <>
            {/* Side labels */}
            <div className="absolute top-3 left-4 z-10 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-emerald-400/80">
                Sellers
              </span>
            </div>
            <div className="absolute top-3 right-4 z-10 flex items-center gap-1.5">
              <span className="text-xs font-medium text-blue-400/80">Buyers</span>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            </div>

            <svg
              ref={svgRef}
              viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
              className="w-full"
              style={{ minHeight: "250px" }}
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Center divider */}
              <line
                x1={dimensions.width / 2}
                y1={20}
                x2={dimensions.width / 2}
                y2={dimensions.height - 20}
                stroke="white"
                strokeOpacity={0.06}
                strokeWidth={1}
                strokeDasharray="4 6"
              />

              {/* Clearing price line */}
              {isCleared && clearingPrice > 0 && (
                <g className="clearing-price-line">
                  <line
                    x1={20}
                    y1={dimensions.height * 0.2}
                    x2={dimensions.width - 20}
                    y2={dimensions.height * 0.2}
                    stroke={PRICE_COLOR}
                    strokeOpacity={0.4}
                    strokeWidth={1.5}
                    strokeDasharray="6 4"
                  />
                  <rect
                    x={dimensions.width - 180}
                    y={dimensions.height * 0.2 - 12}
                    width={160}
                    height={20}
                    rx={4}
                    fill="rgba(0,0,0,0.6)"
                  />
                  <text
                    x={dimensions.width - 100}
                    y={dimensions.height * 0.2 + 1}
                    textAnchor="middle"
                    fill={PRICE_COLOR}
                    fontSize="10"
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
              <rect
                x={0}
                y={0}
                width={dimensions.width / 2}
                height={dimensions.height}
                fill="url(#sellerGrad)"
              />
              <rect
                x={dimensions.width / 2}
                y={0}
                width={dimensions.width / 2}
                height={dimensions.height}
                fill="url(#buyerGrad)"
              />

              {/* Trade connection lines (behind bubbles) */}
              <g className="trade-lines-group" />
              {/* Bubbles container */}
              <g className="bubbles-group" />
            </svg>

            {/* Tooltip with boundary-aware positioning */}
            <AnimatePresence>
              {tooltip && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-20 pointer-events-none"
                  style={tooltipStyle}
                >
                  <div className="bg-[var(--color-bg-card)]/95 backdrop-blur-xl border border-white/15 rounded-xl p-3 shadow-2xl min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[var(--color-border)]">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          tooltip.node.type === "buyer"
                            ? "bg-blue-500"
                            : "bg-emerald-500"
                        }`}
                      />
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                        {tooltip.node.type === "buyer" ? "Buyer" : "Seller"}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div>
                        <span className="text-xs text-[var(--color-text-muted)]">Address</span>
                        <p className="text-xs text-[var(--color-text-primary)] font-mono">
                          {tooltip.node.address}
                        </p>
                      </div>

                      <div>
                        <span className="text-xs text-[var(--color-text-muted)]">Amount</span>
                        <p
                          className={`text-sm font-bold ${
                            tooltip.node.type === "buyer"
                              ? "text-blue-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {tooltip.node.amount} kWh
                        </p>
                      </div>

                      {tooltip.node.price !== undefined && (
                        <div>
                          <span className="text-xs text-[var(--color-text-muted)]">Bid Price</span>
                          <p className="text-sm font-bold text-amber-400">
                            {tooltip.node.price.toFixed(6)} ETH/kWh
                          </p>
                          {ethPrice && (
                            <p className="text-xs text-[var(--color-text-muted)]">
                              ~{"\u20AC"}{(tooltip.node.price * ethPrice).toFixed(4)}
                            </p>
                          )}
                        </div>
                      )}

                      {isCleared && clearingPrice > 0 && (
                        <div>
                          <span className="text-xs text-[var(--color-text-muted)]">
                            Clearing Price
                          </span>
                          <p className="text-sm font-bold text-amber-400">
                            {clearingPrice.toFixed(6)} ETH/kWh
                          </p>
                        </div>
                      )}

                      {isCleared && clearingPrice > 0 && (
                        <div className="pt-1.5 mt-1.5 border-t border-[var(--color-border)]">
                          <span className="text-xs text-[var(--color-text-muted)]">Total Value</span>
                          <p className="text-sm font-bold text-[var(--color-text-primary)]">
                            {(clearingPrice * tooltip.node.amount).toFixed(6)} ETH
                          </p>
                          {ethPrice && (
                            <p className="text-xs text-[var(--color-text-muted)]">
                              ~{"\u20AC"}
                              {(
                                clearingPrice *
                                tooltip.node.amount *
                                ethPrice
                              ).toFixed(2)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Trade line tooltip */}
            <AnimatePresence>
              {tradeTooltip && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute z-20 pointer-events-none"
                  style={tradeTooltipStyle}
                >
                  <div className="bg-[var(--color-bg-card)]/95 backdrop-blur-xl border border-violet-500/30 rounded-xl p-3 shadow-2xl min-w-[200px]">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-violet-500/20">
                      <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                      <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
                        Trade
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div>
                        <span className="text-xs text-[var(--color-text-muted)]">Seller</span>
                        <p className="text-xs text-emerald-400 font-mono">
                          {tradeTooltip.link.seller}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-[var(--color-text-muted)]">Buyer</span>
                        <p className="text-xs text-blue-400 font-mono">
                          {tradeTooltip.link.buyer}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-[var(--color-text-muted)]">Amount</span>
                        <p className="text-sm font-bold text-violet-400">
                          {tradeTooltip.link.amount.toFixed(2)} kWh
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default BubbleVisualization;
