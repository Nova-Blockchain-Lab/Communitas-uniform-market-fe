import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useConfig } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

import { defaultChain } from "@/config";

interface NetworkSelectorProps {
  selectedNetwork: number;
  onSelectNetwork: (network: number) => void;
}

const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  selectedNetwork,
  onSelectNetwork,
}) => {
  const { chains } = useConfig();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const networkOptions = chains.map((chain) => ({
    id: chain.id,
    name: chain.name,
    icon: chain.id === defaultChain.id ? "/Logo-NovaCidade.svg" : "/arbitrum-arb-logo.svg",
  }));

  const selectedOption = networkOptions.find((opt) => opt.id === selectedNetwork);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl transition-colors"
        aria-label={`Select network: ${selectedOption?.name}`}
      >
        {selectedOption && (
          <Image
            src={selectedOption.icon}
            alt={selectedOption.name}
            width={20}
            height={20}
            className="rounded-full"
          />
        )}
        <span className="text-sm font-medium text-white">
          {selectedOption?.name || "Select Network"}
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
            className="absolute top-full left-0 mt-2 min-w-full bg-gray-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
          >
            <div className="p-1">
              {networkOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    onSelectNetwork(opt.id);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left
                    transition-colors whitespace-nowrap
                    ${opt.id === selectedNetwork
                      ? "bg-emerald-500/20 text-white"
                      : "text-gray-300 hover:bg-white/5"
                    }
                  `}
                >
                  <Image
                    src={opt.icon}
                    alt={opt.name}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                  <span className="text-sm font-medium">{opt.name}</span>
                  {opt.id === selectedNetwork && (
                    <span className="ml-auto text-emerald-400">✓</span>
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

export default NetworkSelector;
