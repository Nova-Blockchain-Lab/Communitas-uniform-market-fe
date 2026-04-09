import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { TrendingUp, Info, Clock, AlertTriangle, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";

import EnergyBiddingMarketAbi from "@/../abi/EnergyBiddingMarket.json";
import { defaultChain, WATTS_PER_KWH } from "@/config";
import { useAppContext } from "@/context/AppContext";
import { useMarketToast } from "@/hooks/useMarketToast";
import ConnectAndSwitchNetworkButton from "@/components/common/ConnectAndSwitchNetworkButton";
import { Card, CardHeader, CardSection, Button } from "@/components/ui";
import { TransactionModal, TransactionStatus } from "@/components/ui/TransactionModal";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface QuickAmount {
  readonly value: number;
  readonly label: string;
}

interface TransactionDetails {
  type: "sell";
  amount: number;
}

/* ------------------------------------------------------------------ */
/*  Static data kept outside the component to avoid re-creation        */
/* ------------------------------------------------------------------ */

/** Quick-select presets for the energy amount input */
const QUICK_AMOUNTS: ReadonlyArray<QuickAmount> = [
  { value: 0.1, label: "100W" },
  { value: 0.5, label: "500W" },
  { value: 1, label: "1 kWh" },
  { value: 5, label: "5 kWh" },
  { value: 10, label: "10 kWh" },
];

/** Spring transition shared by all quick-select buttons */
const QUICK_BTN_TRANSITION = { type: "spring" as const, stiffness: 400, damping: 17 };

/** Motion presets kept outside render to avoid allocating new objects each frame */
const MOTION_TAP = { scale: 0.92 };
const MOTION_HOVER = { scale: 1.04 };
const SUMMARY_INITIAL = { opacity: 0, height: 0 };
const SUMMARY_ANIMATE = { opacity: 1, height: "auto" as const };
const SUMMARY_EXIT = { opacity: 0, height: 0 };

/* Shared Tailwind class strings (mirrors BidBox pattern) */
const INPUT_BASE =
  "w-full px-4 py-3 min-h-[48px] bg-white/5 border rounded-xl text-white text-base font-medium placeholder-gray-500 transition-colors focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed";

const INPUT_VALID = "border-white/10 focus:ring-emerald-500 focus:border-emerald-500";
const INPUT_ERROR = "border-red-500/60 focus:ring-red-500/50";

const BADGE_ENERGY =
  "flex items-center gap-2 px-3 sm:px-4 py-3 min-h-[44px] bg-amber-500/10 border border-amber-500/20 rounded-xl shrink-0";

/* Enforce 16px font on inputs to prevent iOS auto-zoom */
const INPUT_FONT_STYLE: React.CSSProperties = { fontSize: "16px" };

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const SellBox: React.FC = () => {
  const { isConnected, chainId, address } = useAccount();
  const { energyMarketAddress, ethPrice } = useAppContext();
  const toast = useMarketToast();

  const [energy, setEnergy] = useState<number>(0);
  const [energyDisplay, setEnergyDisplay] = useState<string>("0");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txError, setTxError] = useState<string | undefined>();

  // Contract interactions
  const { data: hash, isPending: isWritePending, writeContract, error: writeError, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({ hash });

  // Update modal status based on transaction state
  useEffect(() => {
    if (isWritePending) {
      setTxStatus("pending");
    } else if (isConfirming) {
      setTxStatus("confirming");
    } else if (isConfirmed) {
      setTxStatus("success");
    } else if (writeError || confirmError) {
      setTxStatus("error");
      const err = writeError || confirmError;
      if (err) {
        let message = err.message;
        if (message.includes("User rejected") || message.includes("user rejected")) {
          message = "Transaction was rejected in your wallet";
        } else if (message.includes("insufficient funds")) {
          message = "Insufficient funds for this transaction";
        } else if (message.length > 150) {
          message = message.substring(0, 150) + "...";
        }
        setTxError(message);
      }
    }
  }, [isWritePending, isConfirming, isConfirmed, writeError, confirmError]);

  // Check seller whitelist status
  const { data: isWhitelisted, isLoading: isWhitelistLoading } = useReadContract({
    address: energyMarketAddress,
    abi: EnergyBiddingMarketAbi,
    functionName: "isSellerWhitelisted",
    args: [address],
    query: { enabled: !!address && !!energyMarketAddress },
  }) as { data: boolean | undefined; isLoading: boolean };

  // ---------------------------------------------------------------------------
  // Derived / memoised values
  // ---------------------------------------------------------------------------

  const currentHourDisplay = useMemo((): string => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now.toLocaleString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const isLoading = isWritePending || isConfirming;
  const needsConnection = !isConnected || (chainId !== undefined && defaultChain.id !== chainId);
  const isNotWhitelisted = isWhitelisted === false;
  const isInputDisabled = isNotWhitelisted || isLoading;

  /** Inline validation message (null = valid) */
  const validationError = useMemo((): string | null => {
    if (energy < 0) return "Amount cannot be negative";
    // Only show "must be greater than 0" once the user has typed something
    if (energyDisplay !== "0" && energyDisplay !== "" && energy === 0) return "Amount must be greater than 0";
    return null;
  }, [energy, energyDisplay]);

  const canSubmit = !validationError && energy > 0 && !isLoading && !isNotWhitelisted;

  /** Watts equivalent for the summary panel */
  const wattsEquivalent = useMemo(
    () => (energy * WATTS_PER_KWH).toLocaleString(),
    [energy],
  );

  /** Pre-computed input className to avoid inline ternary on every render */
  const energyInputClassName = useMemo(
    () => `${INPUT_BASE} ${validationError ? INPUT_ERROR : INPUT_VALID}`,
    [validationError],
  );

  /** Stable transaction details object for the modal */
  const txDetails = useMemo<TransactionDetails>(
    () => ({ type: "sell", amount: energy }),
    [energy],
  );

  /** Button label derived from current transaction state */
  const submitLabel = useMemo((): string => {
    if (isWhitelistLoading) return "Checking authorization...";
    if (isWritePending) return "Confirm in wallet...";
    if (isConfirming) return "Confirming on-chain...";
    return "List Energy for Sale";
  }, [isWhitelistLoading, isWritePending, isConfirming]);

  // ---------------------------------------------------------------------------
  // Handlers (stable references via useCallback)
  // ---------------------------------------------------------------------------

  const handleEnergyChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setEnergyDisplay(raw);
      const parsed = parseInt(raw, 10);
      setEnergy(isNaN(parsed) || parsed < 0 ? 0 : parsed);
    },
    [],
  );

  const handleEnergyBlur = useCallback(() => {
    setEnergyDisplay(String(energy));
  }, [energy]);

  const handleQuickAmount = useCallback((value: number) => {
    setEnergy(value);
    setEnergyDisplay(String(value));
  }, []);

  const handleSell = useCallback(() => {
    if (energy <= 0) {
      toast.error("Invalid Amount", "Please enter a positive energy amount.");
      return;
    }

    if (!energyMarketAddress) {
      toast.error("Region Not Selected", "Please select a region first.");
      return;
    }

    // Convert kWh to Watts for contract
    writeContract({
      abi: EnergyBiddingMarketAbi,
      address: energyMarketAddress,
      functionName: "placeAsk",
      args: [energy * WATTS_PER_KWH, address],
    });
  }, [energy, energyMarketAddress, address, writeContract, toast]);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setTxStatus("idle");
    setTxError(undefined);
    resetWrite();
  }, [resetWrite]);

  const handleRetry = useCallback(() => {
    setTxStatus("idle");
    setTxError(undefined);
    resetWrite();
    handleSell();
  }, [resetWrite, handleSell]);

  // ---------------------------------------------------------------------------
  // Side-effects
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!hash || isConfirming) return;
    if (isConfirmed) {
      toast.success("Energy Listed Successfully!", `You've listed ${energy} kWh for sale.`);
      setEnergy(0);
      setEnergyDisplay("0");
    } else {
      toast.error("Transaction Failed", "Something went wrong. Please try again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirming, isConfirmed, hash, energy]);

  // Open modal whenever a transaction starts
  useEffect(() => {
    if (isWritePending) {
      setIsModalOpen(true);
    }
  }, [isWritePending]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="w-full max-w-md">
      <Card padding="lg" loading={isWhitelistLoading}>
        <CardHeader
          title="Sell Energy"
          subtitle="List your available energy for sale"
          icon={<TrendingUp size={20} />}
        />

        {/* Whitelist Warning Banner */}
        {isConnected && !needsConnection && !isWhitelistLoading && isNotWhitelisted && (
          <div className="relative overflow-hidden p-3 sm:p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-xl mb-5 sm:mb-6">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-amber-400" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 mt-0.5 shrink-0">
                <AlertTriangle size={20} className="text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-amber-300">Seller Not Whitelisted</p>
                <p className="text-xs text-amber-400/80 mt-1.5 leading-relaxed">
                  Your wallet address is not authorized to sell energy on this market. Please contact
                  the market operator to request seller access.
                </p>
                <p className="text-xs text-amber-500/60 mt-2 font-mono truncate">{address}</p>
              </div>
            </div>
          </div>
        )}

        {/* Current Hour Display */}
        <div className="flex items-center gap-3 p-3 sm:p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-5 sm:mb-6">
          <Clock size={20} className="text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-emerald-400/70">Selling for current hour</p>
            <p className="text-sm font-medium text-emerald-400 truncate">{currentHourDisplay}</p>
          </div>
        </div>

        {/* Energy Input */}
        <CardSection title="Energy Amount (kWh)" className="mb-5 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Unit badge */}
            <div className={BADGE_ENERGY}>
              <Image src="/energy.png" alt="Energy" width={24} height={24} />
              <span className="text-sm font-medium text-amber-400 whitespace-nowrap">kWh</span>
            </div>

            {/* Number input */}
            <input
              type="number"
              inputMode="numeric"
              value={energyDisplay}
              onChange={handleEnergyChange}
              onBlur={handleEnergyBlur}
              min={0}
              placeholder="Enter amount"
              disabled={isInputDisabled}
              aria-label="Energy amount in kWh"
              aria-invalid={!!validationError}
              className={energyInputClassName}
              style={INPUT_FONT_STYLE}
            />
          </div>

          {/* Inline validation error */}
          {validationError && (
            <div className="flex items-center gap-1.5 mt-2 text-sm text-red-400" role="alert">
              <AlertCircle size={14} className="shrink-0" />
              <span>{validationError}</span>
            </div>
          )}
        </CardSection>

        {/* Quick Amount Buttons */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-5 sm:mb-6">
          {QUICK_AMOUNTS.map(({ value, label }) => (
            <motion.button
              key={value}
              whileTap={MOTION_TAP}
              whileHover={MOTION_HOVER}
              transition={QUICK_BTN_TRANSITION}
              onClick={() => handleQuickAmount(value)}
              disabled={isInputDisabled}
              className={`
                py-3 text-sm min-h-[44px] font-medium rounded-lg transition-colors
                ${
                  energy === value
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {label}
            </motion.button>
          ))}
        </div>

        {/* Listing Summary */}
        {energy > 0 && (
          <motion.div
            initial={SUMMARY_INITIAL}
            animate={SUMMARY_ANIMATE}
            exit={SUMMARY_EXIT}
            className="p-3 sm:p-4 bg-emerald-500/5 border border-emerald-500/15 rounded-xl space-y-3 mb-5 sm:mb-6"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Energy to list</span>
              <span className="text-sm font-semibold text-white">{energy} kWh</span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Watts equivalent</span>
              <span className="text-sm font-semibold text-white">
                {wattsEquivalent} W
              </span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Payment at clearing price</span>
              <span className="text-xs text-emerald-400 font-medium">determined by market</span>
            </div>
          </motion.div>
        )}

        {/* Action Button */}
        {needsConnection ? (
          <ConnectAndSwitchNetworkButton />
        ) : (
          <Button
            fullWidth
            size="lg"
            variant="success"
            onClick={handleSell}
            loading={isLoading}
            disabled={!canSubmit}
          >
            {submitLabel}
          </Button>
        )}

        {/* Info Note */}
        <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
          <Info size={14} className="mt-0.5 shrink-0" />
          <p>
            Your energy will be listed for the current hour. If matched with a buyer, you will
            receive payment at the market clearing price.
          </p>
        </div>
      </Card>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        status={txStatus}
        hash={hash}
        error={txError}
        details={txDetails}
        onClose={handleModalClose}
        onRetry={handleRetry}
      />
    </div>
  );
};

export default SellBox;
