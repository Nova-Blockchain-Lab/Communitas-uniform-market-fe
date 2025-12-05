import React from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  TrendingUp,
  ClipboardList,
  Wallet,
  Image as ImageIcon,
} from "lucide-react";

interface TabItem {
  id: number;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabItem[] = [
  { id: 1, label: "Buy", icon: <ShoppingCart size={18} /> },
  { id: 2, label: "Sell", icon: <TrendingUp size={18} /> },
  { id: 3, label: "Orders", icon: <ClipboardList size={18} /> },
  { id: 4, label: "Claim", icon: <Wallet size={18} /> },
  { id: 5, label: "NFTs", icon: <ImageIcon size={18} /> },
];

interface SliderProps {
  selected: number;
  setSelected: (id: number) => void;
}

const Slider: React.FC<SliderProps> = ({ selected, setSelected }) => {
  return (
    <nav className="relative">
      <div className="flex items-center p-1.5 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10">
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
      className={`
        relative flex items-center gap-2 px-5 py-2.5
        text-sm font-medium rounded-xl
        transition-colors duration-200
        ${isSelected ? "text-white" : "text-gray-400 hover:text-gray-200"}
      `}
    >
      {isSelected && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl"
          style={{ boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)" }}
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">
        {tab.icon}
        <span className="hidden sm:inline">{tab.label}</span>
      </span>
    </button>
  );
};

export default Slider;
