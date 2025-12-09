import React, { useEffect, useState } from "react";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import CommunitasNFTL2 from "@/../abi/CommunitasNFTL2.json";
import { contractAddresses } from "@/config";
import { NFTData } from "@/utils/executeMessageL2ToL1Helper";
import { Button, TransactionModal, TransactionStatus } from "@/components/ui";
import { ArrowUpDown } from "lucide-react";

interface BridgeNFTL2ToL1ButtonProps {
  nft: NFTData;
  refetchNFTs: () => void;
}

const BridgeNFTL2ToL1Button: React.FC<BridgeNFTL2ToL1ButtonProps> = ({ nft, refetchNFTs }) => {
  const { isConnected, address, chain } = useAccount();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txError, setTxError] = useState<string | undefined>();

  const nftContractAddress = chain ? contractAddresses[chain.id]?.["CommunitasNFT"]?.["General"] : undefined;

  const {
    data: hash,
    isPending: isWritePending,
    error: writeError,
    writeContract,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({ hash });

  // Update modal status based on transaction state
  useEffect(() => {
    if (isWritePending) {
      setTxStatus("pending");
    } else if (isConfirming) {
      setTxStatus("confirming");
    } else if (isConfirmed) {
      setTxStatus("success");
      refetchNFTs();
    } else if (writeError || confirmError) {
      setTxStatus("error");
      const err = writeError || confirmError;
      if (err) {
        let message = err.message;
        if (message.includes("User rejected") || message.includes("user rejected")) {
          message = "Transaction was rejected in your wallet";
        } else if (message.includes("insufficient funds")) {
          message = "Insufficient funds for this transaction";
        } else if (message.length > 150) {
          message = message.substring(0, 150) + "...";
        }
        setTxError(message);
      }
    }
  }, [isWritePending, isConfirming, isConfirmed, writeError, confirmError, refetchNFTs]);

  const handleBridge = async () => {
    if (!isConnected || !chain || !address || !nftContractAddress) return;

    setIsModalOpen(true);
    setTxStatus("idle");
    setTxError(undefined);
    resetWrite();

    writeContract({
      abi: CommunitasNFTL2.abi,
      address: nftContractAddress,
      functionName: "bridgeToL1",
      args: [nft.tokenId],
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setTxStatus("idle");
      setTxError(undefined);
    }, 300);
  };

  const isLoading = isWritePending || isConfirming;

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        fullWidth
        onClick={handleBridge}
        loading={isLoading}
        disabled={isLoading || !isConnected}
        icon={<ArrowUpDown size={14} />}
      >
        Bridge to L1
      </Button>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        status={txStatus}
        hash={hash}
        error={txError}
        details={{
          type: "bridge_nft_l2",
        }}
        onClose={closeModal}
        onRetry={handleBridge}
      />
    </>
  );
};

export default BridgeNFTL2ToL1Button;
