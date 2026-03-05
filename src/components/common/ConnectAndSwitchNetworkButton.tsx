import React from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { motion } from "motion/react";
import { Wallet, RefreshCw, AlertTriangle } from "lucide-react";

import { defaultChain } from "@/config";
import { Button } from "@/components/ui";

const ConnectAndSwitchNetworkButton: React.FC = () => {
  const { isConnected, chain } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { id: defaultChainId, name: defaultChainName } = defaultChain;

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <motion.div
          className="relative p-4 rounded-full bg-blue-500/10"
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
          <Wallet size={32} className="text-blue-400" />
        </motion.div>
        <div className="text-center">
          <p className="font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>Connect Your Wallet</p>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Connect to interact with the energy market
          </p>
        </div>
        <appkit-button />
      </div>
    );
  }

  if (chain?.id !== defaultChainId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-4 py-4"
      >
        <motion.div
          className="p-4 rounded-full bg-amber-500/10"
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
          <AlertTriangle size={32} className="text-amber-400" />
        </motion.div>
        <div className="text-center">
          <p className="font-medium mb-1" style={{ color: 'var(--color-text-primary)' }}>Wrong Network</p>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Please switch to {defaultChainName}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => switchChain({ chainId: defaultChainId })}
          loading={isSwitching}
          disabled={isSwitching}
          icon={<RefreshCw size={16} />}
        >
          {isSwitching ? "Switching..." : "Switch Network"}
        </Button>
      </motion.div>
    );
  }

  return null;
};

export default ConnectAndSwitchNetworkButton;
