import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { useConfig } from "wagmi";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";

import { defaultChain } from "@/config";

interface NetworkOption {
  id: number;
  name: string;
  icon: string;
}

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

  const networkOptions: NetworkOption[] = useMemo(
    () =>
      chains.map((chain) => ({
        id: chain.id,
        name: chain.name,
        icon:
          chain.id === defaultChain.id
            ? "/Logo-NovaCidade.svg"
            : "/arbitrum-arb-logo.svg",
      })),
    [chains],
  );

  const selectedOption = useMemo(
    () => networkOptions.find((opt) => opt.id === selectedNetwork),
    [networkOptions, selectedNetwork],
  );

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleSelect = useCallback(
    (id: number) => {
      onSelectNetwork(id);
      setIsOpen(false);
    },
    [onSelectNetwork],
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={handleToggle}
        className="
          flex items-center gap-2 px-3 py-2 min-h-[44px]
          bg-white/10 hover:bg-white/15 active:bg-white/20
          border border-white/10 rounded-xl
          transition-colors
          max-sm:px-2.5 max-sm:gap-1.5
        "
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select network: ${selectedOption?.name || "Select Network"}`}
      >
        {selectedOption && (
          <Image
            src={selectedOption.icon}
            alt=""
            width={20}
            height={20}
            className="rounded-full shrink-0"
          />
        )}
        <span className="text-sm font-medium text-white whitespace-nowrap max-sm:text-xs">
          {selectedOption?.name || "Select Network"}
        </span>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            aria-label="Network options"
            className="
              absolute top-full mt-2 min-w-full w-max
              bg-gray-900 border border-white/10 rounded-xl
              shadow-xl overflow-hidden z-50
              right-0 sm:left-0 sm:right-auto
            "
          >
            <div className="p-1">
              {networkOptions.map((opt) => (
                <button
                  key={opt.id}
                  role="option"
                  aria-selected={opt.id === selectedNetwork}
                  onClick={() => handleSelect(opt.id)}
                  className={`
                    w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px]
                    rounded-lg text-left transition-colors whitespace-nowrap
                    ${
                      opt.id === selectedNetwork
                        ? "bg-emerald-500/20 text-white"
                        : "text-gray-300 hover:bg-white/5 active:bg-white/10"
                    }
                  `}
                >
                  <Image
                    src={opt.icon}
                    alt=""
                    width={22}
                    height={22}
                    className="rounded-full shrink-0"
                  />
                  <span className="text-sm font-medium">{opt.name}</span>
                  {opt.id === selectedNetwork && (
                    <span className="ml-auto text-emerald-400 shrink-0" aria-hidden="true">
                      &#10003;
                    </span>
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
