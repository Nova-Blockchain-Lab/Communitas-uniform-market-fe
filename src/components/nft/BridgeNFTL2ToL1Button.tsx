import React from "react";
import { useAccount } from "wagmi";
import { ArrowUpDown } from "lucide-react";
import CommunitasNFTL2 from "@/../abi/CommunitasNFTL2.json";
import { contractAddresses } from "@/config/constants";
import { NFTData } from "@/utils/executeMessageL2ToL1Helper";
import { useTransactionFeedback } from "@/hooks/useTransactionFeedback";
import { Button } from "@/components/ui/Button";
import { TransactionModal } from "@/components/ui/TransactionModal";

interface BridgeNFTL2ToL1ButtonProps {
  nft: NFTData;
  refetchNFTs: () => void;
}

const BridgeNFTL2ToL1Button: React.FC<BridgeNFTL2ToL1ButtonProps> = ({ nft, refetchNFTs }) => {
  const { isConnected, chain } = useAccount();
  const tx = useTransactionFeedback();
  const nftContractAddress = chain ? contractAddresses[chain.id]?.CommunitasNFT?.General : undefined;

  const handleBridge = async () => {
    if (!nftContractAddress) return;
    const ok = await tx.send(() =>
      tx.writeContractAsync({
        abi: CommunitasNFTL2.abi,
        address: nftContractAddress,
        functionName: "bridgeToL1",
        args: [nft.tokenId],
      }),
    );
    if (ok) refetchNFTs();
  };

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        fullWidth
        onClick={handleBridge}
        loading={tx.isBusy}
        disabled={tx.isBusy || !isConnected}
        icon={<ArrowUpDown size={16} />}
        className="min-h-[44px]"
      >
        Bridge to L1
      </Button>

      <TransactionModal
        isOpen={tx.isOpen}
        status={tx.status}
        hash={tx.hash}
        error={tx.error}
        details={{ type: "bridge_nft_l2" }}
        onClose={tx.close}
        onRetry={handleBridge}
      />
    </>
  );
};

export default BridgeNFTL2ToL1Button;
