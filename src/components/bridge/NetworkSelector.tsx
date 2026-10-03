import React from "react";
import { ChevronDown } from "lucide-react";
import { useConfig } from "wagmi";
import Image from "next/image";

import { defaultChain } from "@/config/chains";

interface NetworkSelectorProps {
  /** Accessible name, e.g. "From network" */
  label: string;
  selectedNetwork: number;
  onSelectNetwork: (network: number) => void;
}

const iconFor = (id: number) => (id === defaultChain.id ? "/Logo-NovaCidade.svg" : "/arbitrum-arb-logo.svg");

const NetworkSelector: React.FC<NetworkSelectorProps> = ({ label, selectedNetwork, onSelectNetwork }) => {
  const { chains } = useConfig();
  const selected = chains.find((chain) => chain.id === selectedNetwork);

  // Transparent native <select> over the styled pill, as in RegionDropdownList
  return (
    <label className="relative flex items-center gap-2 px-3 py-2 min-h-[44px] bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl transition-colors cursor-pointer max-sm:px-2.5 max-sm:gap-1.5 focus-within:ring-2 focus-within:ring-emerald-500/50">
      <Image src={iconFor(selectedNetwork)} alt="" width={20} height={20} className="rounded-full shrink-0" />
      <span className="text-sm font-medium text-white whitespace-nowrap max-sm:text-xs">
        {selected?.name ?? "Select Network"}
      </span>
      <ChevronDown size={16} className="text-gray-400 shrink-0" />
      <select
        value={selectedNetwork}
        onChange={(e) => onSelectNetwork(Number(e.target.value))}
        aria-label={label}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      >
        {chains.map((chain) => (
          <option key={chain.id} value={chain.id} className="bg-gray-900">
            {chain.name}
          </option>
        ))}
      </select>
    </label>
  );
};

export default NetworkSelector;
