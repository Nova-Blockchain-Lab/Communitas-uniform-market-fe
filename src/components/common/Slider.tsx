import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, type Transition } from "motion/react";
import {
  ShoppingCart,
  TrendingUp,
  ClipboardList,
  ArrowLeftRight,
  Wallet,
  Image as ImageIcon,
  BarChart3,
} from "lucide-react";

export interface TabItem {
  id: number;
  label: string;
  icon: React.ReactNode;
}

export const tabs: TabItem[] = [
  { id: 1, label: "Buy", icon: <ShoppingCart size={18} /> },
  { id: 2, label: "Sell", icon: <TrendingUp size={18} /> },
  { id: 3, label: "Orders", icon: <ClipboardList size={18} /> },
  { id: 4, label: "Trades", icon: <ArrowLeftRight size={18} /> },
  { id: 5, label: "Claim", icon: <Wallet size={18} /> },
  { id: 6, label: "NFTs", icon: <ImageIcon size={18} /> },
  { id: 7, label: "Dashboard", icon: <BarChart3 size={18} /> },
];

interface SliderProps {
  selected: number;
  setSelected: (id: number) => void;
}

/** Spring transition for the active-tab indicator */
const springTransition: Transition = { type: "spring", stiffness: 400, damping: 30 };

const EDGE_FADE =
  "linear-gradient(to right, transparent, black 1.5rem, black calc(100% - 1.5rem), transparent)";

const Slider: React.FC<SliderProps> = ({ selected, setSelected }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  /* Fade the edges only when the tabs overflow (narrow screens) */
  const checkOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (el) setHasOverflow(el.scrollWidth > el.clientWidth);
  }, []);

  useEffect(() => {
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [checkOverflow]);

  /* Keep the selected tab in view */
  useEffect(() => {
    scrollRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [selected]);

  /* Arrow keys, Home and End move between tabs */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const current = tabs.findIndex((t) => t.id === selected);
    const next =
      e.key === "ArrowRight" || e.key === "ArrowDown" ? (current + 1) % tabs.length
      : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (current - 1 + tabs.length) % tabs.length
      : e.key === "Home" ? 0
      : e.key === "End" ? tabs.length - 1
      : current;
    if (next === current) return;
    e.preventDefault();
    setSelected(tabs[next].id);
    scrollRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };

  return (
    <nav
      className="relative flex flex-1 justify-center overflow-hidden max-md:flex-none max-md:w-full max-md:order-last"
      aria-label="Main navigation"
      role="tablist"
    >
      <div
        ref={scrollRef}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-0.5 overflow-x-auto snap-x snap-mandatory scrollbar-none max-md:w-full max-md:px-2 md:px-0"
        style={hasOverflow ? { maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE } : undefined}
      >
        {tabs.map((tab) => {
          const isSelected = selected === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelected(tab.id)}
              role="tab"
              tabIndex={isSelected ? 0 : -1}
              aria-selected={isSelected}
              aria-label={tab.label}
              title={tab.label}
              className={[
                "relative flex items-center justify-center gap-1.5 sm:gap-2 shrink-0 snap-start",
                "min-h-[44px] min-w-[44px] px-2.5 sm:px-3 md:px-3.5 lg:px-4 py-2.5",
                "text-[13px] font-medium tracking-[0.02em] rounded-lg transition-all duration-200",
                isSelected
                  ? "text-white"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.04] active:scale-[0.97] active:bg-white/[0.06]",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 outline-none",
              ].join(" ")}
            >
              {isSelected && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-lg"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(59, 130, 246, 0.12) 0%, rgba(6, 182, 212, 0.05) 100%)",
                    boxShadow:
                      "inset 0 -2px 0 rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 0 12px rgba(59, 130, 246, 0.06)",
                  }}
                  transition={springTransition}
                />
              )}
              <span className={`relative z-10 transition-colors duration-200 ${isSelected ? "text-cyan-400" : ""}`}>
                {tab.icon}
              </span>
              {/* Label hidden on very small screens (icon only) */}
              <span className="relative z-10 hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Slider;
