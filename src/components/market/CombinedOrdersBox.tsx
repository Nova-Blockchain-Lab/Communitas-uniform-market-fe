import React, { useEffect, useState, useCallback } from "react";
import {
  useAccount,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { ClipboardList, Calendar, ChevronLeft, ChevronRight, X, Check, AlertCircle } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { motion, AnimatePresence } from "framer-motion";
import "react-day-picker/dist/style.css";

import EnergyBiddingMarketAbi from "@/../abi/EnergyBiddingMarket.json";
import { DECIMALS, defaultChain } from "@/config";
import { useAppContext } from "@/context/AppContext";
import ConnectAndSwitchNetworkButton from "@/components/common/ConnectAndSwitchNetworkButton";
import { Card, CardHeader, Button, Badge, TransactionModal, TransactionStatus, Spinner } from "@/components/ui";
import { AbiFunction } from "viem";

// Helper functions
const getTimestampsForDay = (day: Date): number[] => {
  const timestamps: number[] = [];
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 0, 0, 0);
  for (let hour = new Date(start); hour <= end; hour.setHours(hour.getHours() + 1)) {
    timestamps.push(hour.getTime() / 1000);
  }
  return timestamps;
};

const formatTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

// Order Item Components
interface OrderItemProps {
  type: "bid" | "ask";
  time: number;
  index?: number;
  amount: bigint;
  price?: bigint;
  settled: boolean;
  canceled?: boolean;
  matchedAmount?: bigint;
  isMarketCleared?: boolean;
  clearingPrice?: bigint;
  ethPrice?: number;
  onCancel?: () => void;
  onClearMarket?: () => void;
  isLoading?: boolean;
}

