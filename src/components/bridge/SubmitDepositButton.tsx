import React, { useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { Spinner, useToast, ToastId } from "@chakra-ui/react";
import { BigNumber } from "ethers";
import { EthBridger, EthDepositMessageStatus, getArbitrumNetwork } from "@arbitrum/sdk";
import { motion } from "framer-motion";

import { useEthersSigner } from "@/utils/ethersHelper";
import { useAppContext } from "@/context/AppContext";
import { defaultChain } from "@/config";

interface SubmitDepositButtonProps {
  amount: bigint;
  hasEnoughBalance: boolean;
}

export const SubmitDepositButton: React.FC<SubmitDepositButtonProps> = ({
  amount,
  hasEnoughBalance,
}) => {
  const signer = useEthersSigner();
  const { l2Provider } = useAppContext();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDeposit = async () => {
    if (!signer || !l2Provider || !amount) return;

    setIsLoading(true);

    try {
      const childChainNetwork = getArbitrumNetwork(defaultChain.id);
      const ethBridger = new EthBridger(childChainNetwork);

      const depositTransaction = await ethBridger.deposit({
        amount: BigNumber.from(amount.toString()),
        parentSigner: signer,
      });

      const depositTransactionReceipt = await depositTransaction.wait();

      const toastId = toast({
        title: "Transaction Confirmed",
        description: `Waiting for bridge confirmation on ${defaultChain.name}. This may take up to 15 minutes.`,
        status: "loading",
        duration: null,
        isClosable: true,
      });

      const transactionResult = await depositTransactionReceipt.waitForChildTransactionReceipt(
        l2Provider
      );

      toast.close(toastId);

      if (transactionResult.complete) {
        toast({
          title: "Bridge Complete!",
          description: `Your ETH has been successfully bridged to ${defaultChain.name}.`,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Bridge Failed",
          description: `Message failed execution. Status: ${
            EthDepositMessageStatus[await transactionResult.message.status()]
          }`,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      console.error("Deposit error:", error);
      toast({
        title: "Transaction Failed",
        description: error?.message || "An error occurred during the deposit.",
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
          <Loader2 size={18} className="animate-spin" />
          Processing Deposit...
        </>
      ) : (
        <>
          <ArrowUp size={18} />
          Deposit to Nova Cidade
        </>
      )}
    </motion.button>
  );
};
