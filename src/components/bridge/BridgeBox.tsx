import React, { useState } from "react";
import { ArrowDownUp, Wallet, AlertCircle, ArrowRight, Clock, Shield } from "lucide-react";
import { useAccount, useBalance } from "wagmi";
import { parseEther } from "viem";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";

import { baseChain, defaultChain } from "@/config/chains";
import { formatBalance } from "@/utils/utils";
import NetworkSelector from "./NetworkSelector";
import SubmitButton from "./SubmitButton";
import { useEthPrice } from "@/hooks/useEthPrice";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

/** Quick-pick preset amounts in ETH */
const QUICK_AMOUNTS = ["0.001", "0.01", "0.05", "0.1"] as const;

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
  const { address } = useAccount();
  const ethPrice = useEthPrice();

  // Two chains, so the destination is always the other one.
  const [originNetwork, setOriginNetwork] = useState<number>(baseChain.id);
  const isDeposit = originNetwork === baseChain.id;
  const destinationNetwork = isDeposit ? defaultChain.id : baseChain.id;

  const [depositAmount, setDepositAmount] = useState<bigint>(ZERO);
  const [inputDisplayValue, setInputDisplayValue] = useState<string>("");
  const [swapRotation, setSwapRotation] = useState(0);

  const { data: parentBalance } = useBalance({ address, chainId: baseChain.id });
  const { data: childBalance } = useBalance({ address, chainId: defaultChain.id });
  const originBalance = (isDeposit ? parentBalance : childBalance)?.value;
  const destinationBalance = (isDeposit ? childBalance : parentBalance)?.value;

  const switchNetworks = () => {
    setSwapRotation((r) => r + 180);
    setOriginNetwork(destinationNetwork);
  };

  const handleAmountChange = (inputValue: string) => {
    setInputDisplayValue(inputValue);
    try {
      const wei = parseEther(inputValue.replace(/,/g, "").trim());
      setDepositAmount(wei > ZERO ? wei : ZERO);
    } catch {
      setDepositAmount(ZERO);
    }
  };

  const setMaxAmount = () => {
    if (!originBalance) return;
    setInputDisplayValue(formatBalance(originBalance).replace(/\s*ETH$/, ""));
    setDepositAmount(originBalance);
  };

  const hasEnoughBalance = originBalance !== undefined && originBalance >= depositAmount;
  const showInsufficientBalance = !hasEnoughBalance && depositAmount > ZERO && originBalance !== undefined;
  const estimatedTime = isDeposit ? "~10 min" : "~7 days";
  const originNetworkName = isDeposit ? "Arbitrum" : "Nova Cidade";
  const destinationNetworkName = isDeposit ? "Nova Cidade" : "Arbitrum";
  const directionLabel = isDeposit ? "Deposit" : "Withdraw";
  const ethNum = parseFloat(inputDisplayValue);
  const eurValue = ethPrice && !isNaN(ethNum) ? (ethNum * ethPrice).toFixed(2) : "";

  /* ----- Render --------------------------------------------------- */

  return (
    <div className="space-y-3 sm:space-y-4 w-full max-w-full">
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
            label="From network"
            selectedNetwork={originNetwork}
            onSelectNetwork={setOriginNetwork}
          />
        </div>

        <div className={fromSectionCardClasses}>
          {/* Balance display - prominent, above input */}
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/5">
            <span className={balanceLabelClasses}>Available</span>
            <div className="flex items-center gap-2">
              <Wallet size={13} className="text-gray-500 shrink-0" />
              <span className={balanceValueClasses}>
                {formatBalance(originBalance)}
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
              onClick={() => handleAmountChange(amount)}
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
            label="To network"
            selectedNetwork={destinationNetwork}
            onSelectNetwork={(id) => setOriginNetwork(id === baseChain.id ? defaultChain.id : baseChain.id)}
          />
        </div>

        <div className={sectionCardClasses}>
          {/* Destination balance - prominent */}
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/5">
            <span className={balanceLabelClasses}>Current Balance</span>
            <div className="flex items-center gap-2">
              <Wallet size={13} className="text-gray-500 shrink-0" />
              <span className={balanceValueClasses}>
                {formatBalance(destinationBalance)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[16px] sm:text-2xl font-semibold text-gray-400 truncate min-w-0">
              {inputDisplayValue || "0.0"}
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
        originNetwork={originNetwork}
        amount={depositAmount}
        hasEnoughBalance={hasEnoughBalance}
      />
    </div>
  );
};

export default BridgeBox;
