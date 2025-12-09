import React, { useState } from "react";
import { ArrowDown, Clock } from "lucide-react";
import { BigNumber } from "ethers";
import { EthBridger, getArbitrumNetwork } from "@arbitrum/sdk";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";

import { useEthersSigner } from "@/utils/ethersHelper";
import { useAppContext } from "@/context/AppContext";
import { TransactionModal, TransactionStatus } from "@/components/ui";

interface SubmitWithdrawalButtonProps {
  amount: bigint;
  hasEnoughBalance: boolean;
}

export const SubmitWithdrawalButton: React.FC<SubmitWithdrawalButtonProps> = ({
  amount,
  hasEnoughBalance,
}) => {
  const { address } = useAccount();
  const signer = useEthersSigner();
  const { l2Provider, ethPrice } = useAppContext();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txError, setTxError] = useState<string | undefined>();
  const [txHash, setTxHash] = useState<string | undefined>();

  const handleWithdrawal = async () => {
    if (!signer || !l2Provider || !address || !amount) return;

    setIsModalOpen(true);
    setTxStatus("pending");
    setTxError(undefined);
    setTxHash(undefined);

    try {
      const childChainNetwork = await getArbitrumNetwork(l2Provider);
      const ethBridger = new EthBridger(childChainNetwork);

      const withdrawTransaction = await ethBridger.withdraw({
        from: address,
        amount: BigNumber.from(amount.toString()),
        childSigner: signer,
        destinationAddress: address,
      });

      setTxHash(withdrawTransaction.hash);
      setTxStatus("confirming");

      const withdrawTransactionReceipt = await withdrawTransaction.wait();
      const withdrawEventsData = withdrawTransactionReceipt.getChildToParentEvents();

      console.log("Withdrawal data:", withdrawEventsData);

      // For withdrawals, success means the L2 transaction was confirmed
      // The actual withdrawal completes after the ~7 day challenge period
      setTxStatus("success");
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      setTxStatus("error");
      let message = error?.message || "An error occurred during the withdrawal.";
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

  const isDisabled = txStatus === "pending" || txStatus === "confirming" || !hasEnoughBalance || amount === BigInt(0);
  const isLoading = txStatus === "pending" || txStatus === "confirming";

  const amountInETH = Number(amount) / 10 ** 18;
  const amountInEUR = ethPrice ? amountInETH * ethPrice : 0;

  return (
    <>
      <div className="space-y-3">
        <motion.button
          whileHover={isDisabled ? {} : { scale: 1.02 }}
          whileTap={isDisabled ? {} : { scale: 0.98 }}
          onClick={handleWithdrawal}
          disabled={isDisabled}
          className={`
            w-full flex items-center justify-center gap-2
            px-6 py-4
            text-white font-semibold
            rounded-xl
            transition-all duration-200
            ${isDisabled
              ? "bg-gray-600 cursor-not-allowed opacity-50"
              : "bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg hover:shadow-xl hover:shadow-blue-500/25"
            }
          `}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {txStatus === "pending" ? "Confirm in Wallet..." : "Processing..."}
            </>
          ) : (
            <>
              <ArrowDown size={18} />
              Withdraw to Arbitrum
            </>
          )}
        </motion.button>

        {/* Warning about withdrawal time */}
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
          <Clock size={14} />
          <span>Withdrawals take ~7 days due to the challenge period</span>
        </div>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        status={txStatus}
        hash={txHash}
        error={txError}
        details={{
          type: "bridge_withdraw",
          totalCost: amountInETH.toFixed(6),
          currency: "ETH",
        }}
        onClose={closeModal}
        onRetry={handleWithdrawal}
      />
    </>
  );
};
