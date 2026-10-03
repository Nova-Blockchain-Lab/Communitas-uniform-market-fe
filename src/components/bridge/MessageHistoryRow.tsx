import React from "react";
import { ArrowUpRight, ArrowDownLeft, Clock, Check, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { formatDistanceToNowStrict } from "date-fns";
import { useAccount, useSwitchChain } from "wagmi";

import { type ETHDepositOrWithdrawalMessage, MessageType } from "@/utils/executeMessageL2ToL1Helper";
import { CONFIRMATION_BUFFER_MINUTES } from "@/config/constants";
import { useWithdrawal } from "@/hooks/useWithdrawal";
import { secondsUntil, timeLeftLabel } from "@/utils/utils";
import { Badge } from "@/components/ui/Badge";
import { TransactionModal } from "@/components/ui/TransactionModal";

interface MessageHistoryRowProps {
  message: ETHDepositOrWithdrawalMessage;
  refetchMessages: () => void;
}

const STATUS_META = {
  completed: { variant: "success", label: "Completed", icon: <Check size={12} />, pulse: false },
  pending: { variant: "warning", label: "Pending", icon: <Clock size={12} />, pulse: true },
  claimable: { variant: "info", label: "Ready", icon: <AlertCircle size={12} />, pulse: false },
} as const;

const WAIT_SECONDS = CONFIRMATION_BUFFER_MINUTES * 60;

const MessageHistoryRow: React.FC<MessageHistoryRowProps> = ({ message, refetchMessages }) => {
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();

  const isDeposit = message.type === MessageType.DEPOSIT;
  // Withdrawals are polled until claimed; a deposit row shows the status it was fetched with.
  const withdrawal = useWithdrawal(isDeposit ? undefined : message.hash, message.status);
  const status = withdrawal.status ?? message.status;
  const meta = STATUS_META[status];
  const { deadline, tx } = withdrawal;

  const date = new Date(message.time * 1000);
  const formattedDate = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Share of the confirmation wait that has passed, while a withdrawal is pending
  const progressPct =
    !isDeposit && status === "pending" && deadline !== undefined
      ? 100 * (1 - Math.min(1, secondsUntil(deadline) / WAIT_SECONDS))
      : undefined;

  const handleClaim = async () => {
    if (await withdrawal.claim()) refetchMessages();
  };

  let action: React.ReactNode = null;
  if (!isDeposit && status !== "completed") {
    if (!isConnected) {
      action = <appkit-button size="sm" />;
    } else if (status === "pending") {
      action = deadline !== undefined && (
        <div className="flex items-center gap-1.5 text-xs text-amber-400">
          <Clock size={12} />
          <span>{timeLeftLabel(deadline)}</span>
        </div>
      );
    } else if (chainId !== message.to.id) {
      action = (
        <button
          onClick={() => switchChain({ chainId: message.to.id })}
          className="px-3 py-2 sm:py-1.5 text-xs font-medium bg-blue-500/20 text-blue-400
                     rounded-lg hover:bg-blue-500/30 active:scale-[0.97] transition-all
                     min-h-[44px] sm:min-h-0 w-full sm:w-auto"
        >
          Switch Network
        </button>
      );
    } else {
      action = (
        <button
          onClick={handleClaim}
          disabled={tx.isBusy}
          className="px-3 py-2 sm:py-1.5 text-xs font-medium bg-emerald-500 text-white
                     rounded-lg hover:bg-emerald-600 active:scale-[0.97] transition-all
                     disabled:opacity-50 flex items-center justify-center gap-1.5
                     min-h-[44px] sm:min-h-0 w-full sm:w-auto"
        >
          {tx.isBusy ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Processing
            </>
          ) : (
            "Claim"
          )}
        </button>
      );
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="p-3 sm:p-4 rounded-xl bg-white/[0.03] border border-white/5
                 hover:border-white/10 transition-colors"
    >
      {/* Header row: direction icon + type/time + status badge */}
      <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
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

          <div className="min-w-0">
            <p className="text-sm font-medium text-white">
              {isDeposit ? "Deposit" : "Withdrawal"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              <span>{formatDistanceToNowStrict(date, { addSuffix: true })}</span>
              <span className="hidden sm:inline text-gray-600"> &middot; {formattedDate}</span>
            </p>
          </div>
        </div>

        <Badge variant={meta.variant} size="sm" icon={meta.icon} pulse={meta.pulse} className="shrink-0">
          {meta.label}
        </Badge>
      </div>

      {/* Route: from -> to */}
      <div className="flex items-center gap-2 mb-2 sm:mb-3 text-xs flex-wrap">
        <span className="text-gray-400">{message.from.name}</span>
        <span className="text-gray-600">&rarr;</span>
        <span className="text-gray-400">{message.to.name}</span>
      </div>

      {progressPct !== undefined && deadline !== undefined && (
        <div className="mb-2 sm:mb-3">
          <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
            <span>Challenge period</span>
            <span>{Math.round(progressPct)}% complete</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="text-[10px] text-gray-500 mt-1">{timeLeftLabel(deadline)}</p>
        </div>
      )}

      {/* Amount + action -- stacks vertically on mobile when action exists */}
      <div className={`flex gap-2 ${action ? "flex-col sm:flex-row sm:items-center sm:justify-between" : "items-center justify-between"}`}>
        <span className="text-sm font-semibold text-white">{message.token}</span>
        {action}
      </div>

      {/* Full date on mobile (hidden on sm+) */}
      <p className="text-[10px] text-gray-600 mt-2 sm:hidden">{formattedDate}</p>

      <TransactionModal
        isOpen={tx.isOpen}
        status={tx.status}
        hash={tx.hash}
        error={tx.error}
        details={{ type: "bridge_execute" }}
        onClose={tx.close}
        onRetry={handleClaim}
      />
    </motion.div>
  );
};

export default MessageHistoryRow;
