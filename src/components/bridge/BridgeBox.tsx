"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { ArrowDownUp, Wallet, AlertCircle, Check, ArrowRight, Clock, Shield } from "lucide-react";
import { useAccount, useConfig } from "wagmi";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";

import { useAppContext } from "@/context/AppContext";
import { baseChain, defaultChain } from "@/config";
import { formatBalance } from "@/utils/utils";
import { SkeletonBlock, SkeletonLine } from "@/components/ui";
import NetworkSelector from "./NetworkSelector";
import { SubmitButton } from "./SubmitButton";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type QuickAmount = (typeof QUICK_AMOUNTS)[number];

interface BridgeStep {
  readonly id: number;
  readonly label: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Quick-pick preset amounts in ETH */
const QUICK_AMOUNTS = ["0.001", "0.01", "0.05", "0.1"] as const;

/** Bridge step indicator */
const BRIDGE_STEPS: readonly BridgeStep[] = [
  { id: 1, label: "Enter Amount" },
  { id: 2, label: "Confirm" },
  { id: 3, label: "Bridge" },
  { id: 4, label: "Complete" },
] as const;

const ZERO = BigInt(0);

/* ------------------------------------------------------------------ */
/*  Styles (extracted to avoid inline object re-creation)             */
/* ------------------------------------------------------------------ */

const ethBadgeClasses =
  "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/5 rounded-lg shrink-0";

const sectionCardClasses =
  "p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10 transition-colors duration-200";

const fromSectionCardClasses =
  "p-3 sm:p-4 bg-white/5 rounded-xl border border-white/10 transition-colors duration-200 focus-within:border-emerald-500/40 focus-within:bg-white/[0.07]";

const balanceLabelClasses =
  "text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider";

const balanceValueClasses =
  "text-sm sm:text-base font-semibold text-white tabular-nums";

/* ------------------------------------------------------------------ */
/*  Extracted animation config objects (stable references)             */
/* ------------------------------------------------------------------ */

const quickBtnHover = { scale: 1.05 } as const;
const quickBtnTap = { scale: 0.95 } as const;
const swapBtnHover = { scale: 1.1 } as const;
const swapBtnTap = { scale: 0.9 } as const;
const swapSpring = { type: "spring" as const, stiffness: 200, damping: 15 };
const fadeInOut = { initial: { opacity: 0, height: 0 }, animate: { opacity: 1, height: "auto" as const }, exit: { opacity: 0, height: 0 } };
const directionPulse = { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] };
const directionPulseTransition = { duration: 2, repeat: Infinity, ease: "easeInOut" as const };

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const BridgeBox: React.FC = () => {
  const { chains } = useConfig();
  const { address, isConnected } = useAccount();
  const { l1Provider, l2Provider, ethPrice } = useAppContext();

  const [selectedOriginNetwork, setSelectedOriginNetwork] = useState<number>(baseChain.id);
  const [selectedDestinationNetwork, setSelectedDestinationNetwork] = useState<number>(defaultChain.id);

  const [depositAmount, setDepositAmount] = useState<bigint>(ZERO);
  const [inputDisplayValue, setInputDisplayValue] = useState<string>("");

  const [originBalance, setOriginBalance] = useState<bigint | undefined>();
  const [destinationBalance, setDestinationBalance] = useState<bigint | undefined>();

  const [swapRotation, setSwapRotation] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);

  /* ----- Network handlers ----------------------------------------- */

  const handleOriginNetworkChange = useCallback(
    (id: number) => {
      setSelectedOriginNetwork(id);
      setSelectedDestinationNetwork(
        chains.find((c) => c.id !== id)?.id || defaultChain.id
      );
    },
    [chains]
  );

  const handleDestinationNetworkChange = useCallback(
    (id: number) => {
      setSelectedDestinationNetwork(id);
      setSelectedOriginNetwork(
        chains.find((c) => c.id !== id)?.id || baseChain.id
      );
    },
    [chains]
  );

  const switchNetworks = useCallback(() => {
    setSwapRotation((r) => r + 180);
    handleDestinationNetworkChange(selectedOriginNetwork);
  }, [handleDestinationNetworkChange, selectedOriginNetwork]);

  /* ----- Amount handlers ------------------------------------------ */

  const handleAmountChange = useCallback((inputValue: string) => {
    setInputDisplayValue(inputValue);

    const normalizedValue = inputValue.replace(/,/g, "").trim();

    if (!normalizedValue || isNaN(Number(normalizedValue))) {
      setDepositAmount(ZERO);
      return;
    }

    try {
      const parts = normalizedValue.split(".");
      const integerPart = BigInt(parts[0]) * BigInt(10 ** 18);
      const fractionalPart = parts[1]
        ? BigInt(parts[1].padEnd(18, "0").slice(0, 18))
        : ZERO;
      setDepositAmount(integerPart + fractionalPart);
    } catch {
      setDepositAmount(ZERO);
    }
  }, []);

  const setMaxAmount = useCallback(() => {
    if (originBalance) {
      const formatted = formatBalance(originBalance);
      if (formatted) {
        setInputDisplayValue(formatted.replace(/\s*ETH$/, ""));
        setDepositAmount(originBalance);
      }
    }
  }, [originBalance]);

  const handleQuickAmount = useCallback(
    (amount: QuickAmount) => {
      handleAmountChange(amount);
    },
    [handleAmountChange]
  );

  /* ----- Computed / memoised values ------------------------------- */

  const hasEnoughBalance = useMemo(
    () => (originBalance !== undefined ? originBalance >= depositAmount : false),
    [originBalance, depositAmount]
  );

  const isDeposit = selectedOriginNetwork === baseChain.id;

  const estimatedTime = useMemo(
    () => (isDeposit ? "~10 min" : "~7 days"),
    [isDeposit]
  );

  const originNetworkName = useMemo(
    () => (selectedOriginNetwork === defaultChain.id ? "Nova Cidade" : "Arbitrum"),
    [selectedOriginNetwork]
  );

  const destinationNetworkName = useMemo(
    () => (selectedDestinationNetwork === defaultChain.id ? "Nova Cidade" : "Arbitrum"),
    [selectedDestinationNetwork]
  );

  const eurValue = useMemo(() => {
    if (!inputDisplayValue || !ethPrice) return "";
    const ethNum = parseFloat(inputDisplayValue);
    if (isNaN(ethNum)) return "";
    return (ethNum * ethPrice).toFixed(2);
  }, [inputDisplayValue, ethPrice]);

  const formattedOriginBalance = useMemo(
    () => formatBalance(originBalance) || "0 ETH",
    [originBalance]
  );

  const formattedDestinationBalance = useMemo(
    () => formatBalance(destinationBalance) || "0 ETH",
    [destinationBalance]
  );

  const showInsufficientBalance = useMemo(
    () => !hasEnoughBalance && depositAmount > ZERO && originBalance !== undefined,
    [hasEnoughBalance, depositAmount, originBalance]
  );

  // Determine which bridge step the user is at
  const currentStep = useMemo(
    () => (depositAmount > ZERO && hasEnoughBalance ? 2 : 1),
    [depositAmount, hasEnoughBalance]
  );

  const directionLabel = useMemo(
    () => (isDeposit ? "Deposit" : "Withdraw"),
    [isDeposit]
  );

  const receiveDisplay = useMemo(
    () => inputDisplayValue || "0.0",
    [inputDisplayValue]
  );

  /* ----- Balance fetching ----------------------------------------- */

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

  /* ----- Skeleton (initial load, disconnected) -------------------- */

  if (initialLoading && !isConnected) {
    return (
      <div className="space-y-4 w-full">
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

  /* ----- Render --------------------------------------------------- */

  return (
    <div className="space-y-3 sm:space-y-4 w-full max-w-full">
      {/* ---- Step Indicator ---- */}
      <div className="flex items-center justify-between mb-1 sm:mb-2 px-0.5 sm:px-1">
        {BRIDGE_STEPS.map((step, idx) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center gap-0.5 sm:gap-1">
              <div
                className={`
                  w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center
                  text-[10px] sm:text-xs font-bold transition-all duration-300
                  ${step.id < currentStep
                    ? "bg-emerald-500 text-white"
                    : step.id === currentStep
                      ? "bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40"
                      : "bg-white/5 text-gray-600"
                  }
                `}
              >
                {step.id < currentStep ? <Check size={12} /> : step.id}
              </div>
              <span
                className={`
                  text-[9px] sm:text-[10px] font-medium whitespace-nowrap
                  ${step.id <= currentStep ? "text-gray-300" : "text-gray-600"}
                `}
              >
                {step.label}
              </span>
            </div>
            {idx < BRIDGE_STEPS.length - 1 && (
              <div
                className={`
                  flex-1 h-px mx-0.5 sm:mx-1 mb-4 transition-colors duration-300
                  ${step.id < currentStep ? "bg-emerald-500/50" : "bg-white/10"}
                `}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ---- Direction Badge ---- */}
      <div className="flex items-center justify-center">
        <motion.div
          key={directionLabel}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            inline-flex items-center gap-2 px-3 py-1 rounded-full
            text-xs sm:text-sm font-semibold
            ${isDeposit
              ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
              : "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
            }
          `}
        >
          <motion.span
            animate={directionPulse}
            transition={directionPulseTransition}
            className="inline-block w-1.5 h-1.5 rounded-full bg-current"
          />
          {directionLabel}: {originNetworkName} &rarr; {destinationNetworkName}
        </motion.div>
      </div>

      {/* ---- From Section ---- */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs sm:text-sm font-medium text-gray-400">From</span>
          <NetworkSelector
            selectedNetwork={selectedOriginNetwork}
            onSelectNetwork={handleOriginNetworkChange}
          />
        </div>

        <div className={fromSectionCardClasses}>
          {/* Balance display - prominent, above input */}
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/5">
            <span className={balanceLabelClasses}>Available</span>
            <div className="flex items-center gap-2">
              <Wallet size={13} className="text-gray-500 shrink-0" />
              <span className={balanceValueClasses}>
                {formattedOriginBalance}
              </span>
              {originBalance && originBalance > ZERO && (
                <button
                  onClick={setMaxAmount}
                  className="
                    px-2 py-0.5 text-[10px] sm:text-xs font-semibold
                    bg-emerald-500/20 text-emerald-400 rounded
                    hover:bg-emerald-500/30 active:bg-emerald-500/40
                    transition-colors touch-manipulation
                    min-h-[28px] min-w-[40px]
                  "
                >
                  MAX
                </button>
              )}
            </div>
          </div>

          {/* Amount input row */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={inputDisplayValue}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.0"
              className="
                w-full min-w-0 bg-transparent
                text-[16px] sm:text-2xl font-semibold text-white
                placeholder-gray-600 focus:outline-none
                [-moz-appearance:textfield]
                [&::-webkit-outer-spin-button]:appearance-none
                [&::-webkit-inner-spin-button]:appearance-none
                min-h-[44px]
              "
              aria-label="Bridge amount in ETH"
            />
            <div className={ethBadgeClasses}>
              <Image src="/eth.png" alt="ETH" width={20} height={20} />
              <span className="text-xs sm:text-sm font-medium text-white">ETH</span>
            </div>
          </div>

          {/* EUR value row */}
          <div className="text-xs sm:text-sm">
            <span className="text-gray-500 truncate">
              {eurValue ? <>~&euro;{eurValue} EUR</> : <>&nbsp;</>}
            </span>
          </div>
        </div>

        {/* Quick-pick amounts */}
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {QUICK_AMOUNTS.map((amount) => (
            <motion.button
              key={amount}
              whileHover={quickBtnHover}
              whileTap={quickBtnTap}
              onClick={() => handleQuickAmount(amount)}
              className={`
                py-2.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg border
                transition-colors touch-manipulation
                min-h-[44px]
                ${inputDisplayValue === amount
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                  : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white active:bg-white/15"
                }
              `}
            >
              {amount}
            </motion.button>
          ))}
        </div>

        {/* Insufficient balance warning */}
        <AnimatePresence>
          {showInsufficientBalance && (
            <motion.div
              initial={fadeInOut.initial}
              animate={fadeInOut.animate}
              exit={fadeInOut.exit}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 text-red-400 text-xs sm:text-sm p-2 bg-red-500/5 rounded-lg border border-red-500/10">
                <AlertCircle size={14} className="shrink-0" />
                <span>Insufficient balance on {originNetworkName}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---- Swap / Direction Indicator ---- */}
      <div className="flex items-center justify-center gap-3 -my-0.5 sm:-my-1">
        <div className="flex-1 h-px bg-white/5" />
        <motion.button
          whileHover={swapBtnHover}
          whileTap={swapBtnTap}
          animate={{ rotate: swapRotation }}
          transition={swapSpring}
          onClick={switchNetworks}
          className="
            p-2.5 sm:p-3 bg-emerald-500/20 hover:bg-emerald-500/30
            active:bg-emerald-500/40 rounded-xl text-emerald-400
            transition-colors touch-manipulation
            shadow-lg shadow-emerald-500/5
            min-w-[44px] min-h-[44px] flex items-center justify-center
          "
          aria-label="Swap networks"
        >
          <ArrowDownUp size={18} className="sm:w-5 sm:h-5" />
        </motion.button>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {/* ---- To Section ---- */}
      <div className="space-y-2 sm:space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs sm:text-sm font-medium text-gray-400">To</span>
          <NetworkSelector
            selectedNetwork={selectedDestinationNetwork}
            onSelectNetwork={handleDestinationNetworkChange}
          />
        </div>

        <div className={sectionCardClasses}>
          {/* Destination balance - prominent */}
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/5">
            <span className={balanceLabelClasses}>Current Balance</span>
            <div className="flex items-center gap-2">
              <Wallet size={13} className="text-gray-500 shrink-0" />
              <span className={balanceValueClasses}>
                {formattedDestinationBalance}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[16px] sm:text-2xl font-semibold text-gray-400 truncate min-w-0">
              {receiveDisplay}
            </span>
            <div className={ethBadgeClasses}>
              <Image src="/eth.png" alt="ETH" width={20} height={20} />
              <span className="text-xs sm:text-sm font-medium text-white">ETH</span>
            </div>
          </div>

          <div className="text-xs sm:text-sm">
            <span className="text-gray-500">You will receive</span>
          </div>
        </div>
      </div>

      {/* ---- Route Info ---- */}
      <motion.div
        layout
        className="p-3 sm:p-4 bg-white/5 rounded-xl space-y-2 sm:space-y-2.5"
      >
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-500 flex items-center gap-1.5">
            <ArrowRight size={13} className="text-gray-600 shrink-0" />
            <span className="truncate">Route</span>
          </span>
          <span className="text-white font-medium text-right truncate ml-2">
            {originNetworkName} &rarr; {destinationNetworkName}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-500 flex items-center gap-1.5">
            <Clock size={13} className="text-gray-600 shrink-0" />
            <span className="truncate">Est. Time</span>
          </span>
          <span className={`font-medium ${isDeposit ? "text-emerald-400" : "text-amber-400"}`}>
            {estimatedTime}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-gray-500 flex items-center gap-1.5">
            <Shield size={13} className="text-gray-600 shrink-0" />
            <span className="truncate">Bridge</span>
          </span>
          <span className="text-gray-300 font-medium">
            Arbitrum Native
          </span>
        </div>
      </motion.div>

      {/* ---- Submit Button ---- */}
      <SubmitButton
        originNetwork={selectedOriginNetwork}
        amount={depositAmount}
        hasEnoughBalance={hasEnoughBalance}
      />
    </div>
  );
};

export default BridgeBox;
