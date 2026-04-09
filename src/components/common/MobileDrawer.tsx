import React, { useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, type PanInfo } from "motion/react";
import { X, ArrowRight, Droplets, Zap, Wallet } from "lucide-react";
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
  { label: "Trading", tabIds: [1, 2] },
  { label: "Assets", tabIds: [3, 4, 5, 6] },
  { label: "Analytics", tabIds: [7] },
];

const tabMap = new Map<number, TabItem>(tabs.map((t) => [t.id, t]));

/** Velocity threshold for swipe-to-close (px/s) */
const SWIPE_CLOSE_VELOCITY = 300;
/** Distance threshold for swipe-to-close (px) */
const SWIPE_CLOSE_DISTANCE = 80;

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
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  // Focus trap + Escape key + restore focus on close
  useEffect(() => {
    if (!isOpen) return;

    // Store the element that had focus before the drawer opened
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    // Focus the close button when drawer opens
    requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      // Focus trap: cycle through focusable elements inside the drawer
      if (e.key === "Tab" && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus when drawer closes
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen, onClose]);

  const handleTabSelect = useCallback(
    (tabId: number) => {
      setSelected(tabId);
      onClose();
    },
    [setSelected, onClose]
  );

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Swipe-to-close: drag right to dismiss
  const handleDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (
        info.velocity.x > SWIPE_CLOSE_VELOCITY ||
        info.offset.x > SWIPE_CLOSE_DISTANCE
      ) {
        onClose();
      }
    },
    [onClose]
  );

  // Portal rendering — only render on client
  if (typeof window === "undefined") return null;

  const drawer = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay with fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Drawer panel — slides in from right */}
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 36 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.4 }}
            onDragEnd={handleDragEnd}
            className="fixed inset-y-0 right-0 z-[9999] flex w-full max-w-[320px] flex-col overflow-hidden"
            style={{
              background: "var(--color-bg-dark, #060609)",
              boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.5)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 shrink-0">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-cyan-400" />
                <span
                  className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Menu
                </span>
              </div>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="p-2.5 rounded-lg hover:bg-white/[0.06] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent"
                style={{ color: "var(--color-text-muted)" }}
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
                <div
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg"
                  style={{ background: "var(--color-bg-elevated)" }}
                >
                  <div className="p-1.5 rounded-md bg-blue-500/15">
                    <Wallet size={14} className="text-blue-400" />
                  </div>
                  <span
                    className="text-xs font-mono"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {truncateAddress(address)}
                  </span>
                </div>
              </div>
            )}

            {/* Navigation sections */}
            <nav className="flex-1 overflow-y-auto py-2 px-3 overscroll-contain">
              {sections.map((section) => (
                <div key={section.label} className="mb-4">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.12em] px-4 py-2"
                    style={{ color: "var(--color-text-muted)" }}
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
                        onClick={() => handleTabSelect(tab.id)}
                        aria-current={isActive ? "page" : undefined}
                        className={`
                          relative w-full flex items-center gap-3 px-4 py-3.5 mb-0.5 min-h-[48px]
                          text-sm font-medium rounded-lg
                          transition-all duration-200
                          active:scale-[0.98]
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50
                          ${
                            isActive
                              ? "text-white bg-white/[0.06]"
                              : "hover:bg-white/[0.03]"
                          }
                        `}
                        style={
                          !isActive
                            ? { color: "var(--color-text-secondary)" }
                            : undefined
                        }
                      >
                        {/* Active indicator bar */}
                        {isActive && (
                          <motion.div
                            layoutId="mobileActiveTab"
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                            style={{
                              background:
                                "linear-gradient(180deg, #3b82f6, #06b6d4)",
                              boxShadow: "0 0 6px rgba(6, 182, 212, 0.3)",
                            }}
                            transition={{
                              type: "spring",
                              stiffness: 400,
                              damping: 30,
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
            <div
              className="px-5 py-3 shrink-0"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              <p
                className="text-[11px] uppercase tracking-[0.08em] font-medium mb-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                Network
              </p>
              <w3m-network-button />
            </div>

            {/* Region selector */}
            <div
              className="px-5 py-3 shrink-0"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
              <p
                className="text-[11px] uppercase tracking-[0.08em] font-medium mb-2"
                style={{ color: "var(--color-text-muted)" }}
              >
                Region
              </p>
              <RegionDropdownList dropUp />
            </div>

            {/* Bridge & Faucet links */}
            <div
              className="px-5 py-4 shrink-0 space-y-2"
              style={{ borderTop: "1px solid var(--color-border)" }}
            >
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
                  active:scale-[0.98]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50
                  transition-all duration-200
                "
              >
                Bridge
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/faucet"
                onClick={onClose}
                className="
                  flex items-center justify-center gap-2 w-full
                  px-4 py-3 min-h-[48px]
                  text-cyan-400 text-sm font-medium
                  rounded-lg border border-cyan-500/20
                  bg-cyan-500/[0.08]
                  hover:bg-cyan-500/[0.15] hover:border-cyan-500/30
                  active:scale-[0.98]
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50
                  transition-all duration-200
                "
              >
                <Droplets size={14} />
                Faucet
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(drawer, document.body);
};

export default MobileDrawer;
