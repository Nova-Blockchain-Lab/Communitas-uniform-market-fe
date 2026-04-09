"use client";
import React, { useCallback } from "react";
import { Wallet, RefreshCw } from "lucide-react";
import { useAccount, useSwitchChain } from "wagmi";
import { motion } from "motion/react";

import { defaultChain } from "@/config";
import { SubmitDepositButton } from "./SubmitDepositButton";
import { SubmitWithdrawalButton } from "./SubmitWithdrawalButton";

interface SubmitButtonProps {
  originNetwork: number;
  amount: bigint;
  hasEnoughBalance: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({
  originNetwork,
  amount,
  hasEnoughBalance,
}) => {
  const { isConnected, chain } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const handleSwitchChain = useCallback(() => {
    switchChain({ chainId: originNetwork });
  }, [switchChain, originNetwork]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="p-3 rounded-full bg-emerald-500/10">
          <Wallet size={24} className="text-emerald-400" />
        </div>
        <p className="text-sm text-gray-400">Connect wallet to bridge</p>
        <appkit-button />
      </div>
    );
  }

  if (originNetwork !== chain?.id) {
    const targetName = originNetwork === defaultChain.id ? "Nova Cidade" : "Arbitrum";
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSwitchChain}
        disabled={isSwitching}
        className="
          w-full flex items-center justify-center gap-2
          min-h-[48px] px-5 sm:px-6 py-3 sm:py-4
          bg-gradient-to-r from-amber-600 to-amber-500 text-white font-semibold
          text-sm sm:text-base
          rounded-xl
          shadow-lg hover:shadow-xl hover:shadow-amber-500/25
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60
        "
      >
        {isSwitching ? (
          <>
            <RefreshCw size={18} className="animate-spin shrink-0" />
            <span className="truncate">Switching...</span>
          </>
        ) : (
          <>
            <RefreshCw size={18} className="shrink-0" />
            <span className="truncate">Switch to {targetName}</span>
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

export { SubmitButton };
export default React.memo(SubmitButton);
