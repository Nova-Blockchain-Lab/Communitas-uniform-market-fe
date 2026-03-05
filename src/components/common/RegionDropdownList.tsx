import React, { useEffect, useState, useRef } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { useAccount } from "wagmi";
import { motion, AnimatePresence } from "motion/react";

import { contractAddresses } from "@/config";
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedRegion = regions
    ? Object.entries(regions).find(([, address]) => address === energyMarketAddress)?.[0]
    : null;

  const fetchCountryAndSetAddress = async () => {
    if (!chainId || !isConnected || !contractAddresses[chainId]?.["EnergyBiddingMarket"]) return;

    setLoading(true);
    try {
      const country = await fetchUserCountry();
      const markets = contractAddresses[chainId]["EnergyBiddingMarket"];

      if (country && markets[country]) {
        setEnergyMarketAddress(markets[country] as `0x${string}`);
      } else {
        setEnergyMarketAddress(Object.values(markets)[0] as `0x${string}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!chainId || !isConnected || !contractAddresses[chainId]?.["EnergyBiddingMarket"]) {
      setRegions(null);
      return;
    }
    setRegions(contractAddresses[chainId]["EnergyBiddingMarket"] as Record<string, string>);
    fetchCountryAndSetAddress();
  }, [isConnected, chainId]);

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
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-xl transition-colors"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--color-border)',
        }}
      >
        <MapPin size={16} className="text-blue-400" />
        {loading ? (
          <SkeletonLine width="5rem" height="1rem" />
        ) : (
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
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
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          style={{ color: 'var(--color-text-muted)' }}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: dropUp ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: dropUp ? 10 : -10 }}
            transition={{ duration: 0.15 }}
            className={`absolute right-0 w-48 max-h-56 overflow-y-auto z-50 ${dropUp ? "bottom-full mb-2" : "top-full mt-2"}`}
            style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border-hover)',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div className="p-1">
              {Object.entries(regions).map(([country, address]) => {
                const isActive = address === energyMarketAddress;
                return (
                  <button
                    key={country}
                    onClick={() => {
                      setEnergyMarketAddress(address as `0x${string}`);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left
                      transition-colors
                      ${isActive
                        ? "bg-blue-500/20 text-white"
                        : "hover:bg-white/5"
                      }
                    `}
                    style={!isActive ? { color: 'var(--color-text-secondary)' } : undefined}
                  >
                    <span className="text-lg">{regionFlags[country] || "\ud83c\udf0d"}</span>
                    <span className="text-sm font-medium">{country}</span>
                    {/* Status dot indicator */}
                    <span
                      className="ml-auto w-2 h-2 rounded-full shrink-0"
                      style={{
                        background: isActive ? '#22c55e' : 'var(--color-text-muted)',
                        boxShadow: isActive ? '0 0 6px rgba(34, 197, 94, 0.4)' : 'none',
                      }}
                    />
                    {isActive && (
                      <span className="text-blue-400 text-xs">&#10003;</span>
                    )}
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
