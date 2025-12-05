"use client";
import React from "react";
import { Wallet, ArrowRight, RefreshCw } from "lucide-react";
import { useAccount, useSwitchChain } from "wagmi";
import { motion } from "framer-motion";

import { defaultChain } from "@/config";
import { SubmitDepositButton } from "./SubmitDepositButton";
import { SubmitWithdrawalButton } from "./SubmitWithdrawalButton";

interface SubmitButtonProps {
  originNetwork: number;
  amount: bigint;
  hasEnoughBalance: boolean;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  originNetwork,
  amount,
  hasEnoughBalance,
}) => {
  const { isConnected, chain } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="p-3 rounded-full bg-emerald-500/10">
          <Wallet size={24} className="text-emerald-400" />
        </div>
        <p className="text-sm text-gray-400">Connect wallet to bridge</p>
        <w3m-connect-button />
      </div>
    );
  }

  if (originNetwork !== chain?.id) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => switchChain({ chainId: originNetwork })}
        disabled={isSwitching}
        className="
          w-full flex items-center justify-center gap-2
          px-6 py-4
          bg-gradient-to-r from-amber-600 to-amber-500 text-white font-semibold
          rounded-xl
          shadow-lg hover:shadow-xl hover:shadow-amber-500/25
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isSwitching ? (
          <>
            <RefreshCw size={18} className="animate-spin" />
            Switching...
          </>
        ) : (
          <>
            <RefreshCw size={18} />
            Switch to {originNetwork === defaultChain.id ? "Nova Cidade" : "Arbitrum"}
          </>
        )}
      </motion.button>
    );
  }

  if (originNetwork === defaultChain.id) {
    return <SubmitWithdrawalButton amount={amount} hasEnoughBalance={hasEnoughBalance} />;
  }

  return <SubmitDepositButton amount={amount} hasEnoughBalance={hasEnoughBalance} />;
};
