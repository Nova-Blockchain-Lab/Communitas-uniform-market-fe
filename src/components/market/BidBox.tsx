import React, { useEffect, useState, useCallback } from "react";
import {
  useAccount,
  useBalance,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { motion } from "framer-motion";
import { Zap, ArrowLeftRight, Calendar, Clock, Info } from "lucide-react";
import { Spinner, useToast, Switch } from "@chakra-ui/react";
import Image from "next/image";

import EnergyBiddingMarketAbi from "@/../abi/EnergyBiddingMarket.json";
import { DECIMALS, defaultChain } from "@/config";
import { useAppContext } from "@/context/AppContext";
import DateMultiplePicker from "@/components/common/DateMultiplePicker";
import DateRangePicker from "@/components/common/DateRangePicker";
import ConnectAndSwitchNetworkButton from "@/components/common/ConnectAndSwitchNetworkButton";
import { Card, CardHeader, CardSection, Button, NumberInput } from "@/components/ui";

const BidBox: React.FC = () => {
  const { isConnected, address, chainId } = useAccount();
  const { ethPrice, energyMarketAddress } = useAppContext();
  const toast = useToast();

  // Form state
  const [energy, setEnergy] = useState<number>(0);
  const [pricePerKwh, setPricePerKwh] = useState<number>(0.000001);
  const [isPriceInEUR, setIsPriceInEUR] = useState<boolean>(true);
  const [isMultipleDate, setIsMultipleDate] = useState<boolean>(false);

  // Date state
  const getNextHour = (hourOffset = 0) => {
    const now = new Date();
    now.setHours(now.getHours() + hourOffset);
    now.setMinutes(0, 0, 0);
    return now;
  };

  const [selectedDates, setSelectedDates] = useState<Date[]>([getNextHour(1)]);
  const [startDate, setStartDate] = useState<Date | undefined>(getNextHour(1));
  const [endDate, setEndDate] = useState<Date | undefined>(getNextHour(2));

  // Contract interactions
  const { data: hash, isPending: isWritePending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const {
    data: balance,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useBalance({ address });

  // Calculations
  const calculateDifferentHours = useCallback(
    (selectedDays: Date[], startTime: Date, endTime: Date): number[] => {
      const result: number[] = [];
      selectedDays.forEach((day) => {
        const start = new Date(day);
        start.setHours(startTime.getHours(), 0, 0, 0);
        const end = new Date(day);
        end.setHours(endTime.getHours(), 0, 0, 0);
        for (let hour = start.getTime(); hour < end.getTime(); hour += 3600000) {
          result.push(Math.floor(hour / 1000));
        }
      });
      return Array.from(new Set(result)).sort((a, b) => a - b);
    },
    []
  );

  const calculateExactHours = useCallback((): number => {
    if (!startDate || !endDate) return 0;
    if (isMultipleDate) {
      return calculateDifferentHours(selectedDates, startDate, endDate).length;
    }
    return Math.abs((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
  }, [startDate, endDate, isMultipleDate, selectedDates, calculateDifferentHours]);

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
    const hours = calculateExactHours();
    return energy * getPriceInETH() * hours;
  };

  const getTotalCostInEUR = (): number => {
    const total = getTotalCost();
    return ethPrice ? total * ethPrice : 0;
  };

  // Validation
  const validateBid = (): boolean => {
    const now = new Date();

    if (energy <= 0) {
      toast({
        title: "Invalid Energy Amount",
        description: "Please enter a positive energy amount.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return false;
    }

    if (!isMultipleDate && startDate && startDate <= now) {
      toast({
        title: "Invalid Start Time",
        description: "The start time must be in the future.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return false;
    }

    if (!isMultipleDate && startDate && endDate && endDate <= startDate) {
      toast({
        title: "Invalid End Time",
        description: "The end time must be after the start time.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return false;
    }

    if (isMultipleDate && selectedDates.length === 0) {
      toast({
        title: "No Dates Selected",
        description: "Please select at least one date.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return false;
    }

    if (calculateExactHours() > 400) {
      toast({
        title: "Too Many Hours",
        description: "Maximum 400 hours per transaction. Please split your bid.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return false;
    }

    if (!energyMarketAddress) {
      toast({
        title: "Region Not Selected",
        description: "Please select a region first.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return false;
    }

    return true;
  };

  // Submit handler
  const handleBid = async () => {
    if (!validateBid()) return;

    const priceInWei = BigInt(Math.round(getPriceInETH() * 10 ** DECIMALS));

    if (isMultipleDate) {
      const timestamps = calculateDifferentHours(selectedDates, startDate!, endDate!);
      const totalValue = BigInt(energy) * priceInWei * BigInt(timestamps.length);

      writeContract({
        abi: EnergyBiddingMarketAbi.abi,
        address: energyMarketAddress!,
        functionName: "placeMultipleBids",
        value: totalValue,
        args: [timestamps, energy],
      });
    } else {
      const startTimestamp = startDate!.getTime() / 1000;
      const endTimestamp = endDate!.getTime() / 1000;
      const hours = calculateExactHours();

      if (hours === 1) {
        writeContract({
          abi: EnergyBiddingMarketAbi.abi,
          address: energyMarketAddress!,
          functionName: "placeBid",
          value: BigInt(energy) * priceInWei,
          args: [startTimestamp, energy],
        });
      } else {
        writeContract({
          abi: EnergyBiddingMarketAbi.abi,
          address: energyMarketAddress!,
          functionName: "placeMultipleBids",
          value: BigInt(energy) * priceInWei * BigInt(hours),
          args: [startTimestamp, endTimestamp, energy],
        });
      }
    }
  };

  const clearSelection = () => {
    setSelectedDates([]);
    setStartDate(getNextHour(1));
    setEndDate(getNextHour(2));
  };

  // Effects
  useEffect(() => {
    if (isConnected && isConfirmed) {
      refetchBalance();
      toast({
        title: "Bid Placed Successfully!",
        description: "Your energy bid has been submitted.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [isConfirmed, isConnected, refetchBalance, toast]);

  const isLoading = isWritePending || isConfirming;
  const needsConnection = !isConnected || (chainId && defaultChain.id !== chainId);

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-4xl">
      {/* Date Selection Card */}
      <Card className="flex-1" padding="lg">
        <CardHeader
          title="Select Time Period"
          subtitle="Choose when you want to buy energy"
          icon={<Calendar size={20} />}
        />

        {/* Toggle: Range vs Multiple */}
        <div className="flex items-center justify-center gap-4 p-4 bg-white/5 rounded-xl mb-6">
          <span
            className={`text-sm font-medium ${!isMultipleDate ? "text-white" : "text-gray-400"}`}
          >
            Date Range
          </span>
          <Switch
            isChecked={isMultipleDate}
            onChange={() => {
              clearSelection();
              setIsMultipleDate(!isMultipleDate);
            }}
            colorScheme="blue"
            size="lg"
          />
          <span
            className={`text-sm font-medium ${isMultipleDate ? "text-white" : "text-gray-400"}`}
          >
            Multiple Dates
          </span>
        </div>

        {/* Date Picker */}
        <div className="bg-white/5 rounded-xl p-4">
          {isMultipleDate ? (
            <DateMultiplePicker
              selectedDates={selectedDates}
              setSelectedDates={setSelectedDates}
              startTime={startDate}
              setStartTime={setStartDate}
              endTime={endDate}
              setEndTime={setEndDate}
            />
          ) : (
            <DateRangePicker
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
            />
          )}
        </div>

        <div className="mt-4 flex justify-center">
          <Button variant="ghost" onClick={clearSelection}>
            Clear Selection
          </Button>
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
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </CardSection>

        {/* Price Input */}
        <CardSection className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-400">Price per kWh</label>
            <button
              onClick={() => setIsPriceInEUR(!isPriceInEUR)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <ArrowLeftRight size={14} />
              <span className="text-xs">{isPriceInEUR ? "EUR" : "ETH"}</span>
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
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

        {/* Balance Display */}
        {isConnected && (
          <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
            <span>Your Balance:</span>
            {isBalanceLoading ? (
              <Spinner size="xs" />
            ) : balance ? (
              <span className="text-white font-medium">
                {(Number(balance.value) / 10 ** DECIMALS).toFixed(6)} ETH
              </span>
            ) : (
              <span>-</span>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="p-4 bg-white/5 rounded-xl space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400 flex items-center gap-2">
              <Clock size={14} />
              Bidding for
            </span>
            <span className="font-semibold text-white">
              {calculateExactHours()} {calculateExactHours() === 1 ? "hour" : "hours"}
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
            disabled={isLoading || energy <= 0 || calculateExactHours() === 0}
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
