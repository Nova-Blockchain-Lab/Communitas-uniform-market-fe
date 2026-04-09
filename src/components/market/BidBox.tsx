import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  useAccount,
  useBalance,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Zap, ArrowLeftRight, Calendar, Clock, Info, AlertCircle } from "lucide-react";
import Image from "next/image";

import EnergyBiddingMarketAbi from "@/../abi/EnergyBiddingMarket.json";
import { DECIMALS, defaultChain, WATTS_PER_KWH } from "@/config";
import { useAppContext } from "@/context/AppContext";
import { useMarketToast } from "@/hooks/useMarketToast";
import DateTimePicker from "@/components/common/DateTimePicker";
import ConnectAndSwitchNetworkButton from "@/components/common/ConnectAndSwitchNetworkButton";
import { Card, CardHeader, CardSection, Button } from "@/components/ui";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PriceDerived {
  priceInETH: number;
  priceInEUR: number;
  totalCostETH: number;
  totalCostEUR: number;
}

/* ------------------------------------------------------------------ */
/*  Static data kept outside the component to avoid re-creation        */
/* ------------------------------------------------------------------ */

const SLIDER_MARKS = [0, 25, 50, 75, 100] as const;

const QUICK_AMOUNTS: ReadonlyArray<{ value: number; label: string }> = [
  { value: 1, label: "1 kWh" },
  { value: 5, label: "5 kWh" },
  { value: 10, label: "10 kWh" },
  { value: 25, label: "25 kWh" },
  { value: 50, label: "50 kWh" },
];

/* Shared Tailwind class strings */
const INPUT_BASE =
  "w-full px-4 py-3 min-h-[44px] bg-white/5 border rounded-xl text-white text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

const BADGE_ENERGY =
  "flex items-center gap-2 px-3 sm:px-4 py-3 min-h-[44px] bg-amber-500/10 border border-amber-500/20 rounded-xl shrink-0";

