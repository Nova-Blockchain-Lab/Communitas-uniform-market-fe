import React, { useCallback, useEffect, useState } from "react";
import { Button, Link, Spinner, useToast } from "@chakra-ui/react";
import { useAccount, useConfig, useSwitchChain } from "wagmi";
import { contractAddresses, defaultChain, OPENSEA_URL_CREATOR } from "@/config";
import {
  getOutgoingMessageState,
  getTxExpectedDeadlineTimestamp,
  NFTDataWithStatus,
} from "@/utils/executeMessageL2ToL1Helper";
import { useAppContext } from "@/context/AppContext";
import { ChildToParentMessageStatus, ChildTransactionReceipt } from "@arbitrum/sdk";
import { useEthersProvider, useEthersSigner } from "@/utils/ethersHelper";
import { formatTimestamp } from "@/utils/utils";

// Constants
const STATUS_POLL_INTERVAL = 60 * 1000; // 1 minute

interface BridgeNFTL2ToL1ExecuteButtonProps {
  nft: NFTDataWithStatus;
  refetchNFTs: () => void;
}

const BridgeNFTL2ToL1ExecuteButton: React.FC<BridgeNFTL2ToL1ExecuteButtonProps> = ({ nft, refetchNFTs }) => {
  const { isConnected, address, chain, chainId } = useAccount();
  const { l1Provider, l2Provider } = useAppContext();
  const signer = useEthersSigner();
  const provider = useEthersProvider();
  const { switchChain } = useSwitchChain();
  const { chains } = useConfig();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isWaitingForConfirmation, setIsWaitingForConfirmation] = useState<boolean>(false);
  const [remainingTime, setRemainingTime] = useState<number | undefined>(undefined);
  const [messageState, setMessageState] = useState<ChildToParentMessageStatus | undefined>(nft.state);

  const handleChangeChain = useCallback(async () => {
    const targetChain = chains.map((c) => c.id).filter((id) => id !== chainId)[0];
    switchChain({ chainId: targetChain });
  }, [chains, chainId, switchChain]);

  const sendUnsuccessfulNotification = useCallback(() => {
    toast({
      title: "Failed",
      description: "Something went wrong. Please try again later.",
      status: "error",
      duration: 9000,
      isClosable: true,
    });
  }, [toast]);

  const sendSuccessfulExecutionNotification = useCallback(() => {
    if (!chainId) return;
    const openseaLink = OPENSEA_URL_CREATOR(contractAddresses[chainId]["CommunitasNFT"]["General"], nft.tokenId);
    toast({
      title: "NFT bridge process is complete",
      description: (
        <>
          You can now access and interact with your NFT on the base layer. View it on OpenSea:{" "}
          <Link href={openseaLink} isExternal>
            Here
          </Link>
        </>
      ),
      status: "success",
      duration: 9000,
      isClosable: true,
    });
  }, [chainId, nft.tokenId, toast]);

  // Poll withdrawal status
  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const updateWithdrawalStatus = async () => {
      if (!l1Provider || !l2Provider || !isMounted) return;

      try {
        setIsLoading(true);
        const state = await getOutgoingMessageState(nft.hash, l1Provider, l2Provider);

        if (isMounted) {
          setMessageState(state);
          setIsWaitingForConfirmation(state === ChildToParentMessageStatus.UNCONFIRMED);
        }
      } catch (error) {
        console.error("Failed to get withdrawal status:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    updateWithdrawalStatus();
    intervalId = setInterval(updateWithdrawalStatus, STATUS_POLL_INTERVAL);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [l1Provider, l2Provider, nft.hash]);

  // Poll remaining time
  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout;

    const fetchAndSetRemainingTime = async () => {
      if (!l2Provider || !isMounted) return;

      try {
        const time = await getTxExpectedDeadlineTimestamp(l2Provider, nft.hash);
        if (isMounted) {
          setRemainingTime(time);
        }
      } catch (error) {
        console.error("Failed to get remaining time:", error);
      }
    };

    fetchAndSetRemainingTime();
    intervalId = setInterval(fetchAndSetRemainingTime, STATUS_POLL_INTERVAL);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [l2Provider, nft.hash]);

  const handleBridge = useCallback(async () => {
    if (chainId === defaultChain.id) {
      await handleChangeChain();
      return;
    }

    if (!isConnected || !chain || !address || !l1Provider || !l2Provider || !signer || !provider) {
      return;
    }

    try {
      setIsLoading(true);

      const receipt = await l2Provider.getTransactionReceipt(nft.hash);
      const l2Receipt = new ChildTransactionReceipt(receipt);
      const messages = await l2Receipt.getChildToParentMessages(signer);

      if (!messages.length) {
        throw new Error("No messages found for this transaction");
      }

      const childToParentMsg = messages[0];
      const tx = await childToParentMsg.execute(l2Provider);
      await tx.wait(1);

      refetchNFTs();
      sendSuccessfulExecutionNotification();
    } catch (error) {
      console.error("Bridge execution failed:", error);
      sendUnsuccessfulNotification();
    } finally {
      setIsLoading(false);
    }
  }, [
    chainId,
    handleChangeChain,
    isConnected,
    chain,
    address,
    l1Provider,
    l2Provider,
    signer,
    provider,
    nft.hash,
    refetchNFTs,
    sendSuccessfulExecutionNotification,
    sendUnsuccessfulNotification,
  ]);

  if (isWaitingForConfirmation || isLoading) {
    return (
      <div className="space-y-1">
        <Button
          colorScheme="orange"
          width="full"
          size="sm"
          fontSize="xs"
          isLoading={isWaitingForConfirmation || isLoading}
          disabled={!isConnected || isLoading || isWaitingForConfirmation}
        >
          <Spinner size="sm" />
        </Button>
        {isWaitingForConfirmation && remainingTime !== undefined && (
          <p className="text-xs text-amber-400 text-center">{formatTimestamp(remainingTime)} left</p>
        )}
      </div>
    );
  }

  if (chainId === defaultChain.id) {
    return (
      <Button
        colorScheme="blue"
        width="full"
        size="sm"
        fontSize="xs"
        onClick={handleChangeChain}
      >
        Switch Chain
      </Button>
    );
  }

  return (
    <Button
      colorScheme="green"
      width="full"
      size="sm"
      fontSize="xs"
      onClick={handleBridge}
      disabled={!isConnected}
    >
      Execute
    </Button>
  );
};

export default BridgeNFTL2ToL1ExecuteButton;
