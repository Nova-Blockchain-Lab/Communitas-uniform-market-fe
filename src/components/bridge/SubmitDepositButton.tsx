import React, { useState } from "react";
import { ArrowUp } from "lucide-react";
import { BigNumber } from "ethers";
import { EthBridger, EthDepositMessageStatus, getArbitrumNetwork } from "@arbitrum/sdk";
import { motion } from "framer-motion";

import { useEthersSigner } from "@/utils/ethersHelper";
import { useAppContext } from "@/context/AppContext";
import { defaultChain } from "@/config";
import { TransactionModal, TransactionStatus } from "@/components/ui";

interface SubmitDepositButtonProps {
  amount: bigint;
  hasEnoughBalance: boolean;
}

export const SubmitDepositButton: React.FC<SubmitDepositButtonProps> = ({
  amount,
  hasEnoughBalance,
}) => {
  const signer = useEthersSigner();
  const { l2Provider, ethPrice } = useAppContext();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txError, setTxError] = useState<string | undefined>();
  const [txHash, setTxHash] = useState<string | undefined>();

  const handleDeposit = async () => {
    if (!signer || !l2Provider || !amount) return;

    setIsModalOpen(true);
    setTxStatus("pending");
    setTxError(undefined);
    setTxHash(undefined);

    try {
      const childChainNetwork = getArbitrumNetwork(defaultChain.id);
      const ethBridger = new EthBridger(childChainNetwork);

      const depositTransaction = await ethBridger.deposit({
        amount: BigNumber.from(amount.toString()),
        parentSigner: signer,
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
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setTxStatus("idle");
      setTxError(undefined);
      setTxHash(undefined);
    }, 300);
  };

  const isDisabled = txStatus === "pending" || txStatus === "confirming" || txStatus === "bridging" || !hasEnoughBalance || amount === BigInt(0);
  const isLoading = txStatus === "pending" || txStatus === "confirming" || txStatus === "bridging";

  const amountInETH = Number(amount) / 10 ** 18;
  const amountInEUR = ethPrice ? amountInETH * ethPrice : 0;

  return (
    <>
      <motion.button
        whileHover={isDisabled ? {} : { scale: 1.02 }}
        whileTap={isDisabled ? {} : { scale: 0.98 }}
        onClick={handleDeposit}
        disabled={isDisabled}
        className={`
          w-full flex items-center justify-center gap-2
          px-6 py-4
          text-white font-semibold
          rounded-xl
          transition-all duration-200
          ${isDisabled
            ? "bg-gray-600 cursor-not-allowed opacity-50"
            : "bg-gradient-to-r from-emerald-600 to-emerald-500 shadow-lg hover:shadow-xl hover:shadow-emerald-500/25"
          }
        `}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {txStatus === "pending" ? "Confirm in Wallet..." : txStatus === "bridging" ? "Bridging..." : "Processing..."}
          </>
        ) : (
          <>
            <ArrowUp size={18} />
            Deposit to Nova Cidade
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