const BADGE_PRICE =
  "flex items-center gap-2 px-3 sm:px-4 py-3 min-h-[44px] bg-blue-500/10 border border-blue-500/20 rounded-xl shrink-0";

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const BidBox: React.FC = () => {
  const { isConnected, address, chainId } = useAccount();
  const { ethPrice, energyMarketAddress } = useAppContext();
  const toast = useMarketToast();

  /* ---- Form state ------------------------------------------------ */
  const [energy, setEnergy] = useState<number>(0);
  const [energyDisplay, setEnergyDisplay] = useState<string>("0");
  const [pricePerKwh, setPricePerKwh] = useState<number>(0.0000057);
  const [priceDisplay, setPriceDisplay] = useState<string>("0.0000057");
  const [isPriceInEUR, setIsPriceInEUR] = useState<boolean>(true);

  /* Single source of truth for selected hours */
  const [bidTimestamps, setBidTimestamps] = useState<number[]>([]);

  /* ---- Contract interactions ------------------------------------- */
  const {
    data: hash,
    isPending: isWritePending,
    writeContract,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash });

  const {
    data: balance,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useBalance({ address });

  /* ---- Derived / memoised values --------------------------------- */
  const priceDerived = useMemo<PriceDerived>(() => {
    const priceInETH =
      isPriceInEUR && ethPrice ? pricePerKwh / ethPrice : pricePerKwh;
    const priceInEUR =
      !isPriceInEUR && ethPrice ? pricePerKwh * ethPrice : pricePerKwh;
    const totalCostETH = energy * priceInETH * bidTimestamps.length;
    const totalCostEUR = ethPrice ? totalCostETH * ethPrice : 0;
    return { priceInETH, priceInEUR, totalCostETH, totalCostEUR };
  }, [energy, pricePerKwh, isPriceInEUR, ethPrice, bidTimestamps.length]);

  const isLoading = isWritePending || isConfirming;
  const needsConnection = !isConnected || (chainId != null && defaultChain.id !== chainId);
  const isDataLoading = isBalanceLoading;

  /* Inline validation */
  const energyError = useMemo(
    () => (energy !== 0 && energy <= 0 ? "Amount must be greater than 0" : null),
    [energy],
  );
  const hoursError = useMemo(
    () => (bidTimestamps.length === 0 ? "Select at least one hour" : null),
    [bidTimestamps.length],
  );

  const insufficientBalance = useMemo(() => {
    if (!balance || priceDerived.totalCostETH === 0) return false;
    const balanceFloat = Number(balance.value) / 1e18;
    return balanceFloat < priceDerived.totalCostETH;
  }, [balance, priceDerived.totalCostETH]);

  const canSubmit = !isLoading && energy > 0 && bidTimestamps.length > 0 && !insufficientBalance;

  /* Price conversion label shown inside the price input */
  const priceConversionLabel = useMemo(() => {
    if (!ethPrice) return null;
    return isPriceInEUR
      ? `${priceDerived.priceInETH.toFixed(8)} ETH`
      : `${priceDerived.priceInEUR.toFixed(2)} EUR`;
  }, [ethPrice, isPriceInEUR, priceDerived.priceInETH, priceDerived.priceInEUR]);

  /* ---- Validation ------------------------------------------------ */
  const validateBid = useCallback((): boolean => {
    if (energy <= 0) {
      toast.error("Invalid Energy Amount", "Please enter a positive energy amount.");
      return false;
    }
    if (bidTimestamps.length === 0) {
      toast.error("No Hours Selected", "Please select at least one future hour.");
      return false;
    }
    if (bidTimestamps.length > 400) {
      toast.error("Too Many Hours", "Maximum 400 hours per transaction. Please split your bid.");
      return false;
    }
    if (!energyMarketAddress) {
      toast.error("Region Not Selected", "Please select a region first.");
      return false;
    }
    return true;
  }, [energy, bidTimestamps.length, energyMarketAddress, toast]);

  /* ---- Handlers -------------------------------------------------- */
  const handleBid = useCallback(() => {
    if (!validateBid()) return;

    const energyInWatts = energy * WATTS_PER_KWH;
    const pricePerWattInWei = BigInt(
      Math.round((priceDerived.priceInETH * 10 ** DECIMALS) / WATTS_PER_KWH),
    );

    if (bidTimestamps.length === 1) {
      writeContract({
        abi: EnergyBiddingMarketAbi,
        address: energyMarketAddress!,
        functionName: "placeBid",
        value: BigInt(energyInWatts) * pricePerWattInWei,
        args: [bidTimestamps[0], energyInWatts],
      });
    } else {
      writeContract({
        abi: EnergyBiddingMarketAbi,
        address: energyMarketAddress!,
        functionName: "placeMultipleBids",
        value:
          BigInt(energyInWatts) *
          pricePerWattInWei *
          BigInt(bidTimestamps.length),
        args: [bidTimestamps, energyInWatts],
      });
    }
  }, [validateBid, energy, priceDerived.priceInETH, bidTimestamps, writeContract, energyMarketAddress]);

  const handleTimestampsChange = useCallback((timestamps: number[]) => {
    setBidTimestamps(timestamps);
  }, []);

  const handleEnergyInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setEnergyDisplay(raw);
      const parsed = parseFloat(raw);
      setEnergy(isNaN(parsed) || parsed < 0 ? 0 : parsed);
    },
    [],
  );

  const handleEnergyBlur = useCallback(() => {
    setEnergyDisplay(String(energy));
  }, [energy]);

  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setEnergy(val);
      setEnergyDisplay(e.target.value);
    },
    [],
  );

  const handlePriceInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setPriceDisplay(raw);
      const parsed = parseFloat(raw);
      setPricePerKwh(isNaN(parsed) || parsed < 0 ? 0 : parsed);
    },
    [],
  );

  const handlePriceBlur = useCallback(() => {
    setPriceDisplay(String(pricePerKwh));
  }, [pricePerKwh]);

  const handleToggleCurrency = useCallback(() => {
    setIsPriceInEUR((prev) => !prev);
  }, []);

  const handleQuickAmount = useCallback((value: number) => {
    setEnergy(value);
    setEnergyDisplay(String(value));
  }, []);

  /* ---- Effects --------------------------------------------------- */
  useEffect(() => {
    if (isConnected && isConfirmed) {
      refetchBalance();
      toast.success("Bid Placed Successfully!", "Your energy bid has been submitted.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed, isConnected, refetchBalance]);

  /* ---- Computed classes ------------------------------------------ */
  const energyInputClassName = useMemo(
    () =>
      `${INPUT_BASE} ${energyError ? "border-red-500/60" : "border-white/10"}`,
    [energyError],
  );

  const priceInputClassName = `${INPUT_BASE} border-white/10 pr-24 sm:pr-32`;

  /* ---- Render ---------------------------------------------------- */
  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full max-w-4xl">
      {/* ============ Date Selection Card ============ */}
      <Card className="flex-1 min-w-0" padding="lg" loading={isDataLoading}>
        <CardHeader
          title="Select Time Period"
          subtitle="Choose when you want to buy energy"
          icon={<Calendar size={20} />}
        />

        <div className="bg-white/5 rounded-xl p-3 sm:p-4">
          <DateTimePicker onChange={handleTimestampsChange} maxHours={400} />
        </div>

        {hoursError && bidTimestamps.length === 0 && (
          <div className="flex items-center gap-1.5 mt-3 text-sm text-gray-500">
            <Clock size={14} className="shrink-0" />
            <span>No hours selected yet</span>
          </div>
        )}
      </Card>

      {/* ============ Bid Form Card ============ */}
      <Card className="flex-1 min-w-0" padding="lg" loading={isDataLoading}>
        <CardHeader
          title="Place Your Bid"
          subtitle="Set energy amount and price"
          icon={<Zap size={20} />}
        />

        {/* ---- Energy Input ---- */}
        <CardSection title="Energy Amount (kWh)" className="mb-5 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <div className={BADGE_ENERGY}>
              <Image src="/energy.png" alt="Energy" width={24} height={24} />
              <span className="text-sm font-medium text-amber-400 whitespace-nowrap">kWh</span>
            </div>
            <input
              type="number"
              inputMode="decimal"
              value={energyDisplay}
              onChange={handleEnergyInputChange}
              onBlur={handleEnergyBlur}
              min={0}
              placeholder="Enter amount"
              aria-label="Energy amount in kilowatt-hours"
              className={energyInputClassName}
            />
          </div>

          {/* Quick amount buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            {QUICK_AMOUNTS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => handleQuickAmount(value)}
                className={`
                  px-3 py-2 min-h-[36px] text-sm font-medium rounded-lg transition-colors
                  ${energy === value
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Range Slider */}
          <div className="mt-3 px-1">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.min(energy, 100)}
              onChange={handleSliderChange}
              aria-label="Energy amount slider"
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-blue-500/40 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110
                [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:shadow-blue-500/40 [&::-moz-range-thumb]:cursor-pointer"
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500 px-1">
              {SLIDER_MARKS.map((mark) => (
                <span key={mark}>{mark}</span>
              ))}
            </div>
          </div>

          {/* Validation error */}
          {energyError && (
            <div className="flex items-center gap-1.5 mt-2 text-sm text-red-400" role="alert">
              <AlertCircle size={14} className="shrink-0" />
              <span>{energyError}</span>
            </div>
          )}
        </CardSection>

        {/* ---- Price Input ---- */}
        <CardSection className="mb-5 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <label className="text-sm font-medium text-gray-400">
              Price per kWh ({isPriceInEUR ? "EUR" : "ETH"})
            </label>
            <button
              type="button"
              onClick={handleToggleCurrency}
              className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors self-start sm:self-auto"
            >
              <ArrowLeftRight size={14} />
              <span className="text-xs font-medium">Switch to {isPriceInEUR ? "ETH" : "EUR"}</span>
            </button>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <div className={BADGE_PRICE}>
              <Image
                src={isPriceInEUR ? "/eur.png" : "/eth.png"}
                alt={isPriceInEUR ? "EUR" : "ETH"}
                width={24}
                height={24}
              />
              <span className="text-sm font-medium text-blue-400 uppercase whitespace-nowrap">
                {isPriceInEUR ? "EUR" : "ETH"}
              </span>
            </div>
            <div className="relative flex-1">
              <input
                type="number"
                inputMode="decimal"
                value={priceDisplay}
                onChange={handlePriceInputChange}
                onBlur={handlePriceBlur}
                min={0}
                step={isPriceInEUR ? 0.01 : 0.000001}
                placeholder="Enter price"
                aria-label={`Price per kilowatt-hour in ${isPriceInEUR ? "euros" : "ETH"}`}
                className={priceInputClassName}
              />
              {priceConversionLabel && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none whitespace-nowrap">
                  {priceConversionLabel}
                </div>
              )}
            </div>
          </div>
        </CardSection>

        {/* ---- Cost Summary ---- */}
        <div className="p-4 bg-white/5 rounded-xl space-y-3 mb-5 sm:mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400 flex items-center gap-2">
              <Clock size={14} className="shrink-0" />
              Bidding for
            </span>
            <span className="font-semibold text-white">
              {bidTimestamps.length} {bidTimestamps.length === 1 ? "hour" : "hours"}
            </span>
          </div>

          <div className="h-px bg-white/10" />

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Energy per hour</span>
            <span className="font-medium text-white">
              {energy} <span className="text-sm text-amber-400">kWh</span>
            </span>
          </div>

          <div className="h-px bg-white/10" />

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Total Cost</span>
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-bold text-white leading-tight">
                {priceDerived.totalCostETH.toFixed(6)}{" "}
                <span className="text-base sm:text-lg text-amber-400">ETH</span>
              </div>
              {ethPrice != null && (
                <div className="text-sm text-gray-400 mt-0.5">
                  ~{priceDerived.totalCostEUR.toFixed(2)} EUR
                </div>
              )}
            </div>
          </div>

          {/* Insufficient balance warning */}
          {insufficientBalance && (
            <>
              <div className="h-px bg-white/10" />
              <div className="flex items-center gap-2 text-sm text-red-400" role="alert">
                <AlertCircle size={14} className="shrink-0" />
                <span>Insufficient balance for this bid</span>
              </div>
            </>
          )}
        </div>

        {/* ---- Action Button ---- */}
        {needsConnection ? (
          <ConnectAndSwitchNetworkButton />
        ) : (
          <Button
            fullWidth
            size="lg"
            onClick={handleBid}
            loading={isLoading}
            disabled={!canSubmit}
          >
            {isConfirming
              ? "Confirming..."
              : isWritePending
                ? "Waiting for wallet..."
                : "Submit Bid"}
          </Button>
        )}

        {/* ---- Info Note ---- */}
        <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
          <Info size={14} className="mt-0.5 shrink-0" />
          <p>
            Your bid will be submitted to the energy market. If matched, you will receive energy
            credits at the clearing price.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default BidBox;
