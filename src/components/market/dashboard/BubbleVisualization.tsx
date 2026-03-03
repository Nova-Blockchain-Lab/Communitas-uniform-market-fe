import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import * as d3 from "d3";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Zap, TrendingUp, Activity } from "lucide-react";
import type { HourData, Participant } from "@/hooks/useDashboardData";
import { truncateAddress } from "@/utils/dateHelpers";

interface BubbleVisualizationProps {
  data: HourData | undefined;
  ethPrice?: number;
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
const MIN_RADIUS = 20;
const MAX_RADIUS = 48;

const BubbleVisualization: React.FC<BubbleVisualizationProps> = ({
  data,
  ethPrice,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<BubbleNode, undefined> | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      if (!mountedRef.current) return;
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
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

  // D3 force simulation
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) {
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

    const g = svg.select<SVGGElement>(".bubbles-group");

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
            .attr("r", (d) => d.radius + 4)
            .attr("fill", "none")
            .attr("stroke", (d) =>
              d.type === "buyer" ? BUYER_COLOR : SELLER_COLOR
            )
            .attr("stroke-width", 1)
            .attr("stroke-opacity", 0.2);

          // Main circle
          group
            .append("circle")
            .attr("class", "bubble-main")
            .attr("r", (d) => d.radius)
            .attr("fill", (d) =>
              d.type === "buyer" ? BUYER_COLOR_LIGHT : SELLER_COLOR_LIGHT
            )
            .attr("stroke", (d) =>
              d.type === "buyer" ? BUYER_COLOR : SELLER_COLOR
            )
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", 0.6);

          // Address text
          group
            .append("text")
            .attr("class", "bubble-address")
            .attr("text-anchor", "middle")
            .attr("dy", "-0.3em")
            .attr("fill", "white")
            .attr("font-size", (d) => (d.radius > 30 ? "10px" : "8px"))
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
            .attr("font-size", (d) => (d.radius > 30 ? "10px" : "8px"))
            .attr("font-weight", "bold")
            .attr("pointer-events", "none")
            .text((d) => `${d.amount} kWh`);

          // Animate in
          group.transition().duration(600).style("opacity", 1);

          return group;
        },
        (update) => update,
        (exit) =>
          exit.transition().duration(300).style("opacity", 0).remove()
      );

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
    simulation.on("tick", () => {
      bubbleGroups.attr("transform", (d) => {
        // Keep bubbles within bounds
        const x = Math.max(d.radius, Math.min(width - d.radius, d.x ?? 0));
        const y = Math.max(d.radius, Math.min(height - d.radius, d.y ?? 0));
        d.x = x;
        d.y = y;
        return `translate(${x},${y})`;
      });
    });

    return () => {
      simulation.stop();
      simulationRef.current = null;
      // Remove all D3-created elements so React can cleanly reconcile on unmount
      if (svgRef.current) {
        d3.select(svgRef.current).select(".bubbles-group").selectAll("*").remove();
      }
    };
  }, [nodes, dimensions]);

  // Summary statistics
  const buyerCount = data?.buyers.length ?? 0;
  const sellerCount = data?.sellers.length ?? 0;
  const totalEnergy = data?.totalAvailableEnergy ?? 0;
  const clearingPrice = data?.clearingPrice ?? 0;
  const isCleared = data?.isCleared ?? false;

  // Empty state
  if (!data || (buyerCount === 0 && sellerCount === 0)) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Activity size={28} className="text-gray-500/50" />
        </div>
        <p className="text-sm text-gray-500 font-medium">
          No market activity for this hour
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Participants will appear when bids and asks are placed
        </p>
      </motion.div>
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
            <span className="text-xs text-gray-500 uppercase tracking-wide">
              Buyers
            </span>
          </div>
          <p className="text-lg font-bold text-blue-400">{buyerCount}</p>
        </div>

        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Users size={14} className="text-emerald-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">
              Sellers
            </span>
          </div>
          <p className="text-lg font-bold text-emerald-400">{sellerCount}</p>
        </div>

        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-amber-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">
              Clearing Price
            </span>
          </div>
          <p className="text-lg font-bold text-amber-400">
            {isCleared ? `${clearingPrice.toFixed(6)} ETH/kWh` : "Pending"}
          </p>
          {isCleared && ethPrice ? (
            <p className="text-xs text-gray-500">
              ~{"\u20AC"}{(clearingPrice * ethPrice).toFixed(4)}
            </p>
          ) : null}
        </div>

        <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Zap size={14} className="text-gray-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">
              Total Energy
            </span>
          </div>
          <p className="text-lg font-bold text-white">{totalEnergy} kWh</p>
        </div>
      </div>

      {/* Bubble chart */}
      <div
        ref={containerRef}
        className="relative w-full bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden"
      >
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

          {/* Bubbles container */}
          <g className="bubbles-group" />
        </svg>

        {/* Tooltip */}
        <AnimatePresence>
          {tooltip && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute z-20 pointer-events-none"
              style={{
                left: tooltip.x,
                top: tooltip.y - 10,
                transform: `translate(${
                  tooltip.x > dimensions.width * 0.6 ? "-100%" : "0%"
                }, -100%)`,
              }}
            >
              <div className="bg-gray-900/95 backdrop-blur-xl border border-white/15 rounded-xl p-3 shadow-2xl min-w-[200px]">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      tooltip.node.type === "buyer"
                        ? "bg-blue-500"
                        : "bg-emerald-500"
                    }`}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {tooltip.node.type === "buyer" ? "Buyer" : "Seller"}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div>
                    <span className="text-xs text-gray-500">Address</span>
                    <p className="text-xs text-white font-mono">
                      {tooltip.node.address}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs text-gray-500">Amount</span>
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
                      <span className="text-xs text-gray-500">Bid Price</span>
                      <p className="text-sm font-bold text-amber-400">
                        {tooltip.node.price.toFixed(6)} ETH/kWh
                      </p>
                      {ethPrice && (
                        <p className="text-xs text-gray-500">
                          ~{"\u20AC"}{(tooltip.node.price * ethPrice).toFixed(4)}
                        </p>
                      )}
                    </div>
                  )}

                  {isCleared && clearingPrice > 0 && (
                    <div>
                      <span className="text-xs text-gray-500">
                        Clearing Price
                      </span>
                      <p className="text-sm font-bold text-amber-400">
                        {clearingPrice.toFixed(6)} ETH/kWh
                      </p>
                    </div>
                  )}

                  {isCleared && clearingPrice > 0 && (
                    <div className="pt-1.5 mt-1.5 border-t border-white/10">
                      <span className="text-xs text-gray-500">Total Value</span>
                      <p className="text-sm font-bold text-white">
                        {(clearingPrice * tooltip.node.amount).toFixed(6)} ETH
                      </p>
                      {ethPrice && (
                        <p className="text-xs text-gray-500">
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
      </div>
    </motion.div>
  );
};

export default BubbleVisualization;
