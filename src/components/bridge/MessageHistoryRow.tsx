import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ArrowDownLeft, Clock, Check, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import {
  ETHDepositOrWithdrawalMessage,
  getOutgoingMessageState,
  getTxExpectedDeadlineTimestamp,
  MessageType,
  WITHDRAWAL_STATUS,
} from "@/utils/executeMessageL2ToL1Helper";
import { baseChain, defaultChain } from "@/config";
import { ChildToParentMessageStatus, ChildTransactionReceipt } from "@arbitrum/sdk";
import { useAccount, useSwitchChain } from "wagmi";
import { useEthersSigner } from "@/utils/ethersHelper";
import { useAppContext } from "@/context/AppContext";
import { formatTimestamp } from "@/utils/utils";
import { Badge, TransactionModal, TransactionStatus } from "@/components/ui";

interface MessageHistoryRowProps {
  message: ETHDepositOrWithdrawalMessage;
  refetchMessages: () => void;
}

/** Human-readable date shown beneath relative time */
function formatDate(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type StatusMeta = {
  variant: "success" | "warning" | "error" | "info";
  icon: React.ReactNode;
  pulse: boolean;
};

const MessageHistoryRow: React.FC<MessageHistoryRowProps> = ({ message, refetchMessages }) => {
  const { address, isConnected, chainId } = useAccount();
  const { l1Provider, l2Provider } = useAppContext();
  const { switchChain } = useSwitchChain();
  const signer = useEthersSigner();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [remainingTime, setRemainingTime] = useState<number | undefined>(undefined);
  const [isWaitingForConfirmation, setIsWaitingForConfirmation] = useState<boolean>(false);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txError, setTxError] = useState<string | undefined>();
  const [txHash, setTxHash] = useState<string | undefined>();

  const isDeposit = message.type === MessageType.DEPOSIT;
  const isSuccess = message.status.status === "Success";

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => {
      setTxStatus("idle");
      setTxError(undefined);
      setTxHash(undefined);
    }, 300);
  }, []);

  const executeBridge = useCallback(async (hash: string) => {
    if (chainId === defaultChain.id) {
      switchChain({ chainId: baseChain.id });
      return;
    }

    if (!isConnected || !address || !l1Provider || !l2Provider || !signer) return;

    setIsModalOpen(true);
    setTxStatus("pending");
    setTxError(undefined);
    setTxHash(undefined);
    setIsLoading(true);

    try {
      const receipt = await l2Provider.getTransactionReceipt(hash);
      const l2Receipt = new ChildTransactionReceipt(receipt);

      const messages = await l2Receipt.getChildToParentMessages(signer);
      const childToParentMsg = messages[0];

      const tx = await childToParentMsg.execute(l2Provider);
      setTxHash(tx.hash);
      setTxStatus("confirming");

      await tx.wait(1);

      setTxStatus("success");
      refetchMessages();
    } catch (error: any) {
      console.error("Bridge execution failed:", error);
      setTxStatus("error");
      let errorMessage = error?.message || "Something went wrong. Please try again later.";
      if (errorMessage.includes("User rejected") || errorMessage.includes("user rejected")) {
        errorMessage = "Transaction was rejected in your wallet";
      } else if (errorMessage.length > 150) {
        errorMessage = errorMessage.substring(0, 150) + "...";
      }
      setTxError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [chainId, isConnected, address, l1Provider, l2Provider, signer, switchChain, refetchMessages]);

  const handleExecuteBridge = useCallback(() => {
    executeBridge(message.hash);
  }, [executeBridge, message.hash]);

  const handleSwitchNetwork = useCallback(() => {
    switchChain({ chainId: message.to.id });
  }, [switchChain, message.to.id]);

  useEffect(() => {
    if (message.type === MessageType.DEPOSIT) return;
    const updateWithdrawalStatus = async () => {
      if (!l1Provider || !l2Provider) return;
      setIsLoading(true);
      const state = await getOutgoingMessageState(message.hash, l1Provider, l2Provider);
      message.status = WITHDRAWAL_STATUS[state];
      setIsWaitingForConfirmation(state === ChildToParentMessageStatus.UNCONFIRMED);
      setIsLoading(false);
    };
    const interval = setInterval(updateWithdrawalStatus, 60 * 1_000);
    updateWithdrawalStatus();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!l2Provider || message.type === MessageType.DEPOSIT) return;
    const fetchAndSetRemainingTime = async () => {
      setIsLoading(true);
      const time = await getTxExpectedDeadlineTimestamp(l2Provider, message.hash);
      setRemainingTime(time);
      setIsLoading(false);
    };

    fetchAndSetRemainingTime();
    const interval = setInterval(fetchAndSetRemainingTime, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const statusBadge = useMemo((): StatusMeta => {
    if (isSuccess) {
      return { variant: "success", icon: <Check size={12} />, pulse: false };
    }
    if (isWaitingForConfirmation) {
      return { variant: "warning", icon: <Clock size={12} />, pulse: true };
    }
    return { variant: "info", icon: <AlertCircle size={12} />, pulse: false };
  }, [isSuccess, isWaitingForConfirmation]);

  /** Challenge period progress for pending withdrawals (7 days = 604800s) */
  const CHALLENGE_PERIOD_SECONDS = 7 * 24 * 60 * 60;
  const withdrawalProgress = useMemo(() => {
    if (isDeposit || isSuccess || remainingTime === undefined) return null;
    const now = Math.floor(Date.now() / 1000);
    const remaining = Math.max(0, remainingTime - now);
    const elapsed = CHALLENGE_PERIOD_SECONDS - remaining;
    const pct = Math.min(100, Math.max(0, (elapsed / CHALLENGE_PERIOD_SECONDS) * 100));
    return { pct, remaining };
  }, [isDeposit, isSuccess, remainingTime]);

  const formattedDate = useMemo(
    () => formatDate(message.time.toNumber()),
    [message.time],
  );

  const relativeTime = useMemo(
    () => formatTimestamp(message.time),
    [message.time],
  );

  // ---- Action button (extracted for clarity) ----
  const renderActionButton = () => {
    if (isDeposit || isSuccess) return null;

    if (!isConnected) {
      return <appkit-button size="sm" />;
    }

    if (isWaitingForConfirmation) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-amber-400">
          <Clock size={12} />
          <span>{formatTimestamp(remainingTime)} left</span>
        </div>
      );
    }

    if (chainId !== message.to.id) {
      return (
        <button
          onClick={handleSwitchNetwork}
          className="px-3 py-2 sm:py-1.5 text-xs font-medium bg-blue-500/20 text-blue-400
                     rounded-lg hover:bg-blue-500/30 active:scale-[0.97] transition-all
                     min-h-[36px] sm:min-h-0"
        >
          Switch Network
        </button>
      );
    }

    return (
      <button
        onClick={handleExecuteBridge}
        disabled={isLoading}
        className="px-3 py-2 sm:py-1.5 text-xs font-medium bg-emerald-500 text-white
                   rounded-lg hover:bg-emerald-600 active:scale-[0.97] transition-all
                   disabled:opacity-50 flex items-center gap-1.5
                   min-h-[36px] sm:min-h-0"
      >
        {isLoading ? (
          <>
            <Loader2 size={12} className="animate-spin" />
            Processing
          </>
        ) : (
          "Claim"
        )}
      </button>
    );
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="p-4 rounded-xl bg-white/[0.03] border border-white/5
                 hover:border-white/10 transition-colors"
    >
      {/* ---- Desktop / tablet layout ---- */}
      {/* Header row: direction + status */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {/* Direction icon */}
          <div
            className={`
              w-8 h-8 shrink-0 rounded-lg flex items-center justify-center
              ${isDeposit ? "bg-emerald-500/10" : "bg-blue-500/10"}
            `}
          >
            {isDeposit ? (
              <ArrowDownLeft size={16} className="text-emerald-400" />
            ) : (
              <ArrowUpRight size={16} className="text-blue-400" />
            )}
          </div>

          {/* Type and time */}
          <div className="min-w-0">
            <p className="text-sm font-medium text-white">
              {isDeposit ? "Deposit" : "Withdrawal"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              <span>{relativeTime} ago</span>
              <span className="hidden sm:inline text-gray-600"> &middot; {formattedDate}</span>
            </p>
          </div>
        </div>

        {/* Status badge */}
        <Badge
          variant={statusBadge.variant}
          size="sm"
          icon={statusBadge.icon}
          pulse={statusBadge.pulse}
          className="shrink-0"
        >
          <span className="hidden xs:inline">{message.status.status}</span>
          <span className="xs:hidden" aria-label={message.status.status}>
            {isSuccess ? "" : ""}
          </span>
        </Badge>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 mb-3 text-xs flex-wrap">
        <span className="text-gray-400">{message.from.name}</span>
        <span className="text-gray-600">&rarr;</span>
        <span className="text-gray-400">{message.to.name}</span>
      </div>

      {/* Progress bar for pending withdrawals */}
      {withdrawalProgress && !isSuccess && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
            <span>Challenge period</span>
            <span>{Math.round(withdrawalProgress.pct)}% complete</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${withdrawalProgress.pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="text-[10px] text-gray-500 mt-1">
            ~{formatTimestamp(withdrawalProgress.remaining)} remaining
          </p>
        </div>
      )}

      {/* Amount + action (stacks on mobile) */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-sm font-semibold text-white">{message.token}</span>
        {renderActionButton()}
      </div>

      {/* Full date on mobile (hidden on sm+) */}
      <p className="text-[10px] text-gray-600 mt-2 sm:hidden">{formattedDate}</p>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        status={txStatus}
        hash={txHash}
        error={txError}
        details={{ type: "bridge_execute" }}
        onClose={closeModal}
        onRetry={handleExecuteBridge}
      />
    </motion.div>
  );
};

export default React.memo(MessageHistoryRow);
