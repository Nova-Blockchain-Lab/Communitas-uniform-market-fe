import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  Zap,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Image,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { Button } from "./Button";

export type TransactionStatus = "idle" | "pending" | "confirming" | "bridging" | "success" | "error";
export type TransactionType = "bid" | "sell" | "claim" | "cancel" | "clear" | "mint" | "bridge_deposit" | "bridge_withdraw" | "bridge_nft_l1" | "bridge_nft_l2" | "bridge_execute" | "bridge_nft_execute";

interface TransactionDetails {
  type: TransactionType;
  amount?: number;
  hours?: number;
  totalCost?: string;
  currency?: string;
}

interface TransactionModalProps {
  isOpen: boolean;
  status: TransactionStatus;
  hash?: string;
  error?: string;
  details?: TransactionDetails;
  onClose: () => void;
  onRetry?: () => void;
  explorerUrl?: string;
}

const statusConfig = {
  pending: {
    title: "Waiting for Confirmation",
    subtitle: "Please confirm the transaction in your wallet",
    color: "blue",
    bgGradient: "from-blue-500/20 to-blue-600/10",
  },
  confirming: {
    title: "Processing Transaction",
    subtitle: "Your transaction is being confirmed on the blockchain",
    color: "amber",
    bgGradient: "from-amber-500/20 to-orange-600/10",
  },
  bridging: {
    title: "Bridging in Progress",
    subtitle: "Waiting for cross-chain confirmation",
    color: "purple",
    bgGradient: "from-purple-500/20 to-purple-600/10",
  },
  success: {
    title: "Transaction Successful",
    subtitle: "Your transaction has been confirmed",
    color: "emerald",
    bgGradient: "from-emerald-500/20 to-green-600/10",
  },
  error: {
    title: "Transaction Failed",
    subtitle: "Something went wrong with your transaction",
    color: "red",
    bgGradient: "from-red-500/20 to-red-600/10",
  },
  idle: {
    title: "",
    subtitle: "",
    color: "gray",
    bgGradient: "",
  },
};

