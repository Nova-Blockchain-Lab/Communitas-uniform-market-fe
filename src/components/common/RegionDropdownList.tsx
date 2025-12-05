import React, { useEffect, useState, useRef } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { useAccount } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";

import { contractAddresses } from "@/config";
import { useAppContext } from "@/context/AppContext";
import { fetchUserCountry } from "@/utils/fetchUserCountry";

const regionFlags: Record<string, string> = {
  Netherlands: "🇳🇱",
  Italy: "🇮🇹",
  Spain: "🇪🇸",
};

const RegionDropdownList: React.FC = () => {
  const { isConnected, chainId } = useAccount();
  const { setEnergyMarketAddress, energyMarketAddress } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [regions, setRegions] = useState<Record<string, string> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedRegion = regions
    ? Object.entries(regions).find(([, address]) => address === energyMarketAddress)?.[0]
    : null;

  const fetchCountryAndSetAddress = async () => {
    if (!chainId || !isConnected || !contractAddresses[chainId]?.["EnergyBiddingMarket"]) return;

    const country = await fetchUserCountry();
    const markets = contractAddresses[chainId]["EnergyBiddingMarket"];

    if (country && markets[country]) {
      setEnergyMarketAddress(markets[country] as `0x${string}`);
    } else {
      setEnergyMarketAddress(Object.values(markets)[0] as `0x${string}`);
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

  if (!regions) return null;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
      >
        <MapPin size={16} className="text-blue-400" />
        <span className="text-sm font-medium text-white">
          {selectedRegion ? (
            <>
              {regionFlags[selectedRegion] || ""} {selectedRegion}
            </>
          ) : (
            "Select Region"
          )}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
          >
            <div className="p-1">
              {Object.entries(regions).map(([country, address]) => (
                <button
                  key={country}
                  onClick={() => {
                    setEnergyMarketAddress(address as `0x${string}`);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left
                    transition-colors
                    ${address === energyMarketAddress
                      ? "bg-blue-500/20 text-white"
                      : "text-gray-300 hover:bg-white/5"
                    }
                  `}
                >
                  <span className="text-lg">{regionFlags[country] || "🌍"}</span>
                  <span className="text-sm font-medium">{country}</span>
                  {address === energyMarketAddress && (
                    <span className="ml-auto text-blue-400">✓</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RegionDropdownList;
