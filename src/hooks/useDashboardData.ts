import { useReadContracts } from "wagmi";
import { useCallback, useMemo } from "react";
import EnergyBiddingMarketAbi from "@/../abi/EnergyBiddingMarket.json";
import { defaultChain, DECIMALS, WATTS_PER_KWH } from "@/config";
import { useAppContext } from "@/context/AppContext";
import { getTimestampsForDay } from "@/utils/dateHelpers";
import { AbiFunction } from "viem";

export interface Participant {
  address: string;
  amount: number; // kWh
  price?: number; // ETH (for bids only)
}

export interface HourData {
  timestamp: number;
  hour: number; // 0-23
  isCleared: boolean;
  clearingPrice: number; // ETH
  totalAvailableEnergy: number; // kWh
  buyers: Participant[];
  sellers: Participant[];
}

export function useDashboardData(selectedDay: Date) {
  const { energyMarketAddress } = useAppContext();

  const timestamps = useMemo(() => getTimestampsForDay(selectedDay), [selectedDay]);

  const createConfig = useCallback(
    (functionName: string, args: unknown[]) => ({
      abi: EnergyBiddingMarketAbi as AbiFunction[],
      address: energyMarketAddress,
      functionName,
      args,
      chainId: defaultChain.id,
    }),
    [energyMarketAddress]
  );

  // Batch all 24 hours x 5 calls = 120 multicalls
  const contracts = useMemo(() => {
    if (!energyMarketAddress) return [];
    return timestamps.flatMap((ts) => [
      createConfig("getBidsByHour", [ts]),
      createConfig("getAsksByHour", [ts]),
      createConfig("getClearingPrice", [ts]),
      createConfig("isMarketCleared", [ts]),
      createConfig("getTotalAvailableEnergy", [ts]),
    ]);
  }, [timestamps, energyMarketAddress, createConfig]);

  const { data, isPending, refetch } = useReadContracts({
    contracts: contracts.length > 0 ? contracts : [],
  });

  const hourData: HourData[] = useMemo(() => {
    if (!data || data.length === 0) return [];

    return timestamps.map((ts, i) => {
      const base = i * 5;
      const bidsRaw = (data[base]?.result as any[]) || [];
      const asksRaw = (data[base + 1]?.result as any[]) || [];
      const clearingPrice = data[base + 2]?.result as bigint | undefined;
      const isCleared = (data[base + 3]?.result as boolean) || false;
      const totalEnergy = data[base + 4]?.result as bigint | undefined;

      const buyers: Participant[] = bidsRaw.map((bid: any) => ({
        address: bid.bidder,
        amount: Number(bid.amount) / WATTS_PER_KWH,
        price: (Number(bid.price) * WATTS_PER_KWH) / 10 ** DECIMALS,
      }));

      const sellers: Participant[] = asksRaw.map((ask: any) => ({
        address: ask.seller,
        amount: Number(ask.amount) / WATTS_PER_KWH,
      }));

      return {
        timestamp: ts,
        hour: new Date(ts * 1000).getHours(),
        isCleared,
        clearingPrice: clearingPrice ? (Number(clearingPrice) * WATTS_PER_KWH) / 10 ** DECIMALS : 0,
        totalAvailableEnergy: totalEnergy ? Number(totalEnergy) / WATTS_PER_KWH : 0,
        buyers,
        sellers,
      };
    });
  }, [data, timestamps]);

  return { hourData, isPending, refetch };
}
