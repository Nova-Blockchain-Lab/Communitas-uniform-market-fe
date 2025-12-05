import React, { useState } from "react";
import { ArrowDown, Loader2, Clock } from "lucide-react";
import { useToast } from "@chakra-ui/react";
import { BigNumber } from "ethers";
import { EthBridger, getArbitrumNetwork } from "@arbitrum/sdk";
import { motion } from "framer-motion";
import { useAccount } from "wagmi";

import { useEthersSigner } from "@/utils/ethersHelper";
import { useAppContext } from "@/context/AppContext";

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
  const { l2Provider } = useAppContext();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleWithdrawal = async () => {
    if (!signer || !l2Provider || !address || !amount) return;

    setIsLoading(true);

    try {
      const childChainNetwork = await getArbitrumNetwork(l2Provider);
      const ethBridger = new EthBridger(childChainNetwork);

      const withdrawTransaction = await ethBridger.withdraw({
        from: address,
        amount: BigNumber.from(amount.toString()),
        childSigner: signer,
        destinationAddress: address,
      });

      const withdrawTransactionReceipt = await withdrawTransaction.wait();
      const withdrawEventsData = withdrawTransactionReceipt.getChildToParentEvents();

      console.log("Withdrawal data:", withdrawEventsData);

      toast({
        title: "Withdrawal Initiated",
        description: "Your withdrawal has been submitted. It will take approximately 7 days to complete due to the challenge period.",
        status: "info",
        duration: 10000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      toast({
        title: "Withdrawal Failed",
        description: error?.message || "An error occurred during the withdrawal.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled = isLoading || !hasEnoughBalance || amount === BigInt(0);

  return (
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
            <Loader2 size={18} className="animate-spin" />
            Processing Withdrawal...
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
  );
};
