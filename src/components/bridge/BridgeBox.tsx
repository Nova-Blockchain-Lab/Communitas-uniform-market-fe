"use client";
import React, { useEffect, useState, useCallback } from "react";
import { ArrowDownUp, Wallet, AlertCircle, Check } from "lucide-react";
import { useAccount, useConfig } from "wagmi";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";

import { useAppContext } from "@/context/AppContext";
import { baseChain, defaultChain } from "@/config";
import { formatBalance } from "@/utils/utils";
import { SkeletonBlock, SkeletonLine } from "@/components/ui";
import NetworkSelector from "./NetworkSelector";
import { SubmitButton } from "./SubmitButton";

/** Quick-pick preset amounts in ETH */
const QUICK_AMOUNTS = ["0.001", "0.01", "0.05", "0.1"] as const;

/** Bridge step indicator */
const BRIDGE_STEPS = [
  { id: 1, label: "Enter Amount" },
  { id: 2, label: "Confirm" },
  { id: 3, label: "Bridge" },
  { id: 4, label: "Complete" },
] as const;

export const BridgeBox: React.FC = () => {
  const { chains } = useConfig();
  const { address, isConnected } = useAccount();
  const { l1Provider, l2Provider, ethPrice } = useAppContext();

  const [selectedOriginNetwork, setSelectedOriginNetwork] = useState<number>(baseChain.id);
  const [selectedDestinationNetwork, setSelectedDestinationNetwork] = useState<number>(defaultChain.id);

  const [depositAmount, setDepositAmount] = useState<bigint>(BigInt(0));
  const [inputDisplayValue, setInputDisplayValue] = useState<string>("");

  const [originBalance, setOriginBalance] = useState<bigint | undefined>();
  const [destinationBalance, setDestinationBalance] = useState<bigint | undefined>();

  const [swapRotation, setSwapRotation] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);

  const handleOriginNetworkChange = (id: number) => {
    setSelectedOriginNetwork(id);
    setSelectedDestinationNetwork(chains.find((c) => c.id !== id)?.id || defaultChain.id);
  };

  const handleDestinationNetworkChange = (id: number) => {
    setSelectedDestinationNetwork(id);
    setSelectedOriginNetwork(chains.find((c) => c.id !== id)?.id || baseChain.id);
  };

  const switchNetworks = () => {
    setSwapRotation((r) => r + 180);
    handleDestinationNetworkChange(selectedOriginNetwork);
  };

  const handleAmountChange = useCallback((inputValue: string) => {
    setInputDisplayValue(inputValue);

    const normalizedValue = inputValue.replace(/,/g, "").trim();

    if (!normalizedValue || isNaN(Number(normalizedValue))) {
      setDepositAmount(BigInt(0));
      return;
    }

    try {
      const parts = normalizedValue.split(".");
      const integerPart = BigInt(parts[0]) * BigInt(10 ** 18);
      const fractionalPart = parts[1]
        ? BigInt(parts[1].padEnd(18, "0").slice(0, 18))
        : BigInt(0);
      setDepositAmount(integerPart + fractionalPart);
    } catch {
      setDepositAmount(BigInt(0));
    }
  }, []);

  const setMaxAmount = () => {
    if (originBalance) {
      const formatted = formatBalance(originBalance);
      if (formatted) {
        setInputDisplayValue(formatted);
        setDepositAmount(originBalance);
      }
    }
  };

  const hasEnoughBalance = originBalance !== undefined ? originBalance >= depositAmount : false;

  const fetchBalances = useCallback(async () => {
    if (!address || !l1Provider || !l2Provider) {
      setOriginBalance(undefined);
      setDestinationBalance(undefined);
      return;
    }

    try {
      if (selectedOriginNetwork === baseChain.id) {
        const l1Balance = await l1Provider.getBalance(address);
        const l2Balance = await l2Provider.getBalance(address);
        setOriginBalance(BigInt(l1Balance.toString()));
        setDestinationBalance(BigInt(l2Balance.toString()));
      } else {
        const l1Balance = await l1Provider.getBalance(address);
        const l2Balance = await l2Provider.getBalance(address);
        setOriginBalance(BigInt(l2Balance.toString()));
        setDestinationBalance(BigInt(l1Balance.toString()));
      }
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  }, [address, l1Provider, l2Provider, selectedOriginNetwork]);

  useEffect(() => {
    fetchBalances().finally(() => setInitialLoading(false));
  }, [fetchBalances]);

  const getEURValue = (eth: string | undefined): string => {
    if (!eth || !ethPrice) return "";
    const ethNum = parseFloat(eth);
    return (ethNum * ethPrice).toFixed(2);
  };

  const getNetworkName = (chainId: number): string => {
    return chainId === defaultChain.id ? "Nova Cidade" : "Arbitrum";
  };

  // Determine which bridge step the user is at
  const currentStep = depositAmount > BigInt(0) && hasEnoughBalance ? 2 : 1;

  // Skeleton for initial data load
  if (initialLoading && !isConnected) {
    return (
      <div className="space-y-4">
        <SkeletonLine width="30%" height="0.875rem" />
        <SkeletonBlock height="6rem" rounded="xl" />
        <div className="flex justify-center">
          <SkeletonBlock width="3rem" height="3rem" rounded="xl" />
        </div>
        <SkeletonLine width="20%" height="0.875rem" />
        <SkeletonBlock height="6rem" rounded="xl" />
        <SkeletonBlock height="4rem" rounded="xl" />
        <SkeletonBlock height="3rem" rounded="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Step Indicator */}
      <div className="flex items-center justify-between mb-2">
        {BRIDGE_STEPS.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                  ${step.id < currentStep
                    ? "bg-emerald-500 text-white"
                    : step.id === currentStep
                      ? "bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40"
                      : "bg-white/5 text-gray-600"
                  }
                `}
              >
                {step.id < currentStep ? <Check size={14} /> : step.id}
              </div>
              <span className={`text-[10px] font-medium ${step.id <= currentStep ? "text-gray-300" : "text-gray-600"}`}>
                {step.label}
              </span>
            </div>
            {idx < BRIDGE_STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-1 mb-4 transition-colors duration-300 ${step.id < currentStep ? "bg-emerald-500/50" : "bg-white/10"}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* From Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-400">From</span>
          <NetworkSelector
            selectedNetwork={selectedOriginNetwork}
            onSelectNetwork={handleOriginNetworkChange}
          />
        </div>

        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <input
              type="text"
              inputMode="decimal"
              value={inputDisplayValue}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.0"
              className="w-full bg-transparent text-2xl font-semibold text-white placeholder-gray-600 focus:outline-none"
            />
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
              <Image src="/eth.png" alt="ETH" width={20} height={20} />
              <span className="text-sm font-medium text-white">ETH</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {ethPrice && inputDisplayValue && (
                <>~${getEURValue(inputDisplayValue)} EUR</>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">
                Balance: {formatBalance(originBalance) || "0"} ETH
              </span>
              {originBalance && originBalance > BigInt(0) && (
                <button
                  onClick={setMaxAmount}
                  className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 transition-colors"
                >
                  MAX
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick amount pick buttons */}
        <div className="flex items-center gap-2">
          {QUICK_AMOUNTS.map((amount) => (
            <motion.button
              key={amount}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAmountChange(amount)}
              className={`
                flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors
                ${inputDisplayValue === amount
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                  : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              {amount}
            </motion.button>
          ))}
        </div>

        {!hasEnoughBalance && depositAmount > BigInt(0) && originBalance !== undefined && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-red-400 text-sm"
          >
            <AlertCircle size={14} />
            Insufficient balance
          </motion.div>
        )}
      </div>

      {/* Swap Button with rotation animation */}
      <div className="flex justify-center -my-1">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{ rotate: swapRotation }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          onClick={switchNetworks}
          className="p-3 bg-emerald-500/20 hover:bg-emerald-500/30 rounded-xl text-emerald-400 transition-colors"
          aria-label="Swap networks"
        >
          <ArrowDownUp size={20} />
        </motion.button>
      </div>

      {/* To Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-400">To</span>
          <NetworkSelector
            selectedNetwork={selectedDestinationNetwork}
            onSelectNetwork={handleDestinationNetworkChange}
          />
        </div>

        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-semibold text-gray-400">
              {inputDisplayValue || "0.0"}
            </span>
            <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg">
              <Image src="/eth.png" alt="ETH" width={20} height={20} />
              <span className="text-sm font-medium text-white">ETH</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">You will receive</span>
            <span className="text-gray-500">
              Balance: {formatBalance(destinationBalance) || "0"} ETH
            </span>
          </div>
        </div>
      </div>

      {/* Route Info */}
      <div className="p-3 bg-white/5 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Route</span>
          <span className="text-white font-medium">
            {getNetworkName(selectedOriginNetwork)} → {getNetworkName(selectedDestinationNetwork)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Est. Time</span>
          <span className="text-white">
            {selectedOriginNetwork === baseChain.id ? "~10 min" : "~7 days"}
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <SubmitButton
        originNetwork={selectedOriginNetwork}
        amount={depositAmount}
        hasEnoughBalance={hasEnoughBalance}
      />
    </div>
  );
};

export default BridgeBox;
