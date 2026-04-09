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

interface UseDashboardDataReturn {
  hourData: HourData[];
  isPending: boolean;
  refetch: () => void;
}

// Module-level constants — stable references that never change between renders
const typedAbi = EnergyBiddingMarketAbi as AbiFunction[];
const EMPTY_HOUR_DATA: HourData[] = [];

export function useDashboardData(selectedDay: Date): UseDashboardDataReturn {
  const { energyMarketAddress } = useAppContext();

  const timestamps = useMemo(() => getTimestampsForDay(selectedDay), [selectedDay]);

  const createConfig = useCallback(
    (functionName: string, args: unknown[]) => ({
      abi: typedAbi,
      address: energyMarketAddress,
      functionName,
      args,
      chainId: defaultChain.id as number,
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

  const hasContracts = contracts.length > 0;

  const { data, isPending, refetch } = useReadContracts({
    contracts: hasContracts ? contracts : undefined,
    query: {
      enabled: hasContracts,
      staleTime: 30_000, // Data is fresh for 30s
      gcTime: 5 * 60_000, // Keep in cache for 5 min
      refetchInterval: 60_000, // Auto-refetch every 60s
      refetchIntervalInBackground: false,
    },
  });

  const hourData: HourData[] = useMemo(() => {
    if (!data || data.length === 0) return EMPTY_HOUR_DATA;

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

  // Wrap refetch in useCallback to provide a stable reference
  const stableRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  return useMemo(
    () => ({ hourData, isPending, refetch: stableRefetch }),
    [hourData, isPending, stableRefetch]
  );
}
