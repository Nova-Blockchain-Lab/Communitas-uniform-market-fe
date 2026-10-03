"use client";
import React from "react";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { Clock, Loader2, History, RefreshCw } from "lucide-react";
import { isToday, isYesterday } from "date-fns";
import {
  ETHDepositOrWithdrawalMessage,
  getETHDepositsInfo,
  getETHWithdrawalsInfo,
} from "@/utils/executeMessageL2ToL1Helper";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonBlock, SkeletonLine } from "@/components/ui/Skeleton";
import MessageHistoryRow from "./MessageHistoryRow";

/** DateGroup type for grouped messages */
interface DateGroup {
  label: string;
  items: ETHDepositOrWithdrawalMessage[];
}

/** Group messages by "Today", "Yesterday", "Earlier" */
function groupByDate(messages: ETHDepositOrWithdrawalMessage[]): DateGroup[] {
  const groups: DateGroup[] = [];
  const buckets: Record<string, ETHDepositOrWithdrawalMessage[]> = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };

  for (const msg of messages) {
    const date = new Date(msg.time * 1000);
    if (isToday(date)) {
      buckets.Today.push(msg);
    } else if (isYesterday(date)) {
      buckets.Yesterday.push(msg);
    } else {
      buckets.Earlier.push(msg);
    }
  }

  for (const label of ["Today", "Yesterday", "Earlier"] as const) {
    if (buckets[label].length > 0) {
      groups.push({ label, items: buckets[label] });
    }
  }

  return groups;
}

/** Skeleton placeholder matching the card-based layout */
const HistorySkeleton: React.FC = () => (
  <div className="space-y-3 animate-in fade-in duration-300">
    <div className="flex items-center justify-between px-1 mb-4">
      <SkeletonLine width="6rem" height="0.75rem" />
      <SkeletonLine width="3rem" height="0.75rem" />
    </div>
    {Array.from({ length: 3 }).map((_, i) => (
      <SkeletonBlock key={i} height="5.5rem" rounded="xl" />
    ))}
  </div>
);

const BridgeHistory: React.FC = () => {
  const { address, isConnected } = useAccount();

  const { data: messages = [], isFetching: isLoading, refetch } = useQuery({
    queryKey: ["bridgeHistory", address],
    queryFn: async () => {
      const [withdrawals, deposits] = await Promise.all([
        getETHWithdrawalsInfo(address!),
        getETHDepositsInfo(address!),
      ]);
      return [...withdrawals, ...deposits].sort((a, b) => b.time - a.time);
    },
    enabled: !!address,
  });
  const getMessages = () => void refetch();
  const grouped = groupByDate(messages);

  // Not connected state
  if (!isConnected) {
    return (
      <EmptyState
        icon={<History size={22} className="text-gray-500" />}
        title="Connect Your Wallet"
        subtitle="View your bridge transaction history"
      />
    );
  }

  // Loading state -- skeleton
  if (isLoading && messages.length === 0) {
    return <HistorySkeleton />;
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <EmptyState
        icon={<Clock size={22} className="text-gray-500" />}
        title="No Transactions Yet"
        subtitle="Your bridge history will appear here"
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center justify-between px-1 mb-4">
        <span className="text-xs text-gray-500">
          {messages.length} transaction{messages.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={getMessages}
          disabled={isLoading}
          className="text-xs text-emerald-500 hover:text-emerald-400 active:scale-95
                     transition-all disabled:opacity-50 flex items-center gap-1.5
                     min-h-[36px] sm:min-h-[28px] min-w-[36px] sm:min-w-[28px] justify-center
                     rounded-lg hover:bg-white/5 px-2 py-1"
          aria-label="Refresh history"
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <RefreshCw size={14} />
          )}
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Grouped transaction list */}
      {grouped.map((group) => (
        <div key={group.label}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2 px-1">
            {group.label}
          </p>
          <div className="space-y-2 mb-4">
            {group.items.map((msg) => (
              <MessageHistoryRow
                key={msg.hash}
                message={msg}
                refetchMessages={getMessages}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BridgeHistory;
