import React, { useCallback, useEffect, useState } from "react";
import { Button, Spinner, ToastId, useToast } from "@chakra-ui/react";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import CommunitasNFTL1Abi from "@/../abi/CommunitasNFTL1.json";
import { contractAddresses, defaultChain } from "@/config";
import { ParentToChildMessageGasEstimator, ParentToChildMessageStatus, ParentTransactionReceipt } from "@arbitrum/sdk";
import { ethers } from "ethers";
import { getBaseFee } from "@arbitrum/sdk/dist/lib/utils/lib";
import { useAppContext } from "@/context/AppContext";

// Constants
const BRIDGE_WAIT_TIME_MINUTES = 15;

export interface BridgeNFTL1ToL2ButtonProps {
  tokenId: string;
  refetchNFTs: () => void;
}

const BridgeNFTL1ToL2Button: React.FC<BridgeNFTL1ToL2ButtonProps> = ({ tokenId, refetchNFTs }) => {
  const { isConnected, address, chain } = useAccount();
  const { l1Provider, l2Provider } = useAppContext();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const nftContractAddress = chain ? contractAddresses[chain.id]?.["CommunitasNFT"]?.["General"] : undefined;
  const nftContractAddressOnL2 = contractAddresses[defaultChain.id]?.["CommunitasNFT"]?.["General"];

  const toast = useToast();

  const {
    data: hash,
    isPending: isWritePending,
    error,
    writeContract,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const sendSuccessfulNotification = useCallback(() => {
    toast({
      title: "Success!",
      description: `NFT has been bridged successfully and confirmed on ${defaultChain.name}!`,
      status: "success",
      duration: 9000,
      isClosable: true,
    });
  }, [toast]);

  const sendUnsuccessfulNotification = useCallback(() => {
    toast({
      title: "Failed",
      description: "Something went wrong. Please try again later.",
      status: "error",
      duration: 9000,
      isClosable: true,
    });
  }, [toast]);

  const sendWaitingForRetryableNotification = useCallback((): ToastId => {
    return toast({
      title: "Transaction is confirmed, waiting for bridge confirmation",
      description: `Waiting for transaction to be executed in the ${defaultChain.name} network. This process can take up to ${BRIDGE_WAIT_TIME_MINUTES} min.`,
      status: "loading",
      duration: null,
      isClosable: true,
    });
  }, [toast]);

  const checkFinality = useCallback(
    async (txHash: string) => {
      if (!address || !l1Provider || !l2Provider) return;

      try {
        const l1TxReceipt = new ParentTransactionReceipt(await l1Provider.getTransactionReceipt(txHash));
        const messages = await l1TxReceipt.getParentToChildMessages(l2Provider);

        if (!messages.length) {
          throw new Error("No messages found for this transaction");
        }

        const message = messages[0];
        const toastLoadingId = sendWaitingForRetryableNotification();
        const result = await message.waitForStatus();

        toast.close(toastLoadingId);

        if (result.status === ParentToChildMessageStatus.REDEEMED) {
          sendSuccessfulNotification();
        } else {
          sendUnsuccessfulNotification();
        }
      } catch (error) {
        console.error("Error verifying L2 finality:", error);
        sendUnsuccessfulNotification();
      } finally {
        setIsLoading(false);
        refetchNFTs();
      }
    },
    [address, l1Provider, l2Provider, toast, sendWaitingForRetryableNotification, sendSuccessfulNotification, sendUnsuccessfulNotification, refetchNFTs]
  );

  // Handle transaction confirmation
  useEffect(() => {
    if (!hash || isConfirming) return;

    if (isConfirmed) {
      checkFinality(hash);
    } else {
      sendUnsuccessfulNotification();
      setIsLoading(false);
    }
  }, [hash, isConfirming, isConfirmed, checkFinality, sendUnsuccessfulNotification]);

  // Handle write errors
  useEffect(() => {
    if (error) {
      setIsLoading(false);
    }
  }, [error]);

  const handleBridge = useCallback(async () => {
    if (!isConnected || !chain || !address || !l1Provider || !l2Provider || !nftContractAddress || !nftContractAddressOnL2) {
      return;
    }

    setIsLoading(true);

    try {
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
      sendUnsuccessfulNotification();
      setIsLoading(false);
    }
  }, [isConnected, chain, address, l1Provider, l2Provider, nftContractAddress, nftContractAddressOnL2, tokenId, writeContract, sendUnsuccessfulNotification]);

  return (
    <Button
      colorScheme="blue"
      width="full"
      size="sm"
      fontSize="xs"
      isLoading={isWritePending || isConfirming}
      onClick={handleBridge}
      disabled={isWritePending || isConfirming || !isConnected || isLoading || !nftContractAddress}
    >
      {isWritePending || isConfirming || isLoading ? <Spinner size="sm" /> : "Bridge to L2"}
    </Button>
  );
};

export default BridgeNFTL1ToL2Button;
