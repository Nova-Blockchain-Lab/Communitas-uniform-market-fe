import React, { useEffect, useState } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Wallet, Coins, ArrowDown, Info, RefreshCw, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

import EnergyBiddingMarketAbi from "@/../abi/EnergyBiddingMarket.json";
import { DECIMALS, defaultChain } from "@/config";
import { useAppContext } from "@/context/AppContext";
import ConnectAndSwitchNetworkButton from "@/components/common/ConnectAndSwitchNetworkButton";
import { Card, CardHeader, Button, Spinner } from "@/components/ui";
import { TransactionModal, TransactionStatus } from "@/components/ui/TransactionModal";

const ClaimBox: React.FC = () => {
  const { isConnected, address, chainId } = useAccount();
  const { ethPrice, energyMarketAddress } = useAppContext();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txError, setTxError] = useState<string | undefined>();

  // Validation state
  const [validationError, setValidationError] = useState<string | null>(null);

  // Contract interactions
  const { data: hash, isPending: isWritePending, writeContract, error: writeError, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({ hash });

  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useReadContract(
    chainId === defaultChain.id && energyMarketAddress
      ? {
          abi: EnergyBiddingMarketAbi.abi,
          address: energyMarketAddress,
          functionName: "balanceOf",
          args: [address],
        }
      : undefined
  );

  const balance = balanceData ? Number(balanceData) / 10 ** DECIMALS : 0;
  const balanceInEUR = ethPrice ? balance * ethPrice : 0;
  const hasBalance = balance > 0;

  // Update modal status based on transaction state
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

  // Live validation
  useEffect(() => {
    if (!hasBalance) {
      setValidationError(null);
      return;
    }

    if (!energyMarketAddress) {
      setValidationError("Please select a region first");
      return;
    }

    setValidationError(null);
  }, [hasBalance, energyMarketAddress]);

  const handleClaim = async () => {
    if (!hasBalance) {
      setValidationError("No balance to claim");
      return;
    }

    if (!energyMarketAddress) {
      setValidationError("Please select a region first");
      return;
    }

    // Open modal and reset state
    setIsModalOpen(true);
    setTxStatus("idle");
    setTxError(undefined);
    resetWrite();

    try {
      writeContract({
        abi: EnergyBiddingMarketAbi.abi,
        address: energyMarketAddress,
        functionName: "claimBalance",
      });
    } catch (err) {
      setTxStatus("error");
      setTxError("Failed to initiate transaction");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setTxStatus("idle");
      setTxError(undefined);
    }, 300);
  };

  const isLoading = isWritePending || isConfirming;
  const needsConnection = !isConnected || (chainId && defaultChain.id !== chainId);

  return (
    <>
      <div className="w-full max-w-md">
        <Card padding="lg">
          <CardHeader
            title="Claim Earnings"
            subtitle="Withdraw your available balance"
            icon={<Wallet size={20} />}
            action={
              !needsConnection && (
                <button
                  onClick={() => refetchBalance()}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title="Refresh balance"
                >
                  <RefreshCw size={16} className={isBalanceLoading ? "animate-spin" : ""} />
                </button>
              )
            }
          />

          {needsConnection ? (
            <div className="py-8">
              <ConnectAndSwitchNetworkButton />
            </div>
          ) : (
            <>
              {/* Balance Display */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative overflow-hidden p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 mb-4 md:mb-6"
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />

                <div className="relative">
                  <p className="text-xs sm:text-sm text-gray-400 mb-1">Available Balance</p>

                  {isBalanceLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Spinner size="lg" color="blue-400" />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2 sm:gap-3 mb-2">
                        <span className="text-2xl sm:text-4xl font-bold text-white">
                          {balance.toFixed(6)}
                        </span>
                        <span className="text-lg sm:text-xl text-gray-400">ETH</span>
                      </div>

                      {ethPrice && (
                        <p className="text-sm sm:text-lg text-gray-400">
                          ~{balanceInEUR.toFixed(2)} EUR
                        </p>
                      )}
                    </>
                  )}
                </div>
              </motion.div>

              {/* Visual indicator */}
              {hasBalance && (
                <div className="flex justify-center mb-4 md:mb-6">
                  <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="p-3 rounded-full bg-emerald-500/20 text-emerald-400"
                  >
                    <ArrowDown size={24} />
                  </motion.div>
                </div>
              )}

              {/* Destination */}
              <div className="p-3 sm:p-4 bg-white/5 rounded-xl mb-4 md:mb-6">
                <p className="text-xs text-gray-500 mb-2">Claim to</p>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20 shrink-0">
                    <Image src="/eth.png" alt="ETH" width={24} height={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-white truncate">
                      {address}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500">Your connected wallet</p>
                  </div>
                </div>
              </div>

              {/* Validation Error */}
              {validationError && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
                  <AlertCircle size={16} className="text-red-400 shrink-0" />
                  <p className="text-xs sm:text-sm text-red-400">{validationError}</p>
                </div>
              )}

              {/* Claim Button */}
              <Button
                fullWidth
                size="lg"
                variant={hasBalance ? "success" : "secondary"}
                onClick={handleClaim}
                loading={isLoading}
                disabled={isLoading || !hasBalance}
                icon={<Coins size={18} />}
              >
                {isLoading
                  ? "Processing..."
                  : hasBalance
                  ? "Claim Earnings"
                  : "No Balance to Claim"}
              </Button>

              {/* Info Note */}
              <div className="mt-4 flex items-start gap-2 text-[10px] sm:text-xs text-gray-500">
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

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        status={txStatus}
        hash={hash}
        error={txError}
        details={{
          type: "claim",
          totalCost: balance.toFixed(6),
          currency: "ETH",
        }}
        onClose={closeModal}
        onRetry={handleClaim}
      />
    </>
  );
};

export default ClaimBox;
