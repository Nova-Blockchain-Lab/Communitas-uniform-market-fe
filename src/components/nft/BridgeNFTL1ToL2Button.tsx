import React, { useCallback, useEffect, useState } from "react";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import CommunitasNFTL1Abi from "@/../abi/CommunitasNFTL1.json";
import { contractAddresses, defaultChain } from "@/config";
import { ParentToChildMessageGasEstimator, ParentToChildMessageStatus, ParentTransactionReceipt } from "@arbitrum/sdk";
import { ethers } from "ethers";
import { getBaseFee } from "@arbitrum/sdk/dist/lib/utils/lib";
import { useAppContext } from "@/context/AppContext";
import { Button, TransactionModal, TransactionStatus } from "@/components/ui";
import { ArrowUpDown } from "lucide-react";

export interface BridgeNFTL1ToL2ButtonProps {
  tokenId: string;
  refetchNFTs: () => void;
}

const BridgeNFTL1ToL2Button: React.FC<BridgeNFTL1ToL2ButtonProps> = ({ tokenId, refetchNFTs }) => {
  const { isConnected, address, chain } = useAccount();
  const { l1Provider, l2Provider } = useAppContext();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txError, setTxError] = useState<string | undefined>();

  const nftContractAddress = chain ? contractAddresses[chain.id]?.["CommunitasNFT"]?.["General"] : undefined;
  const nftContractAddressOnL2 = contractAddresses[defaultChain.id]?.["CommunitasNFT"]?.["General"];

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
  }, [isWritePending, isConfirming, writeError, confirmError]);

  const checkFinality = useCallback(
    async (txHash: string) => {
      if (!address || !l1Provider || !l2Provider) return;

      try {
        setTxStatus("bridging");
        const l1TxReceipt = new ParentTransactionReceipt(await l1Provider.getTransactionReceipt(txHash));
        const messages = await l1TxReceipt.getParentToChildMessages(l2Provider);

        if (!messages.length) {
          throw new Error("No messages found for this transaction");
        }

        const message = messages[0];
        const result = await message.waitForStatus();

        if (result.status === ParentToChildMessageStatus.REDEEMED) {
          setTxStatus("success");
          refetchNFTs();
        } else {
          setTxStatus("error");
          setTxError("Bridge confirmation failed. Please try again.");
        }
      } catch (error) {
        console.error("Error verifying L2 finality:", error);
        setTxStatus("error");
        setTxError("Error verifying bridge completion.");
      }
    },
    [address, l1Provider, l2Provider, refetchNFTs]
  );

  // Handle transaction confirmation
  useEffect(() => {
    if (!hash || isConfirming) return;

    if (isConfirmed) {
      checkFinality(hash);
    }
  }, [hash, isConfirming, isConfirmed, checkFinality]);

  const handleBridge = useCallback(async () => {
    if (!isConnected || !chain || !address || !l1Provider || !l2Provider || !nftContractAddress || !nftContractAddressOnL2) {
      return;
    }

    setIsModalOpen(true);
    setTxStatus("idle");
    setTxError(undefined);
    resetWrite();

    try {
      setTxStatus("pending");
      const ABI = ["function mintFromBridge(address receiver, uint256 tokenId)"];
      const iface = new ethers.utils.Interface(ABI);
      const calldata = iface.encodeFunctionData("mintFromBridge", [address, tokenId]);

      const parentToChildMessageGasEstimator = new ParentToChildMessageGasEstimator(l2Provider);

      const parentToChildMessageGasParams = await parentToChildMessageGasEstimator.estimateAll(
        {
          from: nftContractAddress,
          to: nftContractAddressOnL2,
          l2CallValue: ethers.BigNumber.from(0),
          excessFeeRefundAddress: address,
          callValueRefundAddress: address,
          data: calldata,
        },
        await getBaseFee(l1Provider),
        l1Provider
      );

      const gasPriceBid = await l2Provider.getGasPrice();

      writeContract({
        abi: CommunitasNFTL1Abi.abi,
        address: nftContractAddress,
        functionName: "bridgeToL2",
        args: [tokenId, parentToChildMessageGasParams.maxSubmissionCost, parentToChildMessageGasParams.gasLimit, gasPriceBid],
        value: parentToChildMessageGasParams.deposit.toBigInt(),
      });
    } catch (error) {
      console.error("Bridge preparation failed:", error);
      setTxStatus("error");
      setTxError("Failed to prepare bridge transaction.");
    }
  }, [isConnected, chain, address, l1Provider, l2Provider, nftContractAddress, nftContractAddressOnL2, tokenId, writeContract, resetWrite]);

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setTxStatus("idle");
      setTxError(undefined);
    }, 300);
  };

  const isLoading = isWritePending || isConfirming || txStatus === "bridging";

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        fullWidth
        onClick={handleBridge}
        loading={isLoading}
        disabled={isLoading || !isConnected || !nftContractAddress}
        icon={<ArrowUpDown size={14} />}
      >
        Bridge to L2
      </Button>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        status={txStatus}
        hash={hash}
        error={txError}
        details={{
          type: "bridge_nft_l1",
        }}
        onClose={closeModal}
        onRetry={handleBridge}
      />
    </>
  );
};

export default BridgeNFTL1ToL2Button;
