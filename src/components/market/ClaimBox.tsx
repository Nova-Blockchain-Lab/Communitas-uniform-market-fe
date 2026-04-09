import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Wallet, Coins, ArrowDown, Info, RefreshCw, CheckCircle2, XCircle, PartyPopper } from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";

import EnergyBiddingMarketAbi from "@/../abi/EnergyBiddingMarket.json";
import { DECIMALS, defaultChain } from "@/config";
import { useAppContext } from "@/context/AppContext";
import { useMarketToast } from "@/hooks/useMarketToast";
import ConnectAndSwitchNetworkButton from "@/components/common/ConnectAndSwitchNetworkButton";
import { Card, CardHeader, Button, SkeletonLine, EmptyState, type TransactionStatus } from "@/components/ui";

/* -------------------------------------------------------------------------- */
/*  Address validation helper                                                 */
/* -------------------------------------------------------------------------- */
const ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

type AddressStatus = "empty" | "valid" | "short" | "long" | "invalid";

const validateAddress = (addr: string): AddressStatus => {
  if (addr.length === 0) return "empty";
  if (ADDRESS_REGEX.test(addr)) return "valid";
  if (addr.length < 42) return "short";
  if (addr.length > 42) return "long";
  return "invalid";
};

/* -------------------------------------------------------------------------- */
/*  Stable style constants                                                    */
/* -------------------------------------------------------------------------- */
const balanceGradientClass =
  "relative overflow-hidden p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 mb-4 sm:mb-6";

const refreshButtonClass =
  "p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors";

const destinationContainerClass =
  "p-3 sm:p-4 bg-white/5 rounded-xl mb-4 sm:mb-6";

const inputBaseClass =
  "w-full px-3 py-3 sm:py-2 pr-10 rounded-lg bg-white/5 border text-sm text-white placeholder-gray-500 focus:outline-none transition-colors min-h-[44px]";

const infoNoteClass =
  "mt-3 sm:mt-4 flex items-start gap-2 text-xs text-gray-500";

const errorPanelClass =
  "mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20";

const arrowBounceTransition = { repeat: Infinity, duration: 1.5 } as const;

const celebrationRotateAnimation = { rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] };
const celebrationRotateTransition = { duration: 0.6 } as const;

const fadeInInitial = { opacity: 0, scale: 0.8 } as const;
const fadeInAnimate = { opacity: 1, scale: 1 } as const;

const slideInInitial = { opacity: 0, height: 0 } as const;
const slideInAnimate = { opacity: 1, height: "auto" as const } as const;

const scaleInInitial = { scale: 0.95, opacity: 0 } as const;
const scaleInAnimate = { scale: 1, opacity: 1 } as const;

const arrowBounceAnimate = { y: [0, 8, 0] };

/* -------------------------------------------------------------------------- */
/*  Confetti burst on successful claim                                        */
/* -------------------------------------------------------------------------- */
const SuccessCelebration: React.FC = React.memo(() => (
  <motion.div
    initial={fadeInInitial}
    animate={fadeInAnimate}
    exit={fadeInInitial}
    className="flex flex-col items-center gap-2 py-4 sm:py-6"
  >
    <motion.div
      animate={celebrationRotateAnimation}
      transition={celebrationRotateTransition}
      className="p-3 rounded-full bg-emerald-500/20 text-emerald-400"
    >
      <PartyPopper size={28} />
    </motion.div>
    <p className="text-sm font-medium text-emerald-400">Claim successful!</p>
    <p className="text-xs text-gray-500">Earnings sent to your wallet</p>
  </motion.div>
));
SuccessCelebration.displayName = "SuccessCelebration";

/* -------------------------------------------------------------------------- */
/*  Address validation message                                                */
/* -------------------------------------------------------------------------- */
interface ValidationMessageProps {
  status: AddressStatus;
  charCount: number;
}

