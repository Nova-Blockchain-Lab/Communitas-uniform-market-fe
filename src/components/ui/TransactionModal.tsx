import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
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
  ArrowDown,
  X,
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
    bgGradient: "from-blue-500/20 to-blue-600/10",
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-400",
    badgeBg: "bg-blue-500/20",
    badgeText: "text-blue-400",
    decorBg: "bg-blue-500/10",
  },
  confirming: {
    title: "Processing Transaction",
    subtitle: "Your transaction is being confirmed on the blockchain",
    bgGradient: "from-amber-500/20 to-orange-600/10",
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
    badgeBg: "bg-amber-500/20",
    badgeText: "text-amber-400",
    decorBg: "bg-amber-500/10",
  },
  bridging: {
    title: "Bridging in Progress",
    subtitle: "Waiting for cross-chain confirmation",
    bgGradient: "from-purple-500/20 to-purple-600/10",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
    badgeBg: "bg-purple-500/20",
    badgeText: "text-purple-400",
    decorBg: "bg-purple-500/10",
  },
  success: {
    title: "Transaction Successful",
    subtitle: "Your transaction has been confirmed",
    bgGradient: "from-emerald-500/20 to-green-600/10",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    badgeBg: "bg-emerald-500/20",
    badgeText: "text-emerald-400",
    decorBg: "bg-emerald-500/10",
  },
  error: {
    title: "Transaction Failed",
    subtitle: "Something went wrong with your transaction",
    bgGradient: "from-red-500/20 to-red-600/10",
    iconBg: "bg-red-500/20",
    iconColor: "text-red-400",
    badgeBg: "bg-red-500/20",
    badgeText: "text-red-400",
    decorBg: "bg-red-500/10",
  },
  idle: {
    title: "",
    subtitle: "",
    bgGradient: "",
    iconBg: "",
    iconColor: "",
    badgeBg: "",
    badgeText: "",
    decorBg: "",
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
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // Resolve portal target on mount (client-side only)
  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  // Body scroll lock when modal is open
  useEffect(() => {
    if (isOpen && status !== "idle") {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      return () => {
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
      };
    }
  }, [isOpen, status]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen || status === "idle") return;
    const canDismiss = status === "success" || status === "error";
    if (!canDismiss) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, status, onClose]);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const copyHash = useCallback(() => {
    if (hash) {
      navigator.clipboard.writeText(hash);
      setCopied(true);
    }
  }, [hash]);

  const config = statusConfig[status];
  const typeInfo = details?.type ? typeConfig[details.type] : null;
  const canDismiss = status === "success" || status === "error";

  if (status === "idle" || !portalTarget) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && canDismiss) {
              onClose();
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tx-modal-title"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-md max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-2xl"
          >
            {/* Header with gradient */}
            <div className={`relative p-5 sm:p-6 bg-gradient-to-br ${config.bgGradient}`}>
              {/* Close button -- touch-friendly 44x44 tap target */}
              {canDismiss && (
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 z-10 w-11 h-11 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 active:bg-white/15 text-[var(--color-text-muted)] hover:text-white transition-colors"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              )}

              {/* Background decoration */}
              <div className="absolute inset-0 overflow-hidden">
                <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full ${config.decorBg} blur-3xl`} />
                <div className={`absolute -bottom-8 -left-8 w-24 h-24 rounded-full ${config.decorBg} blur-2xl`} />
              </div>

              <div className="relative flex flex-col items-center text-center">
                {/* Status Icon */}
                <div className="mb-4">
                  {status === "pending" && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${config.iconBg} flex items-center justify-center`}
                    >
                      <Loader2 size={28} className={`${config.iconColor} sm:[&]:w-8 sm:[&]:h-8`} />
                    </motion.div>
                  )}
                  {status === "confirming" && (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${config.iconBg} flex items-center justify-center`}
                    >
                      <Loader2 size={28} className={`${config.iconColor} animate-spin sm:[&]:w-8 sm:[&]:h-8`} />
                    </motion.div>
                  )}
                  {status === "bridging" && (
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${config.iconBg} flex items-center justify-center`}
                    >
                      <ArrowUpDown size={28} className={`${config.iconColor} sm:[&]:w-8 sm:[&]:h-8`} />
                    </motion.div>
                  )}
                  {status === "success" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 15 }}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${config.iconBg} flex items-center justify-center`}
                    >
                      <CheckCircle2 size={28} className={`${config.iconColor} sm:[&]:w-8 sm:[&]:h-8`} />
                    </motion.div>
                  )}
                  {status === "error" && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 15 }}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full ${config.iconBg} flex items-center justify-center`}
                    >
                      <XCircle size={28} className={`${config.iconColor} sm:[&]:w-8 sm:[&]:h-8`} />
                    </motion.div>
                  )}
                </div>

                {/* Type badge */}
                {typeInfo && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.badgeBg} ${config.badgeText} text-xs font-medium mb-3`}>
                    {typeInfo.icon}
                    <span>{typeInfo.label}</span>
                  </div>
                )}

                {/* Title */}
                <h3 id="tx-modal-title" className="text-lg sm:text-xl font-bold text-white mb-1">{config.title}</h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] px-2">
                  {status === "success" && typeInfo
                    ? typeInfo.successMessage
                    : config.subtitle}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Transaction details */}
              {details && status !== "error" && (
                <div className="p-3 sm:p-4 rounded-xl bg-white/4 space-y-3">
                  {details.amount !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Amount</span>
                      <span className="text-xs sm:text-sm font-semibold text-white">{details.amount} kWh</span>
                    </div>
                  )}
                  {details.hours !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Duration</span>
                      <span className="text-xs sm:text-sm font-semibold text-white">
                        {details.hours} {details.hours === 1 ? "hour" : "hours"}
                      </span>
                    </div>
                  )}
                  {details.totalCost && (
                    <>
                      <div className="h-px bg-white/8" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-[var(--color-text-secondary)]">Total Cost</span>
                        <span className="text-xs sm:text-sm font-bold text-white">
                          {details.totalCost} {details.currency || "ETH"}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Error message */}
              {status === "error" && error && (
                <div className="p-3 sm:p-4 rounded-xl bg-red-500/8 border border-red-500/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-red-400 mb-1">Error Details</p>
                      <p className="text-xs text-red-300/80 break-words">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction hash */}
              {hash && (
                <div className="p-3 sm:p-4 rounded-xl bg-white/4">
                  <p className="text-xs text-[var(--color-text-muted)] mb-2">Transaction Hash</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs text-gray-300 font-mono truncate min-w-0">
                      {hash}
                    </code>
                    <button
                      onClick={copyHash}
                      className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 text-[var(--color-text-muted)] hover:text-white transition-colors shrink-0"
                      title="Copy hash"
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <a
                      href={`${explorerUrl}/tx/${hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 text-[var(--color-text-muted)] hover:text-white transition-colors shrink-0"
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
                    <span className="text-[var(--color-text-secondary)]">Waiting for confirmation...</span>
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-amber-400"
                    >
                      Processing
                    </motion.span>
                  </div>
                  <div className="h-1 rounded-full bg-white/8 overflow-hidden">
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

  return createPortal(modalContent, portalTarget);
};

export default TransactionModal;
