import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
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
const springTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};

const Slider: React.FC<SliderProps> = ({ selected, setSelected }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const [hasOverflow, setHasOverflow] = useState(false);

  /* ---------- overflow detection (drives edge-fade masks) ---------- */
  const checkOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      setHasOverflow(el.scrollWidth > el.clientWidth);
    }
  }, []);

  useEffect(() => {
    checkOverflow();
    window.addEventListener("resize", checkOverflow);
    return () => window.removeEventListener("resize", checkOverflow);
  }, [checkOverflow]);

  /* ---------- auto-scroll selected tab into view ---------- */
  useEffect(() => {
    const btn = tabRefs.current.get(selected);
    if (btn) {
      btn.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [selected]);

  /* ---------- keyboard navigation (arrow keys) ---------- */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIdx = tabs.findIndex((t) => t.id === selected);
      let nextIdx = currentIdx;

      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIdx = (currentIdx + 1) % tabs.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIdx = (currentIdx - 1 + tabs.length) % tabs.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIdx = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIdx = tabs.length - 1;
      }

      if (nextIdx !== currentIdx) {
        const nextTab = tabs[nextIdx];
        setSelected(nextTab.id);
        tabRefs.current.get(nextTab.id)?.focus();
      }
    },
    [selected, setSelected],
  );

  /* ---------- memoised click handler ---------- */
  const handleClick = useCallback(
    (id: number) => {
      setSelected(id);
    },
    [setSelected],
  );

  /* ---------- ref callback for individual tab buttons ---------- */
  const setTabRef = useCallback(
    (id: number) => (node: HTMLButtonElement | null) => {
      if (node) {
        tabRefs.current.set(id, node);
      } else {
        tabRefs.current.delete(id);
      }
    },
    [],
  );

  return (
    <nav
      className={[
        "relative flex flex-1 justify-center overflow-hidden",
        // Mobile: take full width, allow edge-to-edge scroll
        "max-md:flex-none max-md:w-full max-md:order-last",
      ].join(" ")}
      aria-label="Main navigation"
      role="tablist"
    >
      <div
        ref={scrollRef}
        onKeyDown={handleKeyDown}
        className={[
          "flex items-center gap-0.5",
          // Horizontal scroll
          "overflow-x-auto",
          // CSS scroll-snap for touch
          "snap-x snap-mandatory",
          // Hide scrollbar cross-browser
          "scrollbar-none",
          // Mobile: full width with horizontal padding
          "max-md:w-full max-md:px-2",
          // Desktop: no extra padding
          "md:px-0",
        ].join(" ")}
        style={
          hasOverflow
            ? {
                maskImage:
                  "linear-gradient(to right, transparent, black 1.5rem, black calc(100% - 1.5rem), transparent)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, black 1.5rem, black calc(100% - 1.5rem), transparent)",
              }
            : undefined
        }
      >
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            ref={setTabRef(tab.id)}
            tab={tab}
            isSelected={selected === tab.id}
            onClick={handleClick}
          />
        ))}
      </div>
    </nav>
  );
};

/* ================================================================
   TabButton -- memoised so only the active / previously-active
   tabs re-render when selection changes.
   ================================================================ */

interface TabButtonProps {
  tab: TabItem;
  isSelected: boolean;
  onClick: (id: number) => void;
}

const TabButton = React.memo(
  React.forwardRef<HTMLButtonElement, TabButtonProps>(
    ({ tab, isSelected, onClick }, ref) => {
      const handleClick = useCallback(() => {
        onClick(tab.id);
      }, [onClick, tab.id]);

      return (
        <button
          ref={ref}
          onClick={handleClick}
          role="tab"
          tabIndex={isSelected ? 0 : -1}
          aria-selected={isSelected}
          aria-label={tab.label}
          title={tab.label}
          className={[
            // Layout
            "relative flex items-center justify-center gap-1.5 sm:gap-2 shrink-0 snap-start",
            // Touch-friendly sizing: 44px min height, comfortable tap target
            "min-h-[44px] min-w-[44px]",
            "px-2.5 sm:px-3 md:px-3.5 lg:px-4 py-2.5",
            // Text
            "text-[13px] font-medium tracking-[0.02em]",
            // Shape + transition
            "rounded-lg transition-all duration-200",
            // Colour states
            isSelected
              ? "text-white"
              : [
                  "text-gray-500",
                  "hover:text-gray-300 hover:bg-white/[0.04]",
                  "active:scale-[0.97] active:bg-white/[0.06]",
                ].join(" "),
            // Focus ring (keyboard-only)
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
            "outline-none",
          ].join(" ")}
        >
          {/* Animated active indicator (shared layoutId) */}
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

          {/* Icon */}
          <span
            className={[
              "relative z-10 transition-colors duration-200",
              isSelected ? "text-cyan-400" : "",
            ].join(" ")}
          >
            {tab.icon}
          </span>

          {/* Label: hidden on very small screens (icon-only), visible sm+ */}
          <span className="relative z-10 hidden sm:inline">{tab.label}</span>
        </button>
      );
    },
  ),
);

TabButton.displayName = "TabButton";

export default Slider;