const ValidationMessage: React.FC<ValidationMessageProps> = React.memo(({ status, charCount }) => {
  if (status === "empty") return null;

  if (status === "valid") {
    return (
      <p className="mt-1.5 text-xs text-emerald-400 flex items-center gap-1">
        <CheckCircle2 size={12} />
        Valid Ethereum address
      </p>
    );
  }

  if (status === "short") {
    return (
      <p className="mt-1.5 text-xs text-amber-400 flex items-center gap-1">
        Address too short ({charCount}/42 characters)
      </p>
    );
  }

  if (status === "long") {
    return (
      <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
        <XCircle size={12} />
        Address too long ({charCount}/42 characters)
      </p>
    );
  }

  return (
    <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
      <XCircle size={12} />
      Invalid format - must start with 0x followed by 40 hex characters
    </p>
  );
});
ValidationMessage.displayName = "ValidationMessage";

/* -------------------------------------------------------------------------- */
/*  ClaimBox                                                                  */
/* -------------------------------------------------------------------------- */
const ClaimBox: React.FC = () => {
  const { isConnected, address, chainId } = useAccount();
  const { ethPrice, energyMarketAddress } = useAppContext();
  const toast = useMarketToast();

  const [claimToOther, setClaimToOther] = useState(false);
  const [customAddress, setCustomAddress] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);

  // Modal state
  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txError, setTxError] = useState<string | undefined>();

  // Contract interactions
  const { data: hash, isPending: isWritePending, writeContract, error: writeError, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({ hash });

  const readContractArgs = useMemo(
    () =>
      chainId === defaultChain.id && energyMarketAddress
        ? {
            abi: EnergyBiddingMarketAbi,
            address: energyMarketAddress,
            functionName: "balanceOf" as const,
            args: [address],
          }
        : undefined,
    [chainId, energyMarketAddress, address],
  );

  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useReadContract(readContractArgs);

  /* ---------------------------------------------------------------------- */
  /*  Derived / memoised values                                              */
  /* ---------------------------------------------------------------------- */
  const balance = useMemo(
    () => (balanceData ? Number(balanceData) / 10 ** DECIMALS : 0),
    [balanceData],
  );

  const balanceInEUR = useMemo(
    () => (ethPrice ? balance * ethPrice : 0),
    [ethPrice, balance],
  );

  const hasBalance = balance > 0;

  const isLoading = isWritePending || isConfirming;

  const needsConnection = useMemo(
    () => !isConnected || (chainId !== undefined && defaultChain.id !== chainId),
    [isConnected, chainId],
  );

  const addressValidation = useMemo(() => validateAddress(customAddress), [customAddress]);

  const inputBorderClass = useMemo(() => {
    switch (addressValidation) {
      case "empty":
        return "border-white/10 focus:border-blue-500/50";
      case "valid":
        return "border-emerald-500/50 focus:border-emerald-500/70";
      default:
        return "border-red-500/50 focus:border-red-500/70";
    }
  }, [addressValidation]);

  const formattedBalance = useMemo(() => balance.toFixed(6), [balance]);
  const formattedBalanceEUR = useMemo(() => balanceInEUR.toFixed(2), [balanceInEUR]);

  /* ---------------------------------------------------------------------- */
  /*  Transaction status tracking                                           */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (isWritePending) {
      setTxStatus("pending");
    } else if (isConfirming) {
      setTxStatus("confirming");
    } else if (isConfirmed) {
      setTxStatus("success");
      refetchBalance();
    } else if (writeError || confirmError) {
      setTxStatus("error");
      const err = writeError || confirmError;
      if (err) {
        let message = err.message;
        if (message.includes("User rejected") || message.includes("user rejected")) {
          message = "Transaction was rejected in your wallet";
        } else if (message.includes("insufficient funds")) {
          message = "Insufficient gas for this transaction";
        } else if (message.length > 150) {
          message = message.substring(0, 150) + "...";
        }
        setTxError(message);
      }
    }
  }, [isWritePending, isConfirming, isConfirmed, writeError, confirmError, refetchBalance]);

  /* ---------------------------------------------------------------------- */
  /*  Success celebration                                                    */
  /* ---------------------------------------------------------------------- */
  useEffect(() => {
    if (!hash || isConfirming) return;
    if (isConfirmed) {
      refetchBalance();
      setShowCelebration(true);
      toast.success("Earnings Claimed!", "Your earnings have been sent to your wallet.");
      const timer = setTimeout(() => setShowCelebration(false), 4000);
      return () => clearTimeout(timer);
    } else {
      toast.error("Claim Failed", "Something went wrong. Please try again.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirming, isConfirmed, hash, refetchBalance]);

  /* ---------------------------------------------------------------------- */
  /*  Handlers                                                              */
  /* ---------------------------------------------------------------------- */
  const handleRefresh = useCallback(() => {
    refetchBalance();
  }, [refetchBalance]);

  const handleToggleClaimToOther = useCallback(() => {
    setClaimToOther((prev) => !prev);
  }, []);

  const handleAddressChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomAddress(e.target.value);
    },
    [],
  );

  const handleClaim = useCallback(() => {
    if (!hasBalance) {
      toast.info("No Claimable Balance", "You don't have any earnings to claim.");
      return;
    }

    if (!energyMarketAddress) {
      toast.error("Region Not Selected", "Please select a region first.");
      return;
    }

    if (claimToOther) {
      if (addressValidation !== "valid") {
        toast.error("Invalid Address", "Please enter a valid Ethereum address.");
        return;
      }
      writeContract({
        abi: EnergyBiddingMarketAbi,
        address: energyMarketAddress,
        functionName: "claimBalanceTo",
        args: [customAddress],
      });
    } else {
      writeContract({
        abi: EnergyBiddingMarketAbi,
        address: energyMarketAddress,
        functionName: "claimBalance",
      });
    }
  }, [hasBalance, energyMarketAddress, claimToOther, addressValidation, customAddress, writeContract, toast]);

  const handleDismissError = useCallback(() => {
    setTxStatus("idle");
    setTxError(undefined);
  }, []);

  /* ---------------------------------------------------------------------- */
  /*  Button label                                                          */
  /* ---------------------------------------------------------------------- */
  const buttonLabel = useMemo(() => {
    if (isWritePending) return "Waiting for wallet...";
    if (isConfirming) return "Confirming on-chain...";
    if (hasBalance) return "Claim Earnings";
    return "No Balance to Claim";
  }, [isWritePending, isConfirming, hasBalance]);

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                */
  /* ---------------------------------------------------------------------- */
  return (
    <div className="w-full max-w-md">
      <Card padding="lg">
        <CardHeader
          title="Claim Earnings"
          subtitle="Withdraw your available balance"
          icon={<Wallet size={20} />}
          action={
            !needsConnection && (
              <button
                onClick={handleRefresh}
                className={refreshButtonClass}
                aria-label="Refresh balance"
              >
                <RefreshCw size={16} className={isBalanceLoading ? "animate-spin" : ""} />
              </button>
            )
          }
        />

        {needsConnection ? (
          <div className="py-6 sm:py-8">
            <ConnectAndSwitchNetworkButton />
          </div>
        ) : (
          <>
            {/* Success Celebration Overlay */}
            <AnimatePresence>
              {showCelebration && <SuccessCelebration />}
            </AnimatePresence>

            {/* Balance Display */}
            <motion.div
              initial={scaleInInitial}
              animate={scaleInAnimate}
              className={balanceGradientClass}
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />

              <div className="relative">
                <p className="text-xs sm:text-sm text-gray-400 mb-1">Available Balance</p>

                {isBalanceLoading ? (
                  <div className="space-y-3 py-2">
                    <SkeletonLine width="70%" height="2.5rem" />
                    <SkeletonLine width="40%" height="1.25rem" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2 sm:gap-3 mb-1 sm:mb-2 flex-wrap">
                      <span className="text-2xl sm:text-4xl font-bold text-white break-all">
                        {formattedBalance}
                      </span>
                      <span className="text-base sm:text-xl text-gray-400">ETH</span>
                    </div>

                    {ethPrice ? (
                      <p className="text-sm sm:text-lg text-gray-400">
                        ~{formattedBalanceEUR} EUR
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            </motion.div>

            {/* Visual indicator */}
            {hasBalance && !showCelebration && (
              <div className="flex justify-center mb-4 sm:mb-6">
                <motion.div
                  animate={arrowBounceAnimate}
                  transition={arrowBounceTransition}
                  className="p-2 sm:p-3 rounded-full bg-emerald-500/20 text-emerald-400"
                >
                  <ArrowDown size={20} className="sm:hidden" />
                  <ArrowDown size={24} className="hidden sm:block" />
                </motion.div>
              </div>
            )}

            {/* Empty state when no balance */}
            {!hasBalance && !isBalanceLoading && !showCelebration && (
              <EmptyState
                icon={<Coins size={20} className="text-gray-500" />}
                iconColorClass="bg-white/5"
                title="No earnings available"
                subtitle="Your matched energy trade earnings will appear here for withdrawal."
              />
            )}

            {/* Destination */}
            <div className={destinationContainerClass}>
              <div className="flex items-center justify-between mb-3 gap-2">
                <p className="text-xs text-gray-500">Claim to different address</p>
                <Switch
                  size="sm"
                  colorScheme="blue"
                  isChecked={claimToOther}
                  onChange={handleToggleClaimToOther}
                />
              </div>
              {claimToOther ? (
                <div>
                  <div className="relative">
                    <input
                      type="text"
                      value={customAddress}
                      onChange={handleAddressChange}
                      placeholder="0x..."
                      className={`${inputBaseClass} ${inputBorderClass}`}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    {/* Inline validation icon */}
                    {addressValidation !== "empty" && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {addressValidation === "valid" ? (
                          <CheckCircle2 size={16} className="text-emerald-400" />
                        ) : (
                          <XCircle size={16} className="text-red-400" />
                        )}
                      </div>
                    )}
                  </div>
                  <ValidationMessage status={addressValidation} charCount={customAddress.length} />
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20 shrink-0">
                    <Image src="/eth.png" alt="ETH" width={24} height={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-white truncate">
                      {address}
                    </p>
                    <p className="text-xs text-gray-500">Your connected wallet</p>
                  </div>
                </div>
              )}
            </div>

            {/* Claim Button */}
            <Button
              fullWidth
              size="lg"
              variant={hasBalance ? "success" : "secondary"}
              onClick={handleClaim}
              loading={isLoading}
              disabled={isLoading || !hasBalance}
              icon={<Coins size={18} />}
              className="min-h-[48px]"
            >
              {buttonLabel}
            </Button>

            {/* Transaction status feedback */}
            <AnimatePresence>
              {txStatus === "error" && txError && (
                <motion.div
                  initial={slideInInitial}
                  animate={slideInAnimate}
                  exit={slideInInitial}
                  className={errorPanelClass}
                >
                  <div className="flex items-start gap-2">
                    <XCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-400 break-words flex-1">{txError}</p>
                    <button
                      onClick={handleDismissError}
                      className="shrink-0 p-1 min-w-[28px] min-h-[28px] flex items-center justify-center rounded hover:bg-red-500/20 text-red-400 transition-colors"
                      aria-label="Dismiss error"
                    >
                      <XCircle size={12} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Info Note */}
            <div className={infoNoteClass}>
              <Info size={14} className="mt-0.5 shrink-0" />
              <p>
                Your earnings come from matched energy trades. The amount shown is the
                total available for withdrawal from this market region.
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default ClaimBox;
