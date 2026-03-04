import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  useAccount,
  usePublicClient,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { ClipboardList, Check, AlertCircle, X } from "lucide-react";
import { Spinner } from "@chakra-ui/react";
import { motion } from "framer-motion";

import EnergyBiddingMarketAbi from "@/../abi/EnergyBiddingMarket.json";
import { DECIMALS, defaultChain } from "@/config";
import { useAppContext } from "@/context/AppContext";
import { useMarketToast } from "@/hooks/useMarketToast";
import ConnectAndSwitchNetworkButton from "@/components/common/ConnectAndSwitchNetworkButton";
import DateNavigationBar from "@/components/common/DateNavigationBar";
import { Card, CardHeader, Button, Badge, EmptyState, type TransactionStatus } from "@/components/ui";
import { getTimestampsForDay, formatTime } from "@/utils/dateHelpers";
import { wattsToKWh, pricePerWattToPerKWh } from "@/utils/units";
import { AbiFunction } from "viem";

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          {/* Amount - Primary highlight */}
          <div className="col-span-2 flex items-baseline gap-2 mb-2">
            <span className={`text-xl sm:text-2xl font-bold ${isBid ? "text-blue-400" : "text-emerald-400"}`}>
              {amountKWh % 1 === 0 ? amountKWh.toString() : amountKWh.toFixed(3)}
            </span>
            <span className="text-sm font-medium text-gray-400">kWh</span>
          </div>

          {/* Price per kWh */}
          {price && (
            <div>
              <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Price/kWh</p>
              <p className="text-sm font-semibold text-white">
                {pricePerKWh.toFixed(6)} ETH
              </p>
              {ethPrice && (
                <p className="text-xs text-gray-500">
                  ~€{(pricePerKWh * ethPrice).toFixed(4)}
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
                  ~€{(totalValueETH * ethPrice).toFixed(2)}
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
                    (~€{(clearingPricePerKWh * ethPrice).toFixed(4)})
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

        {needsConnection ? (
          <div className="py-8">
            <ConnectAndSwitchNetworkButton />
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" color="blue.400" />
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
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
              <div className="space-y-3 max-h-[350px] sm:max-h-[500px] overflow-y-auto">
                {userBidsByHour.map((hourBids, i) =>
                  hourBids.map((bid) => (
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
                )}
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
