import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ArrowRight, Zap, Wallet } from "lucide-react";
import Link from "next/link";
import { useAccount } from "wagmi";

import { tabs, type TabItem } from "./Slider";
import RegionDropdownList from "./RegionDropdownList";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selected: number;
  setSelected: (id: number) => void;
}

/** Group tabs into logical sections */
const sections: { label: string; tabIds: number[] }[] = [
  { label: "Trading", tabIds: [1, 2] },        // Buy, Sell
  { label: "Assets", tabIds: [3, 4, 5, 6] },   // Orders, Trades, Claim, NFTs
  { label: "Analytics", tabIds: [7] },           // Dashboard
];

const tabMap = new Map<number, TabItem>(tabs.map((t) => [t.id, t]));

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  selected,
  setSelected,
}) => {
  const { address, isConnected } = useAccount();

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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex flex-col overflow-hidden"
          style={{
            background: "var(--color-bg-dark, #060609)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 shrink-0">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-cyan-400" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--color-text-secondary)' }}>
                Menu
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-lg hover:bg-white/[0.06] transition-all duration-200"
              style={{ color: 'var(--color-text-muted)' }}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Accent divider */}
          <div className="mx-5 h-px bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-transparent shrink-0" />

          {/* Wallet address display */}
          {isConnected && address && (
            <div className="px-5 py-3 shrink-0">
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg" style={{ background: 'var(--color-bg-elevated)' }}>
                <div className="p-1.5 rounded-md bg-blue-500/15">
                  <Wallet size={14} className="text-blue-400" />
                </div>
                <span className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                  {truncateAddress(address)}
                </span>
              </div>
            </div>
          )}

          {/* Navigation sections */}
          <nav className="flex-1 overflow-y-auto py-2 px-3">
            {sections.map((section) => (
              <div key={section.label} className="mb-4">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.12em] px-4 py-2"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {section.label}
                </p>
                {section.tabIds.map((tabId) => {
                  const tab = tabMap.get(tabId);
                  if (!tab) return null;
                  const isActive = selected === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setSelected(tab.id);
                        onClose();
                      }}
                      className={`
                        relative w-full flex items-center gap-3 px-4 py-3.5 mb-0.5 min-h-[48px]
                        text-sm font-medium rounded-lg
                        transition-all duration-200
                        ${
                          isActive
                            ? "text-white bg-white/[0.06]"
                            : "hover:bg-white/[0.03]"
                        }
                      `}
                      style={!isActive ? { color: 'var(--color-text-secondary)' } : undefined}
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
              </div>
            ))}
          </nav>

          {/* Network button (mobile only) */}
          <div className="px-5 py-3 shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
            <p className="text-[11px] uppercase tracking-[0.08em] font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Network
            </p>
            <w3m-network-button />
          </div>

          {/* Region selector */}
          <div className="px-5 py-3 shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
            <p className="text-[11px] uppercase tracking-[0.08em] font-medium mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Region
            </p>
            <RegionDropdownList dropUp />
          </div>

          {/* Bridge link */}
          <div className="px-5 py-4 shrink-0" style={{ borderTop: '1px solid var(--color-border)' }}>
            <Link
              href="/bridge"
              onClick={onClose}
              className="
                flex items-center justify-center gap-2 w-full
                px-4 py-3 min-h-[48px]
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
      )}
    </AnimatePresence>
  );
};

export default MobileDrawer;
