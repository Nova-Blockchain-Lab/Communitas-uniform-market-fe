import React, { useEffect, useState, useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Spinner } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { parseAbiItem, decodeAbiParameters, keccak256, pad } from "viem";

import { WATTS_PER_KWH, defaultChain } from "@/config";
import { useAppContext } from "@/context/AppContext";
import ConnectAndSwitchNetworkButton from "@/components/common/ConnectAndSwitchNetworkButton";
import DateNavigationBar from "@/components/common/DateNavigationBar";
import { Card, CardHeader, EmptyState } from "@/components/ui";
import { wattsToKWh, pricePerWattToPerKWh } from "@/utils/units";
import { getTimestampsForDay, formatTime, truncateAddress } from "@/utils/dateHelpers";
import { fetchLogsFromBlockscout, type BlockscoutLog } from "@/utils/blockscoutApi";

interface Trade {
  hour: bigint;
  buyer: string;
  seller: string;
  amount: bigint;
  clearingPrice: bigint;
  direction: "buy" | "sell";
}

const ENERGY_TRADED_EVENT = parseAbiItem(
  "event EnergyTraded(uint256 indexed hour, address indexed buyer, address indexed seller, uint256 amount, uint256 clearingPrice)"
);

const TradeItem: React.FC<{
  trade: Trade;
  ethPrice?: number;
}> = ({ trade, ethPrice }) => {
  const isBuy = trade.direction === "buy";
  const counterparty = isBuy ? trade.seller : trade.buyer;
  const pricePerKwh = pricePerWattToPerKWh(trade.clearingPrice);
  const totalValue = pricePerKwh * wattsToKWh(trade.amount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isBuy ? "bg-blue-500" : "bg-emerald-500"}`} />
      <div
        className={`
        pl-4 pr-4 py-3 ml-1
        ${isBuy ? "bg-gradient-to-r from-blue-500/10 to-transparent" : "bg-gradient-to-r from-emerald-500/10 to-transparent"}
        border border-l-0 rounded-r-xl
        ${isBuy ? "border-blue-500/20" : "border-emerald-500/20"}
      `}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isBuy ? (
              <ArrowDownLeft size={14} className="text-blue-400" />
            ) : (
              <ArrowUpRight size={14} className="text-emerald-400" />
            )}
            <span className={`text-xs font-bold uppercase tracking-wider ${isBuy ? "text-blue-400" : "text-emerald-400"}`}>
              {isBuy ? "Bought from" : "Sold to"}
            </span>
            <span className="text-xs text-gray-400 font-mono">{truncateAddress(counterparty)}</span>
          </div>
          <span className="text-xs text-gray-500">{formatTime(Number(trade.hour))}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Amount</p>
            <p className={`text-sm font-semibold ${isBuy ? "text-blue-400" : "text-emerald-400"}`}>
              {wattsToKWh(trade.amount).toFixed(2)} kWh
            </p>
          </div>
          <div className="border-t border-white/5 pt-2 sm:border-0 sm:pt-0">
            <p className="text-xs text-gray-500 mb-0.5">Price/kWh</p>
            <p className="text-sm font-semibold text-white">
              {pricePerKwh.toFixed(6)} ETH
            </p>
            {ethPrice && (
              <p className="text-xs text-gray-500">~{"\u20AC"}{(pricePerKwh * ethPrice).toFixed(4)}</p>
            )}
          </div>
          <div className="border-t border-white/5 pt-2 sm:border-0 sm:pt-0">
            <p className="text-xs text-gray-500 mb-0.5">Total</p>
            <p className="text-sm font-semibold text-white">
              {totalValue.toFixed(6)} ETH
            </p>
            {ethPrice && (
              <p className="text-xs text-gray-500">~{"\u20AC"}{(totalValue * ethPrice).toFixed(2)}</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const TradeHistoryBox: React.FC = () => {
  const { isConnected, address, chainId } = useAccount();
  const { ethPrice, energyMarketAddress } = useAppContext();
  const publicClient = usePublicClient();

  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTrades = useCallback(async () => {
    if (!publicClient || !address || !energyMarketAddress) return;

    const timestamps = getTimestampsForDay(selectedDay);
    const dayStart = BigInt(timestamps[0]);
    const dayEnd = BigInt(timestamps[timestamps.length - 1]);

    setIsLoading(true);
    try {
      // Compute the EnergyTraded event topic0
      const topic0 = keccak256(
        new TextEncoder().encode("EnergyTraded(uint256,address,address,uint256,uint256)")
      );
      // Pad user address to 32 bytes for topic filtering
      const paddedAddress = pad(address as `0x${string}`, { size: 32 });

      let allTrades: Trade[] = [];
      let usedBlockscout = false;

      // --- Primary: Blockscout API ---
      try {
        const [buyLogs, sellLogs] = await Promise.all([
          fetchLogsFromBlockscout({
            address: energyMarketAddress,
            topic0,
            topic2: paddedAddress, // buyer is topic2 (second indexed param)
          }),
          fetchLogsFromBlockscout({
            address: energyMarketAddress,
            topic0,
            topic3: paddedAddress, // seller is topic3 (third indexed param)
          }),
        ]);

        const parseBlockscoutLog = (
          log: BlockscoutLog,
          direction: "buy" | "sell"
        ): Trade | null => {
          // Decode indexed topics: topic1=hour, topic2=buyer, topic3=seller
          const hour = BigInt(log.topics[1]);
          const buyer = ("0x" + log.topics[2].slice(26)) as string;
          const seller = ("0x" + log.topics[3].slice(26)) as string;

          // Decode non-indexed data: (uint256 amount, uint256 clearingPrice)
          const [amount, clearingPrice] = decodeAbiParameters(
            [
              { name: "amount", type: "uint256" },
              { name: "clearingPrice", type: "uint256" },
            ],
            log.data as `0x${string}`
          );

          if (hour < dayStart || hour > dayEnd) return null;

          return { hour, buyer, seller, amount, clearingPrice, direction };
        };

        for (const log of buyLogs) {
          const trade = parseBlockscoutLog(log, "buy");
          if (trade) allTrades.push(trade);
        }

        for (const log of sellLogs) {
          const trade = parseBlockscoutLog(log, "sell");
          if (trade) {
            // Avoid duplicates if user traded with themselves
            const isDuplicate = allTrades.some(
              (t) =>
                t.hour === trade.hour &&
                t.buyer === trade.buyer &&
                t.seller === trade.seller &&
                t.amount === trade.amount
            );
            if (!isDuplicate) allTrades.push(trade);
          }
        }

        usedBlockscout = true;
      } catch (blockscoutError) {
        console.warn("Blockscout API failed, falling back to RPC getLogs:", blockscoutError);
      }

      // --- Fallback: RPC getLogs with bounded fromBlock ---
      if (!usedBlockscout) {
        const currentBlock = await publicClient.getBlockNumber();
        const secondsAgo = Math.floor(Date.now() / 1000) - timestamps[0];
        const fromBlock = BigInt(Math.max(0, Number(currentBlock) - secondsAgo - 86400));

        const [buyLogs, sellLogs] = await Promise.all([
          publicClient.getLogs({
            address: energyMarketAddress,
            event: ENERGY_TRADED_EVENT,
            args: { buyer: address },
            fromBlock,
            toBlock: "latest",
          }),
          publicClient.getLogs({
            address: energyMarketAddress,
            event: ENERGY_TRADED_EVENT,
            args: { seller: address },
            fromBlock,
            toBlock: "latest",
          }),
        ]);

        for (const log of buyLogs) {
          const hour = log.args.hour!;
          if (hour >= dayStart && hour <= dayEnd) {
            allTrades.push({
              hour,
              buyer: log.args.buyer!,
              seller: log.args.seller!,
              amount: log.args.amount!,
              clearingPrice: log.args.clearingPrice!,
              direction: "buy",
            });
          }
        }

        for (const log of sellLogs) {
          const hour = log.args.hour!;
          if (hour >= dayStart && hour <= dayEnd) {
            const isDuplicate = allTrades.some(
              (t) =>
                t.hour === hour &&
                t.buyer === log.args.buyer! &&
                t.seller === log.args.seller! &&
                t.amount === log.args.amount!
            );
            if (!isDuplicate) {
              allTrades.push({
                hour,
                buyer: log.args.buyer!,
                seller: log.args.seller!,
                amount: log.args.amount!,
                clearingPrice: log.args.clearingPrice!,
                direction: "sell",
              });
            }
          }
        }
      }

      // Sort by hour
      allTrades.sort((a, b) => Number(a.hour) - Number(b.hour));
      setTrades(allTrades);
    } catch (error) {
      console.error("Failed to fetch trades:", error);
      setTrades([]);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, address, energyMarketAddress, selectedDay]);

  useEffect(() => {
    if (isConnected && chainId === defaultChain.id) {
      fetchTrades();
    }
  }, [isConnected, chainId, fetchTrades]);

  // Summaries
  const totalBought = trades
    .filter((t) => t.direction === "buy")
    .reduce((sum, t) => sum + wattsToKWh(t.amount), 0);
  const totalSold = trades
    .filter((t) => t.direction === "sell")
    .reduce((sum, t) => sum + wattsToKWh(t.amount), 0);

  const needsConnection = !isConnected || (chainId && defaultChain.id !== chainId);

  return (
    <div className="w-full max-w-4xl">
      <Card padding="lg">
        <CardHeader
          title="Trade History"
          subtitle="Bilateral trade records from market clearing"
          icon={<ArrowLeftRight size={20} />}
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
          <>
            {/* Summary */}
            {trades.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Energy Bought</p>
                  <p className="text-xl font-bold text-blue-400">{totalBought.toFixed(2)} kWh</p>
                </div>
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Energy Sold</p>
                  <p className="text-xl font-bold text-emerald-400">{totalSold.toFixed(2)} kWh</p>
                </div>
              </div>
            )}

            {/* Trade List */}
            <div className="space-y-3">
              {trades.map((trade, i) => (
                <TradeItem key={`trade-${trade.hour}-${trade.direction}-${i}`} trade={trade} ethPrice={ethPrice} />
              ))}
              {trades.length === 0 && (
                <EmptyState
                  icon={<ArrowLeftRight size={20} className="text-gray-500/50" />}
                  title="No trades for this day"
                  subtitle="Trades appear after market clearing"
                />
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default TradeHistoryBox;
