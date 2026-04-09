import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  useAccount,
  usePublicClient,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  ClipboardList,
  Check,
  AlertCircle,
  X,
  ChevronDown,
  Filter,
  ArrowUpDown,
  Trash2,
  ShoppingCart,
  Zap,
} from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { motion, AnimatePresence } from "motion/react";

import EnergyBiddingMarketAbi from "@/../abi/EnergyBiddingMarket.json";
import { DECIMALS, defaultChain } from "@/config";
import { useAppContext } from "@/context/AppContext";
import { useMarketToast } from "@/hooks/useMarketToast";
import ConnectAndSwitchNetworkButton from "@/components/common/ConnectAndSwitchNetworkButton";
import DateNavigationBar from "@/components/common/DateNavigationBar";
import { Card, CardHeader, Button, Badge, EmptyState, SkeletonBlock } from "@/components/ui";
import { getTimestampsForDay, formatTime } from "@/utils/dateHelpers";
import { wattsToKWh, pricePerWattToPerKWh } from "@/utils/units";
import { AbiFunction } from "viem";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type StatusFilter = "all" | "active" | "settled" | "canceled";
type SortMode = "time" | "amount";
type OrderType = "bid" | "ask";

interface StatusInfo {
  label: string;
  variant: "success" | "warning" | "error" | "info" | "neutral";
  icon: React.ReactNode;
}

