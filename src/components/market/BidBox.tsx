import React, { useEffect, useState, useCallback } from "react";
import {
  useAccount,
  useBalance,
  useWaitForTransactionReceipt,
  useWriteContract,
  useReadContract,
} from "wagmi";
import { Zap, ArrowLeftRight, Calendar, Clock, Info } from "lucide-react";
import { Spinner } from "@chakra-ui/react";
import Image from "next/image";

import EnergyBiddingMarketAbi from "@/../abi/EnergyBiddingMarket.json";
import { DECIMALS, defaultChain, WATTS_PER_KWH } from "@/config";
import { useAppContext } from "@/context/AppContext";
import { useMarketToast } from "@/hooks/useMarketToast";
import DateTimePicker from "@/components/common/DateTimePicker";
import ConnectAndSwitchNetworkButton from "@/components/common/ConnectAndSwitchNetworkButton";
import { Card, CardHeader, CardSection, Button } from "@/components/ui";

const BidBox: React.FC = () => {
  const { isConnected, address, chainId } = useAccount();
  const { ethPrice, energyMarketAddress } = useAppContext();
  const toast = useMarketToast();

  // Form state
  const [energy, setEnergy] = useState<number>(0);
  const [pricePerKwh, setPricePerKwh] = useState<number>(0.0000057);
  const [isPriceInEUR, setIsPriceInEUR] = useState<boolean>(true);

  // Single source of truth for selected hours
  const [bidTimestamps, setBidTimestamps] = useState<number[]>([]);

  // Contract interactions
  const { data: hash, isPending: isWritePending, writeContract, error: writeError, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({ hash });

  const {
    data: balance,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useBalance({ address });

  // Price helpers
  const getPriceInETH = (): number => {
    if (isPriceInEUR && ethPrice) {
      return pricePerKwh / ethPrice;
    }
    return pricePerKwh;
  };

  const getPriceInEUR = (): number => {
    if (!isPriceInEUR && ethPrice) {
      return pricePerKwh * ethPrice;
    }
    return pricePerKwh;
  };

  const getTotalCost = (): number => {
    return energy * getPriceInETH() * bidTimestamps.length;
  };

  const getTotalCostInEUR = (): number => {
    const total = getTotalCost();
    return ethPrice ? total * ethPrice : 0;
  };

  // Validation
  const validateBid = (): boolean => {
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
  };

  // Submit handler
  const handleBid = async () => {
    if (!validateBid()) return;

    const energyInWatts = energy * WATTS_PER_KWH;
    const pricePerWattInWei = BigInt(Math.round(getPriceInETH() * 10 ** DECIMALS / WATTS_PER_KWH));

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
        value: BigInt(energyInWatts) * pricePerWattInWei * BigInt(bidTimestamps.length),
        args: [bidTimestamps, energyInWatts],
      });
    }
  };

  // Stable callback for DateTimePicker
  const handleTimestampsChange = useCallback((timestamps: number[]) => {
    setBidTimestamps(timestamps);
  }, []);

  // Effects
  useEffect(() => {
    if (isConnected && isConfirmed) {
      refetchBalance();
      toast.success("Bid Placed Successfully!", "Your energy bid has been submitted.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed, isConnected, refetchBalance]);

  const isLoading = isWritePending || isConfirming;
  const needsConnection = !isConnected || (chainId && defaultChain.id !== chainId);

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full max-w-4xl">
      {/* Date Selection Card */}
      <Card className="flex-1" padding="lg">
        <CardHeader
          title="Select Time Period"
          subtitle="Choose when you want to buy energy"
          icon={<Calendar size={20} />}
        />

        <div className="bg-white/5 rounded-xl p-4">
          <DateTimePicker onChange={handleTimestampsChange} maxHours={400} />
        </div>
      </Card>

      {/* Bid Form Card */}
      <Card className="flex-1" padding="lg">
        <CardHeader
          title="Place Your Bid"
          subtitle="Set energy amount and price"
          icon={<Zap size={20} />}
        />

        {/* Energy Input */}
        <CardSection title="Energy Amount" className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Image src="/energy.png" alt="Energy" width={24} height={24} />
              <span className="text-sm font-medium text-amber-400">kWh</span>
            </div>
            <input
              type="number"
              value={energy}
              onChange={(e) => setEnergy(Math.max(0, parseFloat(e.target.value) || 0))}
              min={0}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base sm:text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </CardSection>

        {/* Price Input */}
        <CardSection className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-400">Price per kWh</label>
            <button
              onClick={() => setIsPriceInEUR(!isPriceInEUR)}
              className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ArrowLeftRight size={14} />
              <span className="text-xs">Switch to {isPriceInEUR ? "ETH" : "EUR"}</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <Image
                src={isPriceInEUR ? "/eur.png" : "/eth.png"}
                alt={isPriceInEUR ? "EUR" : "ETH"}
                width={24}
                height={24}
              />
              <span className="text-sm font-medium text-blue-400 uppercase">
                {isPriceInEUR ? "EUR" : "ETH"}
              </span>
            </div>
            <div className="relative flex-1">
              <input
                type="number"
                value={pricePerKwh}
                onChange={(e) => setPricePerKwh(Math.max(0, parseFloat(e.target.value) || 0))}
                min={0}
                step={isPriceInEUR ? 0.01 : 0.000001}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base sm:text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {ethPrice && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  {isPriceInEUR
                    ? `${getPriceInETH().toFixed(8)} ETH`
                    : `${getPriceInEUR().toFixed(2)} EUR`}
                </div>
              )}
            </div>
          </div>
        </CardSection>

        {/* Summary */}
        <div className="p-4 bg-white/5 rounded-xl space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400 flex items-center gap-2">
              <Clock size={14} />
              Bidding for
            </span>
            <span className="font-semibold text-white">
              {bidTimestamps.length} {bidTimestamps.length === 1 ? "hour" : "hours"}
            </span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Total Cost</span>
            <div className="text-right">
              <div className="font-bold text-lg text-white">
                {getTotalCost().toFixed(6)} ETH
              </div>
              {ethPrice && (
                <div className="text-xs text-gray-500">
                  ~{getTotalCostInEUR().toFixed(2)} EUR
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        {needsConnection ? (
          <ConnectAndSwitchNetworkButton />
        ) : (
          <Button
            fullWidth
            size="lg"
            onClick={handleBid}
            loading={isLoading}
            disabled={isLoading || energy <= 0 || bidTimestamps.length === 0}
          >
            {isLoading ? "Processing..." : "Submit Bid"}
          </Button>
        )}

        {/* Info Note */}
        <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
          <Info size={14} className="mt-0.5 flex-shrink-0" />
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
