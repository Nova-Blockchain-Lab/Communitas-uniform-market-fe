import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
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

const Slider: React.FC<SliderProps> = ({ selected, setSelected }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

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

  return (
    <nav
      className="relative hidden md:flex flex-1 justify-center overflow-hidden"
      aria-label="Main navigation"
    >
      <div
        ref={scrollRef}
        className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide"
        style={
          hasOverflow
            ? {
                maskImage:
                  "linear-gradient(to right, transparent, black 2rem, black calc(100% - 2rem), transparent)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, black 2rem, black calc(100% - 2rem), transparent)",
              }
            : undefined
        }
      >
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            isSelected={selected === tab.id}
            onClick={() => setSelected(tab.id)}
          />
        ))}
      </div>
    </nav>
  );
};

interface TabButtonProps {
  tab: TabItem;
  isSelected: boolean;
  onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ tab, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      title={tab.label}
      aria-label={tab.label}
      aria-current={isSelected ? "page" : undefined}
      className={`
        relative flex items-center gap-2 px-2.5 lg:px-3.5 py-2.5
        text-[13px] font-medium tracking-[0.02em]
        rounded-lg transition-all duration-200 shrink-0
        ${
          isSelected
            ? "text-white"
            : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]"
        }
      `}
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
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <span
        className={`relative z-10 transition-colors duration-200 ${
          isSelected ? "text-cyan-400" : ""
        }`}
      >
        {tab.icon}
      </span>
      <span className="relative z-10 hidden lg:inline">{tab.label}</span>
    </button>
  );
};

export default Slider;