const OrderItem: React.FC<OrderItemProps> = ({
  type,
  time,
  amount,
  price,
  settled,
  canceled,
  matchedAmount,
  isMarketCleared,
  clearingPrice,
  ethPrice,
  onCancel,
  onClearMarket,
  isLoading,
}) => {
  const isMarketClearingAllowed = Date.now() / 1000 - time >= 3600;
  const isBid = type === "bid";

  const getStatus = () => {
    if (canceled) return { label: "Canceled", variant: "error" as const, icon: <X size={12} /> };
    if (settled) return { label: "Settled", variant: "success" as const, icon: <Check size={12} /> };
    if (isMarketCleared) {
      if (type === "ask" && matchedAmount && matchedAmount > 0n && !settled) {
        return { label: "Partial", variant: "warning" as const, icon: null };
      }
      return { label: "Unsettled", variant: "error" as const, icon: <AlertCircle size={12} /> };
    }
    return { label: "Pending", variant: "info" as const, icon: null };
  };

  const status = getStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        relative overflow-hidden rounded-xl transition-all
        ${canceled ? "opacity-50" : ""}
      `}
    >
      {/* Colored left border accent */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isBid ? "bg-blue-500" : "bg-emerald-500"}`} />

      {/* Card content */}
      <div className={`
        pl-4 pr-4 py-4 ml-1
        ${isBid ? "bg-gradient-to-r from-blue-500/10 to-transparent" : "bg-gradient-to-r from-emerald-500/10 to-transparent"}
        border border-l-0 rounded-r-xl
        ${isBid ? "border-blue-500/20" : "border-emerald-500/20"}
      `}>
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Type badge */}
            <div className={`
              px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider
              ${isBid ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"}
            `}>
              {isBid ? "Buy" : "Sell"}
            </div>
            {/* Time */}
            <span className="text-sm font-medium text-white">{formatTime(time)}</span>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {/* Amount - Primary highlight */}
          <div className="col-span-2 flex items-baseline gap-2 mb-2">
            <span className={`text-2xl font-bold ${isBid ? "text-blue-400" : "text-emerald-400"}`}>
              {amount.toString()}
            </span>
            <span className="text-sm font-medium text-gray-400">kWh</span>
          </div>

          {/* Price per kWh */}
          {price && (
            <div>
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Price/kWh</p>
              <p className="text-sm font-semibold text-white">
                {(Number(price) / 10 ** DECIMALS).toFixed(6)} ETH
              </p>
              {ethPrice && (
                <p className="text-xs text-gray-500">
                  ~€{((Number(price) / 10 ** DECIMALS) * ethPrice).toFixed(4)}
                </p>
              )}
            </div>
          )}

          {/* Total value for bids */}
          {isBid && price && (
            <div>
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Total Value</p>
              <p className="text-sm font-semibold text-white">
                {((Number(price) / 10 ** DECIMALS) * Number(amount)).toFixed(6)} ETH
              </p>
              {ethPrice && (
                <p className="text-xs text-gray-500">
                  ~€{(((Number(price) / 10 ** DECIMALS) * Number(amount)) * ethPrice).toFixed(2)}
                </p>
              )}
            </div>
          )}

          {/* Matched amount for asks */}
          {!isBid && matchedAmount !== undefined && (
            <div>
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Sold</p>
              <p className="text-sm font-semibold text-emerald-400">
                {matchedAmount.toString()} kWh
              </p>
              {Number(amount) > 0 && (
                <p className="text-xs text-gray-500">
                  {Math.round((Number(matchedAmount) / Number(amount)) * 100)}% filled
                </p>
              )}
            </div>
          )}

          {/* Clearing price */}
          {isMarketCleared && clearingPrice && Number(clearingPrice) > 0 && (
            <div className="col-span-2 mt-2 pt-3 border-t border-white/10">
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Clearing Price</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-amber-400">
                  {(Number(clearingPrice) / 10 ** DECIMALS).toFixed(6)}
                </span>
                <span className="text-sm text-gray-400">ETH/kWh</span>
                {ethPrice && (
                  <span className="text-xs text-gray-500">
                    (~€{((Number(clearingPrice) / 10 ** DECIMALS) * ethPrice).toFixed(4)})
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {!canceled && !isMarketCleared && (
          <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
            {isMarketClearingAllowed && onClearMarket && (
              <Button
                size="sm"
                variant="secondary"
                onClick={onClearMarket}
                loading={isLoading}
                disabled={isLoading}
              >
                Clear Market
              </Button>
            )}
            {isBid && onCancel && (
              <Button
                size="sm"
                variant="danger"
                onClick={onCancel}
                loading={isLoading}
                disabled={isLoading}
                icon={<X size={14} />}
              >
                Cancel Bid
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Canceled diagonal banner */}
      {canceled && (
        <div className="absolute top-3 right-3">
          <div className="px-3 py-1 bg-red-500/90 text-white text-xs font-bold rounded-md uppercase">
            Canceled
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Main Component
const CombinedOrdersBox: React.FC = () => {
  const { isConnected, address, chainId } = useAccount();
  const { ethPrice, energyMarketAddress } = useAppContext();

  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [activeOrderIndex, setActiveOrderIndex] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txError, setTxError] = useState<string | undefined>();
  const [txType, setTxType] = useState<"cancel" | "clear">("cancel");

  const timestamps = getTimestampsForDay(selectedDay);

  // Contract read configs
  const createContractConfig = useCallback(
    (functionName: string, args: unknown[]) => ({
      abi: EnergyBiddingMarketAbi.abi as AbiFunction[],
      address: energyMarketAddress,
      functionName,
      args,
    }),
    [energyMarketAddress]
  );

  const bidsConfig = timestamps.map((ts) => createContractConfig("getBidsByAddress", [ts, address]));
  const asksConfig = timestamps.map((ts) => createContractConfig("getAsksByAddress", [ts, address]));
  const clearedConfig = timestamps.map((ts) => createContractConfig("isMarketCleared", [ts]));
  const priceConfig = timestamps.map((ts) => createContractConfig("getClearingPrice", [ts]));

  const { data: bids, isPending: isBidsLoading, refetch: refetchBids } = useReadContracts({
    contracts: chainId === defaultChain.id ? bidsConfig : [],
  });
  const { data: asks, isPending: isAsksLoading, refetch: refetchAsks } = useReadContracts({
    contracts: chainId === defaultChain.id ? asksConfig : [],
  });
  const { data: cleared, refetch: refetchCleared } = useReadContracts({
    contracts: chainId === defaultChain.id ? clearedConfig : [],
  });
  const { data: prices, refetch: refetchPrices } = useReadContracts({
    contracts: chainId === defaultChain.id ? priceConfig : [],
  });

  // Write contract for actions
  const { data: hash, isPending: isWritePending, writeContract, error: writeError, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({ hash });

  const refetchAll = useCallback(() => {
    refetchBids();
    refetchAsks();
    refetchCleared();
    refetchPrices();
  }, [refetchBids, refetchAsks, refetchCleared, refetchPrices]);

  useEffect(() => {
    if (isConnected) refetchAll();
  }, [isConnected, selectedDay, refetchAll]);

  // Update modal status based on transaction state
  useEffect(() => {
    if (isWritePending) {
      setTxStatus("pending");
    } else if (isConfirming) {
      setTxStatus("confirming");
    } else if (isConfirmed) {
      setTxStatus("success");
      setActiveOrderIndex(null);
      refetchAll();
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
  }, [isWritePending, isConfirming, isConfirmed, writeError, confirmError, refetchAll]);

  const handleCancelBid = (timestamp: number, index: number) => {
    if (!energyMarketAddress) return;
    setActiveOrderIndex(`bid-${timestamp}-${index}`);
    setTxType("cancel");
    setIsModalOpen(true);
    setTxStatus("idle");
    setTxError(undefined);
    resetWrite();

    writeContract({
      abi: EnergyBiddingMarketAbi.abi as AbiFunction[],
      address: energyMarketAddress,
      functionName: "cancelBid",
      args: [timestamp, index],
    });
  };

  const handleClearMarket = (timestamp: number) => {
    if (!energyMarketAddress) return;
    setActiveOrderIndex(`clear-${timestamp}`);
    setTxType("clear");
    setIsModalOpen(true);
    setTxStatus("idle");
    setTxError(undefined);
    resetWrite();

    writeContract({
      abi: EnergyBiddingMarketAbi.abi as AbiFunction[],
      address: energyMarketAddress,
      functionName: "clearMarket",
      args: [timestamp],
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setTxStatus("idle");
      setTxError(undefined);
    }, 300);
  };

  // Navigation
  const goToPreviousDay = () => {
    const prev = new Date(selectedDay);
    prev.setDate(prev.getDate() - 1);
    setSelectedDay(prev);
  };

  const goToNextDay = () => {
    const next = new Date(selectedDay);
    next.setDate(next.getDate() + 1);
    setSelectedDay(next);
  };

  const goToToday = () => setSelectedDay(new Date());

  const isLoading = isBidsLoading || isAsksLoading;
  const needsConnection = !isConnected || (chainId && defaultChain.id !== chainId);

  // Count orders
  const bidCount = bids?.reduce((acc, b) => acc + (b.result as any[])?.length || 0, 0) || 0;
  const askCount = asks?.reduce((acc, a) => acc + (a.result as any[])?.length || 0, 0) || 0;

  return (
    <>
      <div className="w-full max-w-4xl">
        <Card padding="lg">
          <CardHeader
            title="My Orders"
            subtitle="View and manage your bids and asks"
            icon={<ClipboardList size={20} />}
          />

          {/* Date Navigation */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl mb-6">
            <button
              onClick={goToPreviousDay}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsCalendarOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Calendar size={18} className="text-gray-400" />
                <span className="text-white font-medium">
                  {selectedDay.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </button>
              {selectedDay.toDateString() !== new Date().toDateString() && (
                <button
                  onClick={goToToday}
                  className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  Today
                </button>
              )}
            </div>

            <button
              onClick={goToNextDay}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Calendar Modal */}
          <AnimatePresence>
            {isCalendarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                onClick={() => setIsCalendarOpen(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-gray-900 border border-white/10 rounded-2xl p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Select Date</h3>
                    <button
                      onClick={() => setIsCalendarOpen(false)}
                      className="p-2 rounded-lg hover:bg-white/10 text-gray-400"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <DayPicker
                    showOutsideDays
                    mode="single"
                    selected={selectedDay}
                    onSelect={(day) => {
                      if (day) {
                        setSelectedDay(day);
                        setIsCalendarOpen(false);
                      }
                    }}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {needsConnection ? (
            <div className="py-8">
              <ConnectAndSwitchNetworkButton />
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" color="blue-400" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Bids Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-blue-500/20">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-400 font-bold text-sm">B</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Buy Orders</h3>
                    <p className="text-xs text-gray-500">{bidCount} {bidCount === 1 ? "order" : "orders"}</p>
                  </div>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {bids?.map((bidResult, i) =>
                    (bidResult.result as any[])?.map((bid, j) => (
                      <OrderItem
                        key={`bid-${timestamps[i]}-${j}`}
                        type="bid"
                        time={timestamps[i]}
                        index={j}
                        amount={bid.amount}
                        price={bid.price}
                        settled={bid.settled}
                        canceled={bid.canceled}
                        isMarketCleared={cleared?.[i]?.result as boolean}
                        clearingPrice={prices?.[i]?.result as bigint}
                        ethPrice={ethPrice}
                        onCancel={() => handleCancelBid(timestamps[i], j)}
                        onClearMarket={() => handleClearMarket(timestamps[i])}
                        isLoading={
                          (isWritePending || isConfirming) &&
                          (activeOrderIndex === `bid-${timestamps[i]}-${j}` ||
                            activeOrderIndex === `clear-${timestamps[i]}`)
                        }
                      />
                    ))
                  )}
                  {bidCount === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
                        <ClipboardList size={20} className="text-blue-500/50" />
                      </div>
                      <p className="text-sm text-gray-500">No buy orders for this day</p>
                      <p className="text-xs text-gray-600 mt-1">Place a bid to get started</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Asks Column */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-emerald-500/20">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <span className="text-emerald-400 font-bold text-sm">S</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Sell Orders</h3>
                    <p className="text-xs text-gray-500">{askCount} {askCount === 1 ? "order" : "orders"}</p>
                  </div>
                </div>
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {asks?.map((askResult, i) =>
                    (askResult.result as any[])?.map((ask, j) => (
                      <OrderItem
                        key={`ask-${timestamps[i]}-${j}`}
                        type="ask"
                        time={timestamps[i]}
                        amount={ask.amount}
                        settled={ask.settled}
                        matchedAmount={ask.matchedAmount}
                        isMarketCleared={cleared?.[i]?.result as boolean}
                        clearingPrice={prices?.[i]?.result as bigint}
                        ethPrice={ethPrice}
                        onClearMarket={() => handleClearMarket(timestamps[i])}
                        isLoading={
                          (isWritePending || isConfirming) &&
                          activeOrderIndex === `clear-${timestamps[i]}`
                        }
                      />
                    ))
                  )}
                  {askCount === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                        <ClipboardList size={20} className="text-emerald-500/50" />
                      </div>
                      <p className="text-sm text-gray-500">No sell orders for this day</p>
                      <p className="text-xs text-gray-600 mt-1">List energy to sell</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        status={txStatus}
        hash={hash}
        error={txError}
        details={{
          type: txType,
        }}
        onClose={closeModal}
      />
    </>
  );
};

export default CombinedOrdersBox;
