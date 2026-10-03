import React, { useEffect } from "react";
import { MapPin, ChevronDown } from "lucide-react";
import { useAccount } from "wagmi";

import { contractAddresses } from "@/config/constants";
import { defaultChain } from "@/config/chains";
import { useAppContext } from "@/context/AppContext";
import { fetchUserCountry } from "@/utils/fetchUserCountry";

const REGION_FLAGS: Record<string, string> = {
  Denmark: "🇩🇰",
  Italy: "🇮🇹",
  Spain: "🇪🇸",
  Portugal: "🇵🇹",
};

/** Region picker: selects which EnergyBiddingMarket contract the market tabs use. */
const RegionDropdownList: React.FC = () => {
  const { isConnected, chainId } = useAccount();
  const { energyMarketAddress, setEnergyMarketAddress } = useAppContext();
  const markets = contractAddresses[isConnected && chainId ? chainId : defaultChain.id]?.EnergyBiddingMarket;

  // Default to the visitor's country (else the first region) once; keep the user's pick after that.
  useEffect(() => {
    if (!markets || (energyMarketAddress && Object.values(markets).includes(energyMarketAddress))) return;
    let cancelled = false;
    fetchUserCountry().then((country) => {
      if (!cancelled) setEnergyMarketAddress((country && markets[country]) || Object.values(markets)[0]);
    });
    return () => {
      cancelled = true;
    };
  }, [markets, energyMarketAddress, setEnergyMarketAddress]);

  if (!markets) return null;
  const selected = Object.keys(markets).find((country) => markets[country] === energyMarketAddress);

  // A transparent native <select> over the styled label: native keyboard, screen reader and
  // mobile picker behaviour, while the pill keeps its look.
  return (
    <label className="relative flex items-center gap-2 px-3 py-2.5 w-full sm:w-auto rounded-xl bg-white/5 hover:bg-white/10 border border-[var(--color-border)] transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-[var(--color-primary-500)]">
      <MapPin size={16} className="text-blue-400 shrink-0" />
      <span className="text-sm font-medium truncate text-[var(--color-text-primary)]">
        {selected ? `${REGION_FLAGS[selected] ?? "\ud83c\udf0d"} ${selected}` : "Select Region"}
      </span>
      <ChevronDown size={16} className="shrink-0 text-[var(--color-text-muted)]" />
      <select
        value={energyMarketAddress ?? ""}
        onChange={(e) => setEnergyMarketAddress(e.target.value as `0x${string}`)}
        aria-label="Region"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      >
        {!energyMarketAddress && (
          <option value="" disabled>
            Select Region
          </option>
        )}
        {Object.entries(markets).map(([country, address]) => (
          <option key={country} value={address} className="bg-[var(--color-bg-elevated)]">
            {REGION_FLAGS[country] ?? "🌍"} {country}
          </option>
        ))}
      </select>
    </label>
  );
};

export default RegionDropdownList;