const typeConfig: Record<TransactionType, { icon: React.ReactNode; label: string; successMessage: string }> = {
  bid: {
    icon: <Zap size={24} />,
    label: "Energy Bid",
    successMessage: "Your bid has been placed successfully!",
  },
  sell: {
    icon: <TrendingUp size={24} />,
    label: "Energy Listing",
    successMessage: "Your energy has been listed for sale!",
  },
  claim: {
    icon: <Wallet size={24} />,
    label: "Claim Earnings",
    successMessage: "Your earnings have been sent to your wallet!",
  },
  cancel: {
    icon: <XCircle size={24} />,
    label: "Cancel Order",
    successMessage: "Your order has been cancelled.",
  },
  clear: {
    icon: <CheckCircle2 size={24} />,
    label: "Clear Market",
    successMessage: "Market has been cleared successfully!",
  },
  mint: {
    icon: <Image size={24} />,
    label: "Mint NFT",
    successMessage: "Your NFT has been minted successfully!",
  },
  bridge_deposit: {
    icon: <ArrowUp size={24} />,
    label: "Bridge Deposit",
    successMessage: "Your ETH has been bridged successfully!",
  },
  bridge_withdraw: {
    icon: <ArrowDown size={24} />,
    label: "Bridge Withdrawal",
    successMessage: "Withdrawal initiated! It will complete in ~7 days.",
  },
  bridge_nft_l1: {
    icon: <ArrowUpDown size={24} />,
    label: "Bridge NFT to L2",
    successMessage: "Your NFT has been bridged to L2 successfully!",
  },
  bridge_nft_l2: {
    icon: <ArrowUpDown size={24} />,
    label: "Bridge NFT to L1",
    successMessage: "Bridge initiated! Check pending NFTs for status.",
  },
  bridge_execute: {
    icon: <ArrowDown size={24} />,
    label: "Claim Withdrawal",
    successMessage: "Your withdrawal has been claimed successfully!",
  },
  bridge_nft_execute: {
    icon: <ArrowUpDown size={24} />,
    label: "Claim NFT",
    successMessage: "Your NFT has been claimed successfully!",
  },
};

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  status,
  hash,
  error,
  details,
  onClose,
  onRetry,
  explorerUrl = "https://sepolia.arbiscan.io",
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const copyHash = () => {
    if (hash) {
      navigator.clipboard.writeText(hash);
      setCopied(true);
    }
  };

  const config = statusConfig[status];
  const typeInfo = details?.type ? typeConfig[details.type] : null;

  if (status === "idle") return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && (status === "success" || status === "error")) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-gray-900 border border-white/10 shadow-2xl"
          >
            {/* Header with gradient */}
            <div className={`relative p-6 bg-gradient-to-br ${config.bgGradient}`}>
              {/* Background decoration */}
              <div className="absolute inset-0 overflow-hidden">
                <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-${config.color}-500/10 blur-3xl`} />
                <div className={`absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-${config.color}-500/10 blur-2xl`} />
              </div>

              <div className="relative flex flex-col items-center text-center">
                {/* Status Icon */}
                <div className="mb-4">
                  {status === "pending" && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center"
                    >
                      <Loader2 size={32} className="text-blue-400" />
                    </motion.div>
                  )}
                  {status === "confirming" && (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center"
                    >
                      <Loader2 size={32} className="text-amber-400 animate-spin" />
                    </motion.div>
                  )}
                  {status === "bridging" && (
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center"
                    >
                      <ArrowUpDown size={32} className="text-purple-400" />
                    </motion.div>
                  )}
                  {status === "success" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 15 }}
                      className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center"
                    >
                      <CheckCircle2 size={32} className="text-emerald-400" />
                    </motion.div>
                  )}
                  {status === "error" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 15 }}
                      className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center"
                    >
                      <XCircle size={32} className="text-red-400" />
                    </motion.div>
                  )}
                </div>

                {/* Type badge */}
                {typeInfo && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-${config.color}-500/20 text-${config.color}-400 text-xs font-medium mb-3`}>
                    {typeInfo.icon}
                    <span>{typeInfo.label}</span>
                  </div>
                )}

                {/* Title */}
                <h3 className="text-xl font-bold text-white mb-1">{config.title}</h3>
                <p className="text-sm text-gray-400">
                  {status === "success" && typeInfo
                    ? typeInfo.successMessage
                    : config.subtitle}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Transaction details */}
              {details && status !== "error" && (
                <div className="p-4 rounded-xl bg-white/5 space-y-3">
                  {details.amount !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Amount</span>
                      <span className="text-sm font-semibold text-white">{details.amount} kWh</span>
                    </div>
                  )}
                  {details.hours !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Duration</span>
                      <span className="text-sm font-semibold text-white">
                        {details.hours} {details.hours === 1 ? "hour" : "hours"}
                      </span>
                    </div>
                  )}
                  {details.totalCost && (
                    <>
                      <div className="h-px bg-white/10" />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Total Cost</span>
                        <span className="text-sm font-bold text-white">
                          {details.totalCost} {details.currency || "ETH"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Error message */}
              {status === "error" && error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-400 mb-1">Error Details</p>
                      <p className="text-xs text-red-300/80 break-words">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction hash */}
              {hash && (
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-xs text-gray-500 mb-2">Transaction Hash</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-gray-300 font-mono truncate">
                      {hash}
                    </code>
                    <button
                      onClick={copyHash}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      title="Copy hash"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <a
                      href={`${explorerUrl}/tx/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                      title="View on explorer"
                    >
                      <ExternalLink size={14} />
                    </a>
                  </div>
                </div>
              )}

              {/* Progress indicator for confirming */}
              {status === "confirming" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Waiting for confirmation...</span>
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-amber-400"
                    >
                      Processing
                    </motion.span>
                  </div>
                  <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      style={{ width: "50%" }}
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                {status === "success" && (
                  <Button fullWidth onClick={onClose}>
                    Done
                  </Button>
                )}
                {status === "error" && (
                  <>
                    <Button variant="secondary" fullWidth onClick={onClose}>
                      Close
                    </Button>
                    {onRetry && (
                      <Button fullWidth onClick={onRetry}>
                        Try Again
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default TransactionModal;
