import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  useAccount,
  usePublicClient,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { ClipboardList, Check, AlertCircle, X, ChevronDown, Filter, ArrowUpDown, Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { motion, AnimatePresence } from "motion/react";

import EnergyBiddingMarketAbi from "@/../abi/EnergyBiddingMarket.json";
import { DECIMALS, defaultChain } from "@/config";
import { useAppContext } from "@/context/AppContext";
import { useMarketToast } from "@/hooks/useMarketToast";
import ConnectAndSwitchNetworkButton from "@/components/common/ConnectAndSwitchNetworkButton";
import DateNavigationBar from "@/components/common/DateNavigationBar";
import { Card, CardHeader, Button, Badge, EmptyState, SkeletonBlock, type TransactionStatus } from "@/components/ui";
import { getTimestampsForDay, formatTime } from "@/utils/dateHelpers";
import { wattsToKWh, pricePerWattToPerKWh } from "@/utils/units";
import { AbiFunction } from "viem";

type StatusFilter = "all" | "active" | "settled" | "canceled";
type SortMode = "time" | "amount";

// Order Item Components
interface OrderItemProps {
  type: "bid" | "ask";
  time: number;
  index?: number;
  amount: bigint;
  price?: bigint;
  settled: boolean;
  canceled?: boolean;
  isRefunded?: boolean;
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
  isRefunded,
  matchedAmount,
  isMarketCleared,
  clearingPrice,
  ethPrice,
  onCancel,
  onClearMarket,
  isLoading,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isMarketClearingAllowed = Date.now() / 1000 - time >= 3600;
  const isBid = type === "bid";

  const getStatus = () => {
    if (canceled) return { label: "Canceled", variant: "error" as const, icon: <X size={12} /> };

    if (isBid) {
      // Check refunded status from on-chain events first (most reliable)
      if (isRefunded) {
        return { label: "Refunded", variant: "warning" as const, icon: null };
      }
      // Bids with settled=true and not refunded are matched
      if (settled && price !== undefined && clearingPrice !== undefined && price >= clearingPrice && clearingPrice > 0n) {
        return { label: "Settled", variant: "success" as const, icon: <Check size={12} /> };
      }
      if (settled && (price === undefined || clearingPrice === undefined || price < clearingPrice || clearingPrice === 0n)) {
        return { label: "Refunded", variant: "warning" as const, icon: null };
      }
      if (!settled && isMarketCleared) return { label: "Unsettled", variant: "error" as const, icon: <AlertCircle size={12} /> };
      return { label: "Pending", variant: "info" as const, icon: null };
    }

    // Asks: derive from matchedAmount (settled no longer written by contract)
    if (isMarketCleared) {
      if (matchedAmount && matchedAmount === amount) {
        return { label: "Settled", variant: "success" as const, icon: <Check size={12} /> };
      }
      if (matchedAmount && matchedAmount > 0n) {
        return { label: "Partial", variant: "warning" as const, icon: null };
      }
      return { label: "Unsettled", variant: "error" as const, icon: <AlertCircle size={12} /> };
    }
    return { label: "Pending", variant: "info" as const, icon: null };
  };

  const status = getStatus();

  // Display values in kWh (contract stores Watts)
  const amountKWh = wattsToKWh(amount);
  const matchedKWh = matchedAmount ? wattsToKWh(matchedAmount) : 0;
  const pricePerKWh = price ? pricePerWattToPerKWh(price) : 0;
  const clearingPricePerKWh = clearingPrice ? pricePerWattToPerKWh(clearingPrice) : 0;
  // Total value = amount(W) * price(wei/W) / 1e18 — same in both unit systems
  const totalValueETH = price ? (Number(price) / 10 ** DECIMALS) * Number(amount) : 0;

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
        {/* Header row - clickable to expand */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
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
            {/* Amount preview */}
            <span className={`text-sm font-bold ${isBid ? "text-blue-400" : "text-emerald-400"}`}>
              {amountKWh % 1 === 0 ? amountKWh.toString() : amountKWh.toFixed(3)} kWh
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={status.variant}>{status.label}</Badge>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown size={16} className="text-gray-500" />
            </motion.div>
          </div>
        </button>

        {/* Collapsible details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {/* Main content grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mt-4 pt-3 border-t border-white/5">
                {/* Price per kWh */}
                {price && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Price/kWh</p>
                    <p className="text-sm font-semibold text-white">
                      {pricePerKWh.toFixed(6)} ETH
                    </p>
                    {ethPrice && (
                      <p className="text-xs text-gray-500">
                        ~{"\u20AC"}{(pricePerKWh * ethPrice).toFixed(4)}
                      </p>
                    )}
                  </div>
                )}

                {/* Total value for bids */}
                {isBid && price && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Total Value</p>
                    <p className="text-sm font-semibold text-white">
                      {totalValueETH.toFixed(6)} ETH
                    </p>
                    {ethPrice && (
                      <p className="text-xs text-gray-500">
                        ~{"\u20AC"}{(totalValueETH * ethPrice).toFixed(2)}
                      </p>
                    )}
                  </div>
                )}

                {/* Matched amount for asks */}
                {!isBid && matchedAmount !== undefined && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Sold</p>
                    <p className="text-sm font-semibold text-emerald-400">
                      {matchedKWh % 1 === 0 ? matchedKWh.toString() : matchedKWh.toFixed(3)} kWh
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
                        {clearingPricePerKWh.toFixed(6)}
                      </span>
                      <span className="text-sm text-gray-400">ETH/kWh</span>
                      {ethPrice && (
                        <span className="text-xs text-gray-500">
                          (~{"\u20AC"}{(clearingPricePerKWh * ethPrice).toFixed(4)})
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              {!canceled && !isMarketCleared && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-white/10" onClick={(e) => e.stopPropagation()}>
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
            </motion.div>
          )}
        </AnimatePresence>
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

// Bid with its global index preserved for correct cancelBid calls
interface IndexedBid {
  globalIndex: number;
  bidder: string;
  amount: bigint;
  price: bigint;
  settled: boolean;
  canceled: boolean;
}

// Main Component
const CombinedOrdersBox: React.FC = () => {
  const { isConnected, address, chainId } = useAccount();
  const { ethPrice, energyMarketAddress } = useAppContext();
  const publicClient = usePublicClient();
  const toast = useMarketToast();

  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [activeOrderIndex, setActiveOrderIndex] = useState<string | null>(null);
  const [refundedBidKeys, setRefundedBidKeys] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("time");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txError, setTxError] = useState<string | undefined>();
  const [txType, setTxType] = useState<"cancel" | "clear">("cancel");

  const timestamps = getTimestampsForDay(selectedDay);

  // Contract read configs
  const createContractConfig = useCallback(
    (functionName: string, args: unknown[]) => ({
      abi: EnergyBiddingMarketAbi as AbiFunction[],
      address: energyMarketAddress,
      functionName,
      args,
    }),
    [energyMarketAddress]
  );

  // Fix #1: Use getBidsByHour instead of getBidsByAddress to preserve global indices
  const bidsConfig = timestamps.map((ts) => createContractConfig("getBidsByHour", [ts]));
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

  // Fix #1: Filter bids client-side, preserving global indices
  const userBidsByHour = useMemo(() => {
    if (!bids || !address) return [];
    return bids.map((bidResult) => {
      const allBids = (bidResult.result as any[]) || [];
      return allBids
        .map((bid, globalIndex): IndexedBid => ({
          globalIndex,
          bidder: bid.bidder,
          amount: bid.amount,
          price: bid.price,
          settled: bid.settled,
          canceled: bid.canceled,
        }))
        .filter((bid) => bid.bidder?.toLowerCase() === address.toLowerCase());
    });
  }, [bids, address]);

  // Fix #3: Fetch BidRefunded events to distinguish refunded from settled bids
  useEffect(() => {
    if (!publicClient || !energyMarketAddress || !address) return;

    const fetchRefundedBids = async () => {
      try {
        const events = await publicClient.getContractEvents({
          address: energyMarketAddress,
          abi: EnergyBiddingMarketAbi as any,
          eventName: "BidRefunded",
          args: { bidder: address },
        });
        const keys = new Set(
          events.map((e: any) => `${e.args.hour}-${e.args.index}`)
        );
        setRefundedBidKeys(keys);
      } catch (err) {
        console.error("Failed to fetch BidRefunded events:", err);
      }
    };

    fetchRefundedBids();
  }, [publicClient, energyMarketAddress, address, isConfirmed, selectedDay]);

  useEffect(() => {
    if (isConnected) refetchAll();
  }, [isConnected, selectedDay, refetchAll]);

  // Update modal status based on transaction state
  useEffect(() => {
    if (isConfirmed) {
      toast.success("Transaction Successful");
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed, refetchAll]);

  // Fix #1: Pass global index to cancelBid
  const handleCancelBid = (timestamp: number, globalIndex: number) => {
    if (!energyMarketAddress) return;
    setActiveOrderIndex(`bid-${timestamp}-${globalIndex}`);
    writeContract({
      abi: EnergyBiddingMarketAbi as AbiFunction[],
      address: energyMarketAddress,
      functionName: "cancelBid",
      args: [timestamp, globalIndex],
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
      abi: EnergyBiddingMarketAbi as AbiFunction[],
      address: energyMarketAddress,
      functionName: "clearMarket",
      args: [timestamp],
    });
  };

  const isLoading = isBidsLoading || isAsksLoading;
  const needsConnection = !isConnected || (chainId && defaultChain.id !== chainId);

  // Count orders
  const bidCount = userBidsByHour.reduce((acc, hourBids) => acc + hourBids.length, 0);
  const askCount = asks?.reduce((acc, a) => acc + ((a.result as any[])?.length ?? 0), 0) ?? 0;

  return (
      <div className="w-full max-w-4xl">
        <Card padding="lg">
          <CardHeader
            title="My Orders"
            subtitle="View and manage your bids and asks"
            icon={<ClipboardList size={20} />}
          />

        <DateNavigationBar selectedDay={selectedDay} onDayChange={setSelectedDay} />

        {/* Filter / Sort Bar */}
        {!needsConnection && (
          <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-white/5 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Filter size={14} />
              <span>Status:</span>
            </div>
            <div className="flex gap-1">
              {(["all", "active", "settled", "canceled"] as StatusFilter[]).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    statusFilter === filter
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent"
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
            <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />
            <button
              onClick={() => setSortMode(sortMode === "time" ? "amount" : "time")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all border border-transparent"
            >
              <ArrowUpDown size={14} />
              Sort: {sortMode === "time" ? "Time" : "Amount"}
            </button>
          </div>
        )}

        {needsConnection ? (
          <div className="py-8">
            <ConnectAndSwitchNetworkButton />
          </div>
        ) : isLoading ? (
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <div className="space-y-3">
              <SkeletonBlock height="3rem" rounded="xl" />
              <SkeletonBlock height="5rem" rounded="xl" />
              <SkeletonBlock height="5rem" rounded="xl" />
              <SkeletonBlock height="5rem" rounded="xl" />
            </div>
            <div className="space-y-3">
              <SkeletonBlock height="3rem" rounded="xl" />
              <SkeletonBlock height="5rem" rounded="xl" />
              <SkeletonBlock height="5rem" rounded="xl" />
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            {/* Bids Column */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-blue-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-400 font-bold text-sm">B</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Buy Orders</h3>
                    <p className="text-xs text-gray-500">{bidCount} {bidCount === 1 ? "order" : "orders"}</p>
                  </div>
                </div>
                {/* Batch Cancel Button */}
                {bidCount > 0 && userBidsByHour.some((hourBids) =>
                  hourBids.some((bid) => !bid.canceled && !bid.settled)
                ) && (
                  <Button
                    size="sm"
                    variant="danger"
                    icon={<Trash2 size={14} />}
                    disabled={isWritePending || isConfirming}
                    onClick={() => {
                      // Cancel the first active (non-canceled, non-settled) bid
                      for (let i = 0; i < userBidsByHour.length; i++) {
                        for (const bid of userBidsByHour[i]) {
                          if (!bid.canceled && !bid.settled) {
                            handleCancelBid(timestamps[i], bid.globalIndex);
                            return;
                          }
                        }
                      }
                    }}
                  >
                    Cancel Active
                  </Button>
                )}
              </div>
              <div className="space-y-3 max-h-[350px] sm:max-h-[500px] overflow-y-auto">
                {userBidsByHour
                  .flatMap((hourBids, i) =>
                    hourBids.map((bid) => ({ bid, hourIndex: i }))
                  )
                  .filter(({ bid }) => {
                    if (statusFilter === "all") return true;
                    if (statusFilter === "canceled") return bid.canceled;
                    if (statusFilter === "settled") return bid.settled && !bid.canceled;
                    if (statusFilter === "active") return !bid.settled && !bid.canceled;
                    return true;
                  })
                  .sort((a, b) => {
                    if (sortMode === "amount") return Number(b.bid.amount) - Number(a.bid.amount);
                    return timestamps[a.hourIndex] - timestamps[b.hourIndex];
                  })
                  .map(({ bid, hourIndex: i }) => (
                    <OrderItem
                      key={`bid-${timestamps[i]}-${bid.globalIndex}`}
                      type="bid"
                      time={timestamps[i]}
                      index={bid.globalIndex}
                      amount={bid.amount}
                      price={bid.price}
                      settled={bid.settled}
                      canceled={bid.canceled}
                      isRefunded={refundedBidKeys.has(`${BigInt(timestamps[i])}-${BigInt(bid.globalIndex)}`)}
                      isMarketCleared={cleared?.[i]?.result as boolean}
                      clearingPrice={prices?.[i]?.result as bigint}
                      ethPrice={ethPrice}
                      onCancel={() => handleCancelBid(timestamps[i], bid.globalIndex)}
                      onClearMarket={() => handleClearMarket(timestamps[i])}
                      isLoading={
                        (isWritePending || isConfirming) &&
                        (activeOrderIndex === `bid-${timestamps[i]}-${bid.globalIndex}` ||
                          activeOrderIndex === `clear-${timestamps[i]}`)
                      }
                    />
                  ))
                }
                {bidCount === 0 && (
                  <EmptyState
                    icon={<ClipboardList size={20} className="text-blue-500/50" />}
                    iconColorClass="bg-blue-500/10"
                    title="No buy orders for this day"
                    subtitle="Place a bid to get started"
                  />
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
              <div className="space-y-3 max-h-[350px] sm:max-h-[500px] overflow-y-auto">
                {asks
                  ?.flatMap((askResult, i) =>
                    ((askResult.result as any[]) || []).map((ask, j) => ({ ask, hourIndex: i, askIndex: j }))
                  )
                  .filter(({ ask }) => {
                    if (statusFilter === "all") return true;
                    const isSettled = ask.matchedAmount && ask.matchedAmount === ask.amount;
                    if (statusFilter === "settled") return isSettled;
                    if (statusFilter === "active") return !isSettled;
                    if (statusFilter === "canceled") return false;
                    return true;
                  })
                  .sort((a, b) => {
                    if (sortMode === "amount") return Number(b.ask.amount) - Number(a.ask.amount);
                    return timestamps[a.hourIndex] - timestamps[b.hourIndex];
                  })
                  .map(({ ask, hourIndex: i, askIndex: j }) => (
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
                }
                {askCount === 0 && (
                  <EmptyState
                    icon={<ClipboardList size={20} className="text-emerald-500/50" />}
                    iconColorClass="bg-emerald-500/10"
                    title="No sell orders for this day"
                    subtitle="List energy to sell"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CombinedOrdersBox;
