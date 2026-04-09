import React, { useCallback, useMemo } from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { motion } from "motion/react";
import { Wallet, RefreshCw, AlertTriangle } from "lucide-react";

import { defaultChain } from "@/config";
import { Button } from "@/components/ui";

const ConnectAndSwitchNetworkButton: React.FC = () => {
  const { isConnected, chain } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const { id: defaultChainId, name: defaultChainName } = defaultChain;

  const isWrongNetwork = useMemo(
    () => isConnected && chain?.id !== defaultChainId,
    [isConnected, chain?.id, defaultChainId],
  );

  const handleSwitchNetwork = useCallback(() => {
    switchChain({ chainId: defaultChainId });
  }, [switchChain, defaultChainId]);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-3 sm:gap-4 py-3 sm:py-4 px-2">
        <motion.div
          className="relative p-3 sm:p-4 rounded-full bg-blue-500/10"
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(59, 130, 246, 0)",
              "0 0 0 12px rgba(59, 130, 246, 0.08)",
              "0 0 0 0 rgba(59, 130, 246, 0)",
            ],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Wallet size={28} className="text-blue-400 sm:hidden" />
          <Wallet size={32} className="text-blue-400 hidden sm:block" />
        </motion.div>
        <div className="text-center px-2">
          <p className="font-medium mb-1 text-sm sm:text-base" style={{ color: 'var(--color-text-primary)' }}>
            Connect Your Wallet
          </p>
          <p className="text-xs sm:text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Connect to interact with the energy market
          </p>
        </div>
        <appkit-button />
      </div>
    );
  }

  if (isWrongNetwork) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3 sm:gap-4 py-3 sm:py-4 px-2"
      >
        <motion.div
          className="p-3 sm:p-4 rounded-full bg-amber-500/10"
          style={{
            border: '2px solid var(--color-energy-400, #fbbf24)',
          }}
          animate={{
            borderColor: [
              "rgba(251, 191, 36, 0.6)",
              "rgba(251, 191, 36, 0.15)",
              "rgba(251, 191, 36, 0.6)",
            ],
            boxShadow: [
              "0 0 0 0 rgba(251, 191, 36, 0)",
              "0 0 12px 2px rgba(251, 191, 36, 0.15)",
              "0 0 0 0 rgba(251, 191, 36, 0)",
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <AlertTriangle size={28} className="text-amber-400 sm:hidden" />
          <AlertTriangle size={32} className="text-amber-400 hidden sm:block" />
        </motion.div>
        <div className="text-center px-2">
          <p className="font-medium mb-1 text-sm sm:text-base" style={{ color: 'var(--color-text-primary)' }}>
            Wrong Network
          </p>
          <p className="text-xs sm:text-sm max-w-[240px]" style={{ color: 'var(--color-text-secondary)' }}>
            Please switch to {defaultChainName}
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleSwitchNetwork}
          loading={isSwitching}
          disabled={isSwitching}
          icon={<RefreshCw size={16} className={isSwitching ? "animate-spin" : ""} />}
          className="w-full sm:w-auto max-w-[280px]"
        >
          {isSwitching ? "Switching..." : "Switch Network"}
        </Button>
      </motion.div>
    );
  }

  return null;
};

export default ConnectAndSwitchNetworkButton;
