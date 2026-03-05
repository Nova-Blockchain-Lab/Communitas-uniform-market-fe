"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { Clock, Loader2, History } from "lucide-react";
import { isToday, isYesterday } from "date-fns";
import {
  ETHDepositOrWithdrawalMessage,
  getETHDepositsInfo,
  getETHWithdrawalsInfo,
} from "@/utils/executeMessageL2ToL1Helper";
import { useAppContext } from "@/context/AppContext";
import { SkeletonBlock, SkeletonLine } from "@/components/ui";
import MessageHistoryRow from "./MessageHistoryRow";

/** Group messages by "Today", "Yesterday", "Earlier" */
function groupByDate(messages: ETHDepositOrWithdrawalMessage[]) {
  const groups: { label: string; items: ETHDepositOrWithdrawalMessage[] }[] = [];
  const buckets: Record<string, ETHDepositOrWithdrawalMessage[]> = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };

  for (const msg of messages) {
    const date = new Date(msg.time.toNumber() * 1000);
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

/** Skeleton placeholder for the loading state */
const HistorySkeleton: React.FC = () => (
  <div className="space-y-3">
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
  const { l1Provider, l2Provider } = useAppContext();

  const [messages, setMessages] = useState<ETHDepositOrWithdrawalMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getMessages = useCallback(async () => {
    if (!isConnected || !address || !l1Provider || !l2Provider) return;

    setIsLoading(true);

    try {
      const withdraws = await getETHWithdrawalsInfo(address, l1Provider, l2Provider);
      const deposits = await getETHDepositsInfo(address, l1Provider, l2Provider);

      const allMessages = [...withdraws, ...deposits].sort((a, b) =>
        b.time.sub(a.time).toNumber()
      );

      setMessages(allMessages);
    } catch (error) {
      console.error("Error fetching bridge history:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, l1Provider, l2Provider]);

  useEffect(() => {
    let isMounted = true;

    const fetchMessages = async () => {
      if (!isMounted) return;
      await getMessages();
    };

    fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [getMessages]);

  const grouped = useMemo(() => groupByDate(messages), [messages]);

  // Not connected state
  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <History size={24} className="text-gray-500" />
        </div>
        <p className="text-sm text-gray-400 mb-1">Connect Your Wallet</p>
        <p className="text-xs text-gray-600">
          View your bridge transaction history
        </p>
      </div>
    );
  }

  // Loading state — skeleton
  if (isLoading && messages.length === 0) {
    return <HistorySkeleton />;
  }

  // Empty state
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
          <Clock size={24} className="text-gray-500" />
        </div>
        <p className="text-sm text-gray-400 mb-1">No Transactions Yet</p>
        <p className="text-xs text-gray-600">
          Your bridge history will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center justify-between px-1 mb-4">
        <span className="text-xs text-gray-500">
          {messages.length} transaction{messages.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={getMessages}
          disabled={isLoading}
          className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {isLoading && <Loader2 size={10} className="animate-spin" />}
          Refresh
        </button>
      </div>

      {/* Grouped transaction list */}
      {grouped.map((group) => (
        <div key={group.label}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2 px-1">
            {group.label}
          </p>
          <div className="space-y-2 mb-4">
            {group.items.map((msg, idx) => (
              <MessageHistoryRow key={idx} message={msg} refetchMessages={getMessages} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BridgeHistory;
