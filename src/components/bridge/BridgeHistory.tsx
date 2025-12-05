"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Clock, Loader2, History } from "lucide-react";
import {
  ETHDepositOrWithdrawalMessage,
  getETHDepositsInfo,
  getETHWithdrawalsInfo,
} from "@/utils/executeMessageL2ToL1Helper";
import { useAppContext } from "@/context/AppContext";
import MessageHistoryRow from "./MessageHistoryRow";

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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 size={32} className="text-emerald-500 animate-spin mb-4" />
        <p className="text-sm text-gray-400">Loading history...</p>
      </div>
    );
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
          className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {/* Transaction list */}
      <div className="space-y-2">
        {messages.map((msg, idx) => (
          <MessageHistoryRow key={idx} message={msg} refetchMessages={getMessages} />
        ))}
      </div>
    </div>
  );
};

export default BridgeHistory;
