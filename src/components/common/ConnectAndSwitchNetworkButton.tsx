import React from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { motion } from "framer-motion";
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
        <div className="p-4 rounded-full bg-blue-500/10">
          <Wallet size={32} className="text-blue-400" />
        </div>
        <div className="text-center">
          <p className="text-white font-medium mb-1">Connect Your Wallet</p>
          <p className="text-sm text-gray-400">
            Connect to interact with the energy market
          </p>
        </div>
        <w3m-connect-button />
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
        <div className="p-4 rounded-full bg-amber-500/10">
          <AlertTriangle size={32} className="text-amber-400" />
        </div>
        <div className="text-center">
          <p className="text-white font-medium mb-1">Wrong Network</p>
          <p className="text-sm text-gray-400">
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
