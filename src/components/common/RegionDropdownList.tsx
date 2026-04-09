import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { MapPin, ChevronDown, Check } from "lucide-react";
import { useAccount } from "wagmi";
import { motion, AnimatePresence } from "motion/react";

import { contractAddresses, defaultChain } from "@/config";
import { useAppContext } from "@/context/AppContext";
import { fetchUserCountry } from "@/utils/fetchUserCountry";
import { SkeletonLine } from "@/components/ui";

const regionFlags: Record<string, string> = {
  Denmark: "\ud83c\udde9\ud83c\uddf0",
  Italy: "\ud83c\uddee\ud83c\uddf9",
  Spain: "\ud83c\uddea\ud83c\uddf8",
  Portugal: "\ud83c\uddf5\ud83c\uddf9",
};

interface RegionDropdownListProps {
  dropUp?: boolean;
}

const RegionDropdownList: React.FC<RegionDropdownListProps> = ({ dropUp = false }) => {
  const { isConnected, chainId } = useAccount();
  const { setEnergyMarketAddress, energyMarketAddress } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [regions, setRegions] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Use wallet chain when connected, otherwise fall back to default chain
  const effectiveChainId = (isConnected && chainId) ? chainId : defaultChain.id;

  const selectedRegion = useMemo(() => {
    if (!regions) return null;
    return Object.entries(regions).find(([, address]) => address === energyMarketAddress)?.[0] ?? null;
  }, [regions, energyMarketAddress]);

  const regionEntries = useMemo(() => {
    return regions ? Object.entries(regions) : [];
  }, [regions]);

  const fetchCountryAndSetAddress = useCallback(async () => {
    if (!contractAddresses[effectiveChainId]?.["EnergyBiddingMarket"]) return;

    setLoading(true);
    try {
      const country = await fetchUserCountry();
      const markets = contractAddresses[effectiveChainId]["EnergyBiddingMarket"];

      if (country && markets[country]) {
        setEnergyMarketAddress(markets[country] as `0x${string}`);
      } else {
        setEnergyMarketAddress(Object.values(markets)[0] as `0x${string}`);
      }
    } finally {
      setLoading(false);
    }
  }, [effectiveChainId, setEnergyMarketAddress]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev) setFocusedIndex(-1);
      return !prev;
    });
  }, []);

  const handleSelect = useCallback(
    (address: string) => {
      setEnergyMarketAddress(address as `0x${string}`);
      setIsOpen(false);
      triggerRef.current?.focus();
    },
    [setEnergyMarketAddress],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsOpen(true);
          setFocusedIndex(0);
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % regionEntries.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + regionEntries.length) % regionEntries.length);
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < regionEntries.length) {
            handleSelect(regionEntries[focusedIndex][1]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        case "Home":
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case "End":
          e.preventDefault();
          setFocusedIndex(regionEntries.length - 1);
          break;
        case "Tab":
          setIsOpen(false);
          break;
      }
    },
    [isOpen, focusedIndex, regionEntries, handleSelect],
  );

  // Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && menuRef.current) {
      const items = menuRef.current.querySelectorAll("[role='option']");
      items[focusedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex]);

  useEffect(() => {
    if (!contractAddresses[effectiveChainId]?.["EnergyBiddingMarket"]) {
      setRegions(null);
      return;
    }
    setRegions(contractAddresses[effectiveChainId]["EnergyBiddingMarket"] as Record<string, string>);
    fetchCountryAndSetAddress();
  }, [effectiveChainId, fetchCountryAndSetAddress]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!regions) {
    if (loading) {
      return (
        <div className="flex items-center gap-2 px-3 py-2">
          <SkeletonLine width="7rem" height="1.25rem" />
        </div>
      );
    }
    return null;
  }

  return (
    <div ref={dropdownRef} className="relative w-full sm:w-auto" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select region, current: ${selectedRegion ?? "none"}`}
        className="flex items-center gap-2 px-3 py-2.5 w-full sm:w-auto hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
        style={{
          background: isOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
          border: '1px solid var(--color-border)',
        }}
      >
        <MapPin size={16} className="text-blue-400 shrink-0" />
        {loading ? (
          <SkeletonLine width="5rem" height="1rem" />
        ) : (
          <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
            {selectedRegion ? (
              <>
                {regionFlags[selectedRegion] || ""} {selectedRegion}
              </>
            ) : (
              "Select Region"
            )}
          </span>
        )}
        <ChevronDown
          size={16}
          className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          style={{ color: 'var(--color-text-muted)' }}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            role="listbox"
            aria-label="Select a region"
            aria-activedescendant={focusedIndex >= 0 ? `region-option-${focusedIndex}` : undefined}
            initial={{ opacity: 0, y: dropUp ? 6 : -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropUp ? 6 : -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute z-50 w-full sm:w-52 sm:right-0 max-h-64 overflow-y-auto ${dropUp ? "bottom-full mb-2" : "top-full mt-2"}`}
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-hover)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div className="p-1.5">
              {regionEntries.map(([country, address], index) => {
                const isActive = address === energyMarketAddress;
                const isFocused = index === focusedIndex;
                return (
                  <button
                    key={country}
                    id={`region-option-${index}`}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleSelect(address)}
                    className={`
                      w-full flex items-center gap-2.5 px-3 rounded-lg text-left
                      transition-colors cursor-pointer outline-none
                      ${isActive
                        ? "bg-blue-500/20 text-white"
                        : isFocused
                          ? "bg-white/10"
                          : "hover:bg-white/5"
                      }
                    `}
                    style={{
                      minHeight: '44px',
                      ...(!isActive && !isFocused ? { color: 'var(--color-text-secondary)' } : {}),
                      ...(isFocused && !isActive ? { color: 'var(--color-text-primary)' } : {}),
                    }}
                  >
                    <span className="text-lg shrink-0">{regionFlags[country] || "\ud83c\udf0d"}</span>
                    <span className="text-sm font-medium truncate">{country}</span>
                    <span className="ml-auto flex items-center gap-1.5 shrink-0">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: isActive ? '#22c55e' : 'var(--color-text-muted)',
                          boxShadow: isActive ? '0 0 6px rgba(34, 197, 94, 0.4)' : 'none',
                          opacity: isActive ? 1 : 0.4,
                        }}
                      />
                      {isActive && (
                        <Check size={14} className="text-blue-400" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RegionDropdownList;