interface OrderItemProps {
  type: OrderType;
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

/** Bid with its global index preserved for correct cancelBid calls */
interface IndexedBid {
  globalIndex: number;
  bidder: string;
  amount: bigint;
  price: bigint;
  settled: boolean;
  canceled: boolean;
}

interface FlatBid {
  bid: IndexedBid;
  hourIndex: number;
}

interface FlatAsk {
  ask: {
    amount: bigint;
    settled: boolean;
    matchedAmount?: bigint;
  };
  hourIndex: number;
  askIndex: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const formatKWh = (kWh: number): string =>
  kWh % 1 === 0 ? kWh.toString() : kWh.toFixed(3);

const getOrderStatus = (
  type: OrderType,
  settled: boolean,
  canceled: boolean | undefined,
  isRefunded: boolean | undefined,
  price: bigint | undefined,
  clearingPrice: bigint | undefined,
  isMarketCleared: boolean | undefined,
  matchedAmount: bigint | undefined,
  amount: bigint,
): StatusInfo => {
  if (canceled) {
    return { label: "Canceled", variant: "error", icon: <X size={12} /> };
  }

  if (type === "bid") {
    if (isRefunded) {
      return { label: "Refunded", variant: "warning", icon: null };
    }
    if (
      settled &&
      price !== undefined &&
      clearingPrice !== undefined &&
      price >= clearingPrice &&
      clearingPrice > 0n
    ) {
      return { label: "Settled", variant: "success", icon: <Check size={12} /> };
    }
    if (
      settled &&
      (price === undefined ||
        clearingPrice === undefined ||
        price < clearingPrice ||
        clearingPrice === 0n)
    ) {
      return { label: "Refunded", variant: "warning", icon: null };
    }
    if (!settled && isMarketCleared) {
      return { label: "Unsettled", variant: "error", icon: <AlertCircle size={12} /> };
    }
    return { label: "Pending", variant: "info", icon: null };
  }

  // Asks
  if (isMarketCleared) {
    if (matchedAmount && matchedAmount === amount) {
      return { label: "Settled", variant: "success", icon: <Check size={12} /> };
    }
    if (matchedAmount && matchedAmount > 0n) {
      return { label: "Partial", variant: "warning", icon: null };
    }
    return { label: "Unsettled", variant: "error", icon: <AlertCircle size={12} /> };
  }
  return { label: "Pending", variant: "info", icon: null };
};

/* ------------------------------------------------------------------ */
/*  OrderItem                                                          */
/* ------------------------------------------------------------------ */

const OrderItem: React.FC<OrderItemProps> = React.memo(({
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

  const status = useMemo(
    () =>
      getOrderStatus(
        type,
        settled,
        canceled,
        isRefunded,
        price,
        clearingPrice,
        isMarketCleared,
        matchedAmount,
        amount,
      ),
    [type, settled, canceled, isRefunded, price, clearingPrice, isMarketCleared, matchedAmount, amount],
  );

  const amountKWh = useMemo(() => wattsToKWh(amount), [amount]);
  const matchedKWh = useMemo(() => (matchedAmount ? wattsToKWh(matchedAmount) : 0), [matchedAmount]);
  const pricePerKWh = useMemo(() => (price ? pricePerWattToPerKWh(price) : 0), [price]);
  const clearingPricePerKWh = useMemo(
    () => (clearingPrice ? pricePerWattToPerKWh(clearingPrice) : 0),
    [clearingPrice],
  );
  const totalValueETH = useMemo(
    () => (price ? (Number(price) / 10 ** DECIMALS) * Number(amount) : 0),
    [price, amount],
  );

  const handleToggle = useCallback(() => setIsExpanded((prev) => !prev), []);
  const stopPropagation = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

  const hasActions = !canceled && !isMarketCleared;
  const showClearMarket = hasActions && isMarketClearingAllowed && !!onClearMarket;
  const showCancelBid = hasActions && isBid && !!onCancel;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`
        relative overflow-hidden rounded-xl transition-shadow
        ${canceled ? "opacity-50" : "hover:shadow-lg"}
        ${isBid ? "hover:shadow-blue-500/5" : "hover:shadow-emerald-500/5"}
      `}
    >
      {/* Colored left border accent */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          isBid ? "bg-blue-500" : "bg-emerald-500"
        }`}
      />

      {/* Card content */}
      <div
        className={`
        pl-4 pr-3 sm:pr-4 py-3 sm:py-4 ml-1
        ${isBid ? "bg-gradient-to-r from-blue-500/10 to-transparent" : "bg-gradient-to-r from-emerald-500/10 to-transparent"}
        border border-l-0 rounded-r-xl
        ${isBid ? "border-blue-500/20" : "border-emerald-500/20"}
      `}
      >
        {/* Header row - clickable to expand */}
        <button
          onClick={handleToggle}
          className="flex items-center justify-between w-full text-left min-h-[44px] gap-2"
          aria-expanded={isExpanded}
        >
          {/* Left: type badge + key info */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Type badge */}
            <div
              className={`
              shrink-0 px-2.5 sm:px-3 py-1 rounded-lg text-[11px] sm:text-xs font-bold uppercase tracking-wider
              ${isBid ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"}
            `}
            >
              {isBid ? "Buy" : "Sell"}
            </div>
            {/* Time */}
            <span className="shrink-0 text-xs sm:text-sm font-medium text-white">
              {formatTime(time)}
            </span>
            {/* Amount - truncated on very small screens */}
            <span
              className={`text-xs sm:text-sm font-bold truncate ${
                isBid ? "text-blue-400" : "text-emerald-400"
              }`}
            >
              {formatKWh(amountKWh)} kWh
            </span>
          </div>

          {/* Right: status + chevron */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Badge variant={status.variant} size="sm" icon={status.icon}>
              <span className="hidden xs:inline">{status.label}</span>
              {/* On very small screens, just show the icon/dot */}
              <span className="inline xs:hidden">{status.label.slice(0, 3)}</span>
            </Badge>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0"
            >
              <ChevronDown size={16} className="text-gray-500" />
            </motion.div>
          </div>
        </button>

        {/* Collapsible details */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              {/* Scrollable detail grid for small screens */}
              <div className="overflow-x-auto -mx-1 px-1">
                <div className="grid grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-3 mt-3 sm:mt-4 pt-3 border-t border-white/5 min-w-0">
                  {/* Price per kWh */}
                  {price !== undefined && (
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1 uppercase tracking-wide">
                        Price/kWh
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-white">
                        {pricePerKWh.toFixed(6)} ETH
                      </p>
                      {ethPrice ? (
                        <p className="text-[10px] sm:text-xs text-gray-500">
                          ~{"\u20AC"}
                          {(pricePerKWh * ethPrice).toFixed(4)}
                        </p>
                      ) : null}
                    </div>
                  )}

                  {/* Total value for bids */}
                  {isBid && price !== undefined && (
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1 uppercase tracking-wide">
                        Total Value
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-white">
                        {totalValueETH.toFixed(6)} ETH
                      </p>
                      {ethPrice ? (
                        <p className="text-[10px] sm:text-xs text-gray-500">
                          ~{"\u20AC"}
                          {(totalValueETH * ethPrice).toFixed(2)}
                        </p>
                      ) : null}
                    </div>
                  )}

                  {/* Matched amount for asks */}
                  {!isBid && matchedAmount !== undefined && (
                    <div>
                      <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1 uppercase tracking-wide">
                        Sold
                      </p>
                      <p className="text-xs sm:text-sm font-semibold text-emerald-400">
                        {formatKWh(matchedKWh)} kWh
                      </p>
                      {Number(amount) > 0 && (
                        <div className="mt-1">
                          {/* Mini progress bar */}
                          <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.min(
                                  Math.round((Number(matchedAmount) / Number(amount)) * 100),
                                  100,
                                )}%`,
                              }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                              className="h-full rounded-full bg-emerald-500"
                            />
                          </div>
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                            {Math.round((Number(matchedAmount) / Number(amount)) * 100)}% filled
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Clearing price */}
                  {isMarketCleared && clearingPrice && Number(clearingPrice) > 0 && (
                    <div className="col-span-2 mt-1 sm:mt-2 pt-2 sm:pt-3 border-t border-white/10">
                      <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1 uppercase tracking-wide">
                        Clearing Price
                      </p>
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-base sm:text-lg font-bold text-amber-400">
                          {clearingPricePerKWh.toFixed(6)}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-400">ETH/kWh</span>
                        {ethPrice ? (
                          <span className="text-[10px] sm:text-xs text-gray-500">
                            (~{"\u20AC"}
                            {(clearingPricePerKWh * ethPrice).toFixed(4)})
                          </span>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {(showClearMarket || showCancelBid) && (
                <div
                  className="flex flex-wrap gap-2 mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-white/10"
                  onClick={stopPropagation}
                >
                  {showClearMarket && (
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
                  {showCancelBid && (
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

      {/* Canceled banner */}
      {canceled && (
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
          <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-red-500/90 text-white text-[10px] sm:text-xs font-bold rounded-md uppercase">
            Canceled
          </div>
        </div>
      )}
    </motion.div>
  );
});

OrderItem.displayName = "OrderItem";

/* ------------------------------------------------------------------ */
/*  Loading Skeleton                                                   */
/* ------------------------------------------------------------------ */

const OrdersSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
    {[0, 1].map((col) => (
      <div key={col} className="space-y-3">
        {/* Column header skeleton */}
        <div className="flex items-center gap-3 pb-3">
          <SkeletonBlock width="2rem" height="2rem" rounded="lg" />
          <div className="space-y-1.5 flex-1">
            <SkeletonBlock width="5rem" height="0.875rem" rounded="md" />
            <SkeletonBlock width="3rem" height="0.75rem" rounded="md" />
          </div>
        </div>
        {/* Order card skeletons */}
        {Array.from({ length: col === 0 ? 3 : 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl overflow-hidden border border-white/5"
          >
            <div className="px-4 py-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SkeletonBlock width="3rem" height="1.5rem" rounded="lg" />
                  <SkeletonBlock width="3.5rem" height="1rem" rounded="md" />
                  <SkeletonBlock width="4rem" height="1rem" rounded="md" />
                </div>
                <SkeletonBlock width="4rem" height="1.5rem" rounded="full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    ))}
  </div>
);

/* ------------------------------------------------------------------ */
/*  Column Header                                                      */
/* ------------------------------------------------------------------ */

interface ColumnHeaderProps {
  type: OrderType;
  count: number;
  action?: React.ReactNode;
}

const ColumnHeader: React.FC<ColumnHeaderProps> = React.memo(({ type, count, action }) => {
  const isBid = type === "bid";
  return (
    <div
      className={`flex items-center justify-between pb-3 border-b ${
        isBid ? "border-blue-500/20" : "border-emerald-500/20"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isBid ? "bg-blue-500/20" : "bg-emerald-500/20"
          }`}
        >
          {isBid ? (
            <ShoppingCart size={14} className="text-blue-400" />
          ) : (
            <Zap size={14} className="text-emerald-400" />
          )}
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">
            {isBid ? "Buy Orders" : "Sell Orders"}
          </h3>
          <p className="text-xs text-gray-500">
            {count} {count === 1 ? "order" : "orders"}
          </p>
        </div>
      </div>
      {action}
    </div>
  );
});

ColumnHeader.displayName = "ColumnHeader";

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

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

  const timestamps = useMemo(() => getTimestampsForDay(selectedDay), [selectedDay]);

  /* ---- Contract read configs ---- */

  const createContractConfig = useCallback(
    (functionName: string, args: unknown[]) => ({
      abi: EnergyBiddingMarketAbi as AbiFunction[],
      address: energyMarketAddress,
      functionName,
      args,
    }),
    [energyMarketAddress],
  );

  const bidsConfig = useMemo(
    () => timestamps.map((ts) => createContractConfig("getBidsByHour", [ts])),
    [timestamps, createContractConfig],
  );
  const asksConfig = useMemo(
    () => timestamps.map((ts) => createContractConfig("getAsksByAddress", [ts, address])),
    [timestamps, address, createContractConfig],
  );
  const clearedConfig = useMemo(
    () => timestamps.map((ts) => createContractConfig("isMarketCleared", [ts])),
    [timestamps, createContractConfig],
  );
  const priceConfig = useMemo(
    () => timestamps.map((ts) => createContractConfig("getClearingPrice", [ts])),
    [timestamps, createContractConfig],
  );

  const {
    data: bids,
    isPending: isBidsLoading,
    refetch: refetchBids,
  } = useReadContracts({
    contracts: chainId === defaultChain.id ? bidsConfig : [],
  });
  const {
    data: asks,
    isPending: isAsksLoading,
    refetch: refetchAsks,
  } = useReadContracts({
    contracts: chainId === defaultChain.id ? asksConfig : [],
  });
  const { data: cleared, refetch: refetchCleared } = useReadContracts({
    contracts: chainId === defaultChain.id ? clearedConfig : [],
  });
  const { data: prices, refetch: refetchPrices } = useReadContracts({
    contracts: chainId === defaultChain.id ? priceConfig : [],
  });

  /* ---- Write contract for actions ---- */

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

  const refetchAll = useCallback(() => {
    refetchBids();
    refetchAsks();
    refetchCleared();
    refetchPrices();
  }, [refetchBids, refetchAsks, refetchCleared, refetchPrices]);

  /* ---- Filter user bids, preserving global indices ---- */

  const userBidsByHour = useMemo(() => {
    if (!bids || !address) return [];
    return bids.map((bidResult) => {
      const allBids = (bidResult.result as any[]) || [];
      return allBids
        .map(
          (bid, globalIndex): IndexedBid => ({
            globalIndex,
            bidder: bid.bidder,
            amount: bid.amount,
            price: bid.price,
            settled: bid.settled,
            canceled: bid.canceled,
          }),
        )
        .filter((bid) => bid.bidder?.toLowerCase() === address.toLowerCase());
    });
  }, [bids, address]);

  /* ---- Fetch BidRefunded events ---- */

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
          events.map((e: any) => `${e.args.hour}-${e.args.index}`),
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

  /* ---- Success effect ---- */
  useEffect(() => {
    if (isConfirmed) {
      toast.success("Transaction Successful");
      setActiveOrderIndex(null);
      refetchAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirmed, refetchAll]);

  /* ---- Error effect ---- */
  useEffect(() => {
    const err = writeError || confirmError;
    if (!err) return;

    let message = err.message;
    if (message.includes("User rejected") || message.includes("user rejected")) {
      message = "Transaction was rejected in your wallet";
    } else if (message.includes("insufficient funds")) {
      message = "Insufficient funds for this transaction";
    } else if (message.length > 150) {
      message = message.substring(0, 150) + "...";
    }
    toast.error("Transaction Failed", message);
    setActiveOrderIndex(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [writeError, confirmError]);

  /* ---- Action handlers ---- */

  const handleCancelBid = useCallback(
    (timestamp: number, globalIndex: number) => {
      if (!energyMarketAddress) return;
      setActiveOrderIndex(`bid-${timestamp}-${globalIndex}`);
      writeContract({
        abi: EnergyBiddingMarketAbi as AbiFunction[],
        address: energyMarketAddress,
        functionName: "cancelBid",
        args: [timestamp, globalIndex],
      });
    },
    [energyMarketAddress, writeContract],
  );

  const handleClearMarket = useCallback(
    (timestamp: number) => {
      if (!energyMarketAddress) return;
      setActiveOrderIndex(`clear-${timestamp}`);
      resetWrite();
      writeContract({
        abi: EnergyBiddingMarketAbi as AbiFunction[],
        address: energyMarketAddress,
        functionName: "clearMarket",
        args: [timestamp],
      });
    },
    [energyMarketAddress, writeContract, resetWrite],
  );

  const handleCancelFirstActive = useCallback(() => {
    for (let i = 0; i < userBidsByHour.length; i++) {
      for (const bid of userBidsByHour[i]) {
        if (!bid.canceled && !bid.settled) {
          handleCancelBid(timestamps[i], bid.globalIndex);
          return;
        }
      }
    }
  }, [userBidsByHour, timestamps, handleCancelBid]);

  const toggleSortMode = useCallback(
    () => setSortMode((prev) => (prev === "time" ? "amount" : "time")),
    [],
  );

  /* ---- Filtered + sorted order lists ---- */

  const filteredBids = useMemo<FlatBid[]>(() => {
    const flat = userBidsByHour.flatMap((hourBids, i) =>
      hourBids.map((bid) => ({ bid, hourIndex: i })),
    );

    const filtered = flat.filter(({ bid }) => {
      if (statusFilter === "all") return true;
      if (statusFilter === "canceled") return bid.canceled;
      if (statusFilter === "settled") return bid.settled && !bid.canceled;
      if (statusFilter === "active") return !bid.settled && !bid.canceled;
      return true;
    });

    return filtered.sort((a, b) => {
      if (sortMode === "amount") return Number(b.bid.amount) - Number(a.bid.amount);
      return timestamps[a.hourIndex] - timestamps[b.hourIndex];
    });
  }, [userBidsByHour, statusFilter, sortMode, timestamps]);

  const filteredAsks = useMemo<FlatAsk[]>(() => {
    if (!asks) return [];
    const flat = asks.flatMap((askResult, i) =>
      ((askResult.result as any[]) || []).map((ask, j) => ({
        ask,
        hourIndex: i,
        askIndex: j,
      })),
    );

    const filtered = flat.filter(({ ask }) => {
      if (statusFilter === "all") return true;
      const isSettled = ask.matchedAmount && ask.matchedAmount === ask.amount;
      if (statusFilter === "settled") return isSettled;
      if (statusFilter === "active") return !isSettled;
      if (statusFilter === "canceled") return false;
      return true;
    });

    return filtered.sort((a, b) => {
      if (sortMode === "amount") return Number(b.ask.amount) - Number(a.ask.amount);
      return timestamps[a.hourIndex] - timestamps[b.hourIndex];
    });
  }, [asks, statusFilter, sortMode, timestamps]);

  /* ---- Derived state ---- */

  const isLoading = isBidsLoading || isAsksLoading;
  const needsConnection = !isConnected || (chainId !== undefined && defaultChain.id !== chainId);

  const bidCount = useMemo(
    () => userBidsByHour.reduce((acc, hourBids) => acc + hourBids.length, 0),
    [userBidsByHour],
  );
  const askCount = useMemo(
    () => asks?.reduce((acc, a) => acc + ((a.result as any[])?.length ?? 0), 0) ?? 0,
    [asks],
  );

  const hasActiveBids = useMemo(
    () => userBidsByHour.some((hourBids) => hourBids.some((bid) => !bid.canceled && !bid.settled)),
    [userBidsByHour],
  );

  const statusFilters: StatusFilter[] = useMemo(
    () => ["all", "active", "settled", "canceled"],
    [],
  );

  /* ---- Render ---- */

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
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 p-2.5 sm:p-3 bg-white/5 rounded-xl">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Filter size={14} />
              <span className="hidden sm:inline">Status:</span>
            </div>
            {/* Filter buttons - scrollable on mobile */}
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              {statusFilters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`shrink-0 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg transition-all min-h-[32px] ${
                    statusFilter === filter
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-transparent active:bg-white/15"
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
            <div className="h-4 w-px bg-white/10 mx-0.5 hidden sm:block" />
            <button
              onClick={toggleSortMode}
              className="shrink-0 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white active:bg-white/15 transition-all border border-transparent min-h-[32px]"
            >
              <ArrowUpDown size={14} />
              <span className="hidden xs:inline">Sort:</span>{" "}
              {sortMode === "time" ? "Time" : "Amount"}
            </button>
          </div>
        )}

        {needsConnection ? (
          <div className="py-8">
            <ConnectAndSwitchNetworkButton />
          </div>
        ) : isLoading ? (
          <OrdersSkeleton />
        ) : bidCount === 0 && askCount === 0 ? (
          /* Global empty state when there are truly no orders at all */
          <EmptyState
            icon={<ClipboardList size={24} className="text-gray-500/50" />}
            iconColorClass="bg-white/5"
            title="No orders for this day"
            subtitle="Place a buy or sell order from the trading panel to see them here"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* ====== Bids Column ====== */}
            <div className="space-y-3 sm:space-y-4">
              <ColumnHeader
                type="bid"
                count={bidCount}
                action={
                  bidCount > 0 && hasActiveBids ? (
                    <Button
                      size="sm"
                      variant="danger"
                      icon={<Trash2 size={14} />}
                      disabled={isWritePending || isConfirming}
                      onClick={handleCancelFirstActive}
                    >
                      <span className="hidden sm:inline">Cancel Active</span>
                      <span className="inline sm:hidden">Cancel</span>
                    </Button>
                  ) : undefined
                }
              />
              <div className="space-y-2.5 sm:space-y-3 max-h-[350px] sm:max-h-[500px] overflow-y-auto overscroll-contain pr-0.5">
                <AnimatePresence mode="popLayout" initial={false}>
                  {filteredBids.map(({ bid, hourIndex: i }) => (
                    <OrderItem
                      key={`bid-${timestamps[i]}-${bid.globalIndex}`}
                      type="bid"
                      time={timestamps[i]}
                      index={bid.globalIndex}
                      amount={bid.amount}
                      price={bid.price}
                      settled={bid.settled}
                      canceled={bid.canceled}
                      isRefunded={refundedBidKeys.has(
                        `${BigInt(timestamps[i])}-${BigInt(bid.globalIndex)}`,
                      )}
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
                  ))}
                </AnimatePresence>
                {filteredBids.length === 0 && (
                  <EmptyState
                    icon={<ShoppingCart size={20} className="text-blue-500/50" />}
                    iconColorClass="bg-blue-500/10"
                    title={
                      bidCount === 0
                        ? "No buy orders for this day"
                        : "No matching buy orders"
                    }
                    subtitle={
                      bidCount === 0
                        ? "Place a bid to get started"
                        : "Try a different filter"
                    }
                  />
                )}
              </div>
            </div>

            {/* ====== Asks Column ====== */}
            <div className="space-y-3 sm:space-y-4">
              <ColumnHeader type="ask" count={askCount} />
              <div className="space-y-2.5 sm:space-y-3 max-h-[350px] sm:max-h-[500px] overflow-y-auto overscroll-contain pr-0.5">
                <AnimatePresence mode="popLayout" initial={false}>
                  {filteredAsks.map(({ ask, hourIndex: i, askIndex: j }) => (
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
                  ))}
                </AnimatePresence>
                {filteredAsks.length === 0 && (
                  <EmptyState
                    icon={<Zap size={20} className="text-emerald-500/50" />}
                    iconColorClass="bg-emerald-500/10"
                    title={
                      askCount === 0
                        ? "No sell orders for this day"
                        : "No matching sell orders"
                    }
                    subtitle={
                      askCount === 0
                        ? "List energy to sell"
                        : "Try a different filter"
                    }
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
