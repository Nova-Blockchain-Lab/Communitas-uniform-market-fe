import React from "react";
import { useAccount, useSwitchChain } from "wagmi";
import { Clock, ArrowRight, RefreshCw } from "lucide-react";

import { baseChain, defaultChain } from "@/config/chains";
import { type NFTDataWithStatus, WITHDRAWAL_STATUS } from "@/utils/executeMessageL2ToL1Helper";
import { useWithdrawal } from "@/hooks/useWithdrawal";
import { timeLeftLabel } from "@/utils/utils";
import { Button } from "@/components/ui/Button";
import { TransactionModal } from "@/components/ui/TransactionModal";

interface BridgeNFTL2ToL1ExecuteButtonProps {
  nft: NFTDataWithStatus;
  refetchNFTs: () => void;
}

const BridgeNFTL2ToL1ExecuteButton: React.FC<BridgeNFTL2ToL1ExecuteButtonProps> = ({ nft, refetchNFTs }) => {
  const { isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { status, isLoading, deadline, claim, tx } = useWithdrawal(nft.hash, WITHDRAWAL_STATUS[nft.state]);

  const handleExecute = async () => {
    if (await claim()) refetchNFTs();
  };

  let button: React.ReactNode;
  if (status === "pending" || isLoading || tx.isBusy) {
    button = (
      <div className="space-y-1">
        <Button variant="secondary" size="sm" fullWidth loading disabled icon={<Clock size={16} />} className="min-h-[44px]">
          {status === "pending" ? "Waiting" : "Processing"}
        </Button>
        {status === "pending" && deadline !== undefined && (
          <p className="text-xs text-amber-400 text-center">{timeLeftLabel(deadline)}</p>
        )}
      </div>
    );
  } else if (chainId === defaultChain.id) {
    button = (
      <Button
        variant="secondary"
        size="sm"
        fullWidth
        onClick={() => switchChain({ chainId: baseChain.id })}
        icon={<RefreshCw size={16} />}
        className="min-h-[44px]"
      >
        Switch Chain
      </Button>
    );
  } else {
    button = (
      <Button
        variant="primary"
        size="sm"
        fullWidth
        onClick={handleExecute}
        disabled={!isConnected}
        icon={<ArrowRight size={16} />}
        className="min-h-[44px]"
      >
        Execute
      </Button>
    );
  }

  return (
    <>
      {button}
      <TransactionModal
        isOpen={tx.isOpen}
        status={tx.status}
        hash={tx.hash}
        error={tx.error}
        details={{ type: "bridge_nft_execute" }}
        onClose={tx.close}
        onRetry={handleExecute}
      />
    </>
  );
};

export default BridgeNFTL2ToL1ExecuteButton;
