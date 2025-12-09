import React, { useEffect, useState, useCallback } from "react";
import {
  useAccount,
  useBalance,
  useWaitForTransactionReceipt,
  useWriteContract,
  useReadContract,
} from "wagmi";
import { Zap, ArrowLeftRight, Calendar, Clock, Info, AlertCircle } from "lucide-react";
import { Spinner, Switch } from "@chakra-ui/react";
import Image from "next/image";

import EnergyBiddingMarketAbi from "@/../abi/EnergyBiddingMarket.json";
import { DECIMALS, defaultChain } from "@/config";
import { useAppContext } from "@/context/AppContext";
import DateMultiplePicker from "@/components/common/DateMultiplePicker";
import DateRangePicker from "@/components/common/DateRangePicker";
import ConnectAndSwitchNetworkButton from "@/components/common/ConnectAndSwitchNetworkButton";
import { Card, CardHeader, CardSection, Button } from "@/components/ui";
import { TransactionModal, TransactionStatus } from "@/components/ui/TransactionModal";

const BidBox: React.FC = () => {
  const { isConnected, address, chainId } = useAccount();
  const { ethPrice, energyMarketAddress } = useAppContext();

  // Form state
  const [energy, setEnergy] = useState<number>(0);
  const [pricePerKwhInput, setPricePerKwhInput] = useState<string>("");
  const [isPriceInEUR, setIsPriceInEUR] = useState<boolean>(true);
  const [isMultipleDate, setIsMultipleDate] = useState<boolean>(false);
  const [hasInitializedPrice, setHasInitializedPrice] = useState<boolean>(false);

  // Parse the price input to a number for calculations
  const pricePerKwh = parseFloat(pricePerKwhInput) || 0;

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txError, setTxError] = useState<string | undefined>();

  // Validation state
  const [validationError, setValidationError] = useState<string | null>(null);

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
  const { data: hash, isPending: isWritePending, writeContract, error: writeError, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({ hash });

  const {
    data: balance,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useBalance({ address });

  // Read MIN_PRICE from contract
  const { data: minPriceData } = useReadContract(
    energyMarketAddress
      ? {
          abi: EnergyBiddingMarketAbi.abi,
          address: energyMarketAddress,
          functionName: "MIN_PRICE",
        }
      : undefined
  );

  // Set default price to MIN_PRICE converted to EUR when data is available
  useEffect(() => {
    if (minPriceData && ethPrice && !hasInitializedPrice) {
      const minPriceInETH = Number(minPriceData) / 10 ** DECIMALS;
      const minPriceInEUR = minPriceInETH * ethPrice;
      setPricePerKwhInput(minPriceInEUR.toString());
      setHasInitializedPrice(true);
    }
  }, [minPriceData, ethPrice, hasInitializedPrice]);

  // Update modal status based on transaction state
  useEffect(() => {
    if (isWritePending) {
      setTxStatus("pending");
    } else if (isConfirming) {
      setTxStatus("confirming");
    } else if (isConfirmed) {
      setTxStatus("success");
      refetchBalance();
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
  }, [isWritePending, isConfirming, isConfirmed, writeError, confirmError, refetchBalance]);

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

  // Live validation
  useEffect(() => {
    const now = new Date();

    if (energy <= 0) {
      setValidationError(null); // Don't show error for initial state
      return;
    }

    if (!isMultipleDate && startDate && startDate <= now) {
      setValidationError("Start time must be in the future");
      return;
    }

    if (!isMultipleDate && startDate && endDate && endDate <= startDate) {
      setValidationError("End time must be after start time");
      return;
    }

    if (isMultipleDate && selectedDates.length === 0) {
      setValidationError("Select at least one date");
      return;
    }

    if (calculateExactHours() > 400) {
      setValidationError("Maximum 400 hours per transaction");
      return;
    }

    if (!energyMarketAddress) {
      setValidationError("Please select a region first");
      return;
    }

    setValidationError(null);
  }, [energy, startDate, endDate, isMultipleDate, selectedDates, energyMarketAddress, calculateExactHours]);

  // Submit handler
  const handleBid = async () => {
    if (validationError || energy <= 0) return;

    // Open modal and reset state
    setIsModalOpen(true);
    setTxStatus("idle");
    setTxError(undefined);
    resetWrite();

    const priceInWei = BigInt(Math.round(getPriceInETH() * 10 ** DECIMALS));

    try {
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
    } catch (err) {
      setTxStatus("error");
      setTxError("Failed to initiate transaction");
    }
  };

  const clearSelection = () => {
    setSelectedDates([]);
    setStartDate(getNextHour(1));
    setEndDate(getNextHour(2));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    if (txStatus === "success") {
      // Reset form on success
      setEnergy(0);
      clearSelection();
    }
    setTimeout(() => {
      setTxStatus("idle");
      setTxError(undefined);
    }, 300);
  };

  const isLoading = isWritePending || isConfirming;
  const needsConnection = !isConnected || (chainId && defaultChain.id !== chainId);
  const canSubmit = !validationError && energy > 0 && calculateExactHours() > 0 && !isLoading;

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 w-full max-w-4xl">
        {/* Date Selection Card */}
        <Card className="flex-1" padding="lg">
          <CardHeader
            title="Select Time Period"
            subtitle="Choose when you want to buy energy"
            icon={<Calendar size={20} />}
          />

          {/* Toggle: Range vs Multiple */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 rounded-xl mb-4 md:mb-6">
            <span
              className={`text-xs sm:text-sm font-medium transition-colors ${!isMultipleDate ? "text-white" : "text-gray-400"}`}
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
              className={`text-xs sm:text-sm font-medium transition-colors ${isMultipleDate ? "text-white" : "text-gray-400"}`}
            >
              Multiple Dates
            </span>
          </div>

          {/* Date Picker */}
          <div className="bg-white/5 rounded-xl p-3 sm:p-4">
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
            <Button variant="ghost" size="sm" onClick={clearSelection}>
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
          <CardSection title="Energy Amount" className="mb-4 md:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex-shrink-0">
                <Image src="/energy.png" alt="Energy" width={20} height={20} className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-[10px] sm:text-xs font-medium text-amber-400">kWh</span>
              </div>
              <input
                type="number"
                value={energy || ""}
                onChange={(e) => setEnergy(Math.max(0, parseFloat(e.target.value) || 0))}
                min={0}
                placeholder="0"
                className="flex-1 px-3 sm:px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base sm:text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
              />
            </div>
            {/* Quick amount buttons */}
            <div className="flex gap-2 mt-3">
              {[10, 50, 100, 500].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setEnergy(amount)}
                  className={`
                    flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all
                    ${energy === amount
                      ? "bg-blue-500 text-white"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                    }
                  `}
                >
                  {amount}
                </button>
              ))}
            </div>
          </CardSection>

          {/* Price Input */}
          <CardSection className="mb-4 md:mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-400">Price per kWh</label>
              <button
                onClick={() => {
                  if (ethPrice && pricePerKwh > 0) {
                    // Convert the price to the other currency before switching
                    if (isPriceInEUR) {
                      // Currently EUR, switching to ETH
                      setPricePerKwhInput((pricePerKwh / ethPrice).toString());
                    } else {
                      // Currently ETH, switching to EUR
                      setPricePerKwhInput((pricePerKwh * ethPrice).toString());
                    }
                  }
                  setIsPriceInEUR(!isPriceInEUR);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ArrowLeftRight size={14} />
                <span className="text-xs">Switch to {isPriceInEUR ? "ETH" : "EUR"}</span>
              </button>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl flex-shrink-0">
                <Image
                  src={isPriceInEUR ? "/eur.png" : "/eth.png"}
                  alt={isPriceInEUR ? "EUR" : "ETH"}
                  width={20}
                  height={20}
                  className="w-5 h-5 sm:w-6 sm:h-6"
                />
                <span className="text-[10px] sm:text-xs font-medium text-blue-400 uppercase">
                  {isPriceInEUR ? "EUR" : "ETH"}
                </span>
              </div>
              <div className="relative flex-1 min-w-0">
                <input
                  type="text"
                  inputMode="decimal"
                  value={pricePerKwhInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Allow empty, numbers, and decimals
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      setPricePerKwhInput(value);
                    }
                  }}
                  placeholder="0"
                  className="w-full px-3 sm:px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base sm:text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500"
                />
              </div>
            </div>
            {ethPrice && pricePerKwh > 0 && (
              <div className="mt-2 text-[10px] sm:text-xs text-gray-500 text-right">
                {isPriceInEUR
                  ? `≈ ${getPriceInETH().toFixed(8)} ETH`
                  : `≈ ${getPriceInEUR().toFixed(2)} EUR`}
              </div>
            )}
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

          {/* Validation Error */}
          {validationError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-red-400">{validationError}</p>
            </div>
          )}

          {/* Summary */}
          <div className="p-3 sm:p-4 bg-white/5 rounded-xl space-y-3 mb-4 md:mb-6">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-400 flex items-center gap-2">
                <Clock size={14} />
                Bidding for
              </span>
              <span className="font-semibold text-white text-sm sm:text-base">
                {calculateExactHours()} {calculateExactHours() === 1 ? "hour" : "hours"}
              </span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-400">Total Cost</span>
              <div className="text-right">
                <div className="font-bold text-base sm:text-lg text-white">
                  {getTotalCost().toFixed(6)} ETH
                </div>
                {ethPrice && (
                  <div className="text-[10px] sm:text-xs text-gray-500">
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
              disabled={!canSubmit}
            >
              {isLoading ? "Processing..." : "Submit Bid"}
            </Button>
          )}

          {/* Info Note */}
          <div className="mt-4 flex items-start gap-2 text-[10px] sm:text-xs text-gray-500">
            <Info size={14} className="mt-0.5 flex-shrink-0" />
            <p>
              Your bid will be submitted to the energy market. If matched, you will receive energy
              credits at the clearing price.
            </p>
          </div>
        </Card>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        status={txStatus}
        hash={hash}
        error={txError}
        details={{
          type: "bid",
          amount: energy,
          hours: calculateExactHours(),
          totalCost: getTotalCost().toFixed(6),
          currency: "ETH",
        }}
        onClose={closeModal}
        onRetry={handleBid}
      />
    </>
  );
};

export default BidBox;
