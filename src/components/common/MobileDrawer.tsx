import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

import { tabs } from "./Slider";
import RegionDropdownList from "./RegionDropdownList";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selected: number;
  setSelected: (id: number) => void;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  selected,
  setSelected,
}) => {
  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[280px] flex flex-col overflow-hidden"
            style={{
              background:
                "linear-gradient(180deg, rgba(12, 12, 20, 0.98) 0%, rgba(8, 8, 14, 0.99) 100%)",
              borderLeft: "1px solid rgba(255, 255, 255, 0.06)",
              boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.5)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-cyan-400" />
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-[0.1em]">
                  Menu
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Accent divider */}
            <div className="mx-5 h-px bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-transparent" />

            {/* Navigation items */}
            <nav className="flex-1 overflow-y-auto py-3 px-3">
              {tabs.map((tab) => {
                const isActive = selected === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSelected(tab.id);
                      onClose();
                    }}
                    className={`
                      relative w-full flex items-center gap-3 px-4 py-3 mb-0.5 min-h-[44px]
                      text-sm font-medium rounded-lg
                      transition-all duration-200
                      ${
                        isActive
                          ? "text-white bg-white/[0.06]"
                          : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
                      }
                    `}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                        style={{
                          background:
                            "linear-gradient(180deg, #3b82f6, #06b6d4)",
                          boxShadow: "0 0 6px rgba(6, 182, 212, 0.3)",
                        }}
                      />
                    )}
                    <span
                      className={`transition-colors duration-200 ${
                        isActive ? "text-cyan-400" : ""
                      }`}
                    >
                      {tab.icon}
                    </span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Network button (mobile only) */}
            <div className="px-5 py-3 border-t border-white/[0.06]">
              <p className="text-[11px] text-gray-600 uppercase tracking-[0.08em] font-medium mb-2">
                Network
              </p>
              <w3m-network-button />
            </div>

            {/* Region selector */}
            <div className="px-5 py-3 border-t border-white/[0.06]">
              <p className="text-[11px] text-gray-600 uppercase tracking-[0.08em] font-medium mb-2">
                Region
              </p>
              <RegionDropdownList />
            </div>

            {/* Bridge link */}
            <div className="px-5 py-4 border-t border-white/[0.06]">
              <Link
                href="/bridge"
                onClick={onClose}
                className="
                  flex items-center justify-center gap-2 w-full
                  px-4 py-2.5
                  text-emerald-400 text-sm font-medium
                  rounded-lg border border-emerald-500/20
                  bg-emerald-500/[0.08]
                  hover:bg-emerald-500/[0.15] hover:border-emerald-500/30
                  transition-all duration-200
                "
              >
                Bridge
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileDrawer;
