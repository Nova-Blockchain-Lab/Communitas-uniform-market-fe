"use client";

import React, { useState, useCallback, useMemo } from "react";
import { ArrowUp } from "lucide-react";
import { BigNumber } from "ethers";
import { EthBridger, EthDepositMessageStatus, getArbitrumNetwork } from "@arbitrum/sdk";
import { motion } from "motion/react";

import { useEthersSigner } from "@/utils/ethersHelper";
import { defaultChain } from "@/config/chains";
import { TransactionModal, TransactionStatus } from "@/components/ui/TransactionModal";
import { l1Provider, l2Provider } from "@/config/providers";

interface SubmitDepositButtonProps {
  amount: bigint;
  hasEnoughBalance: boolean;
}

const SubmitDepositButtonInner: React.FC<SubmitDepositButtonProps> = ({
  amount,
  hasEnoughBalance,
}) => {
  const signer = useEthersSigner();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txError, setTxError] = useState<string | undefined>();
  const [txHash, setTxHash] = useState<string | undefined>();

  const handleDeposit = useCallback(async () => {
    if (!signer || !amount) return;

    setIsModalOpen(true);
    setTxStatus("pending");
    setTxError(undefined);
    setTxHash(undefined);

    try {
      const childChainNetwork = getArbitrumNetwork(defaultChain.id);
      const ethBridger = new EthBridger(childChainNetwork);

      // ponytail: read through our own keyed parent-chain RPC, never the wallet's.
      // MetaMask's built-in Arbitrum Sepolia endpoint is shared across all its users
      // and returns -32005 "Request is being rate limited" under load. ethers routes
      // getBlock and estimateGas through signer.provider (the wallet) unless we hand
      // it the answers, which used to kill the deposit before the popup ever opened.
      // MetaMask still signs and broadcasts; it just no longer does our reads.
      const readProvider = l1Provider;

      // Arbitrum Sepolia's base fee fluctuates within seconds and the default
      // ethers v5 estimation (maxFeePerGas = baseFee*2) routinely lands below
      // the next block's baseFee, causing "max fee per gas less than block
      // base fee" reverts. Apply a 5x buffer over the current base fee.
      const latestBlock = await readProvider.getBlock("latest");
      const baseFee = latestBlock.baseFeePerGas ?? BigNumber.from(0);
      const maxPriorityFeePerGas = BigNumber.from(0); // Arbitrum sequencer ignores priority fee
      const maxFeePerGas = baseFee.mul(5).add(maxPriorityFeePerGas);

      // Estimate here so ethers does not ask the wallet to. getDepositRequest only
      // encodes calldata locally, so this costs one call on our own RPC.
      const depositAmount = BigNumber.from(amount.toString());
      let gasLimit: BigNumber | undefined;
      try {
        const { txRequest } = await ethBridger.getDepositRequest({
          amount: depositAmount,
          from: await signer.getAddress(),
        });
        gasLimit = (await readProvider.estimateGas(txRequest)).mul(3).div(2);
      } catch {
        // Leave undefined and let ethers estimate through the wallet as before.
      }

      const depositTransaction = await ethBridger.deposit({
        amount: depositAmount,
        parentSigner: signer,
        overrides: { maxFeePerGas, maxPriorityFeePerGas, ...(gasLimit ? { gasLimit } : {}) },
      });

      setTxHash(depositTransaction.hash);
      setTxStatus("confirming");

      const depositTransactionReceipt = await depositTransaction.wait();

      setTxStatus("bridging");

      const transactionResult = await depositTransactionReceipt.waitForChildTransactionReceipt(
        l2Provider
      );

      if (transactionResult.complete) {
        setTxStatus("success");
      } else {
        setTxStatus("error");
        setTxError(`Bridge failed. Status: ${EthDepositMessageStatus[await transactionResult.message.status()]}`);
      }
    } catch (error: any) {
      console.error("Deposit error:", error);
      setTxStatus("error");
      let message = error?.message || "An error occurred during the deposit.";
      if (message.includes("User rejected") || message.includes("user rejected")) {
        message = "Transaction was rejected in your wallet";
      } else if (message.length > 150) {
        message = message.substring(0, 150) + "...";
      }
      setTxError(message);
    }
  }, [signer, amount]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => {
      setTxStatus("idle");
      setTxError(undefined);
      setTxHash(undefined);
    }, 300);
  }, []);

  const isDisabled = txStatus === "pending" || txStatus === "confirming" || txStatus === "bridging" || !hasEnoughBalance || amount === BigInt(0);
  const isLoading = txStatus === "pending" || txStatus === "confirming" || txStatus === "bridging";

  const amountInETH = Number(amount) / 10 ** 18;

  const buttonLabel = useMemo(() => {
    if (isLoading) {
      if (txStatus === "pending") return "Confirm in Wallet...";
      if (txStatus === "bridging") return "Bridging...";
      return "Processing...";
    }
    if (amount === BigInt(0)) return "Enter an amount";
    if (!hasEnoughBalance) return "Insufficient balance";
    return "Deposit to Nova Cidade";
  }, [isLoading, txStatus, amount, hasEnoughBalance]);

  return (
    <>
      <motion.button
        whileHover={isDisabled ? {} : { scale: 1.02 }}
        whileTap={isDisabled ? {} : { scale: 0.98 }}
        onClick={handleDeposit}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={`
          w-full flex items-center justify-center gap-2
          min-h-[48px] px-5 sm:px-6 py-3 sm:py-4
          text-white font-semibold text-sm sm:text-base
          rounded-xl
          transition-all duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60
          ${isDisabled
            ? "bg-gray-600 cursor-not-allowed opacity-50"
            : "bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg hover:shadow-xl hover:shadow-emerald-500/25"
          }
        `}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
            <span className="truncate">{buttonLabel}</span>
          </>
        ) : (
          <>
            <ArrowUp size={18} className="shrink-0" />
            <span className="truncate">{buttonLabel}</span>
          </>
        )}
      </motion.button>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        status={txStatus}
        hash={txHash}
        error={txError}
        details={{
          type: "bridge_deposit",
          totalCost: amountInETH.toFixed(6),
          currency: "ETH",
        }}
        onClose={closeModal}
        onRetry={handleDeposit}
      />
    </>
  );
};

export const SubmitDepositButton = React.memo(SubmitDepositButtonInner);
