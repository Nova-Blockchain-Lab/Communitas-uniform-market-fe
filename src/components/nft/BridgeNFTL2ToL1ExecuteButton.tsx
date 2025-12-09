import React, { useCallback, useEffect, useState } from "react";
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
import { Button, TransactionModal, TransactionStatus } from "@/components/ui";
import { Loader2, Clock } from "lucide-react";

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

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isWaitingForConfirmation, setIsWaitingForConfirmation] = useState<boolean>(false);
  const [remainingTime, setRemainingTime] = useState<number | undefined>(undefined);
  const [messageState, setMessageState] = useState<ChildToParentMessageStatus | undefined>(nft.state);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txError, setTxError] = useState<string | undefined>();
  const [txHash, setTxHash] = useState<string | undefined>();

  const handleChangeChain = useCallback(async () => {
    const targetChain = chains.map((c) => c.id).filter((id) => id !== chainId)[0];
    switchChain({ chainId: targetChain });
  }, [chains, chainId, switchChain]);

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => {
      setTxStatus("idle");
      setTxError(undefined);
      setTxHash(undefined);
    }, 300);
  };

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

    setIsModalOpen(true);
    setTxStatus("pending");
    setTxError(undefined);
    setTxHash(undefined);

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

      setTxHash(tx.hash);
      setTxStatus("confirming");

      await tx.wait(1);

      setTxStatus("success");
      refetchNFTs();
    } catch (error: any) {
      console.error("Bridge execution failed:", error);
      setTxStatus("error");
      let message = error?.message || "Something went wrong. Please try again later.";
      if (message.includes("User rejected") || message.includes("user rejected")) {
        message = "Transaction was rejected in your wallet";
      } else if (message.length > 150) {
        message = message.substring(0, 150) + "...";
      }
      setTxError(message);
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
  ]);

  if (isWaitingForConfirmation || isLoading) {
    return (
      <>
        <div className="space-y-1">
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            loading={isWaitingForConfirmation || isLoading}
            disabled={!isConnected || isLoading || isWaitingForConfirmation}
            icon={<Clock size={14} />}
          >
            {isWaitingForConfirmation ? "Waiting" : "Processing"}
          </Button>
          {isWaitingForConfirmation && remainingTime !== undefined && (
            <p className="text-xs text-amber-400 text-center">{formatTimestamp(remainingTime)} left</p>
          )}
        </div>

        <TransactionModal
          isOpen={isModalOpen}
          status={txStatus}
          hash={txHash}
          error={txError}
          details={{ type: "bridge_nft_execute" }}
          onClose={closeModal}
          onRetry={handleBridge}
        />
      </>
    );
  }

  if (chainId === defaultChain.id) {
    return (
      <Button
        variant="secondary"
        size="sm"
        fullWidth
        onClick={handleChangeChain}
      >
        Switch Chain
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        fullWidth
        onClick={handleBridge}
        disabled={!isConnected}
      >
        Execute
      </Button>

      <TransactionModal
        isOpen={isModalOpen}
        status={txStatus}
        hash={txHash}
        error={txError}
        details={{ type: "bridge_nft_execute" }}
        onClose={closeModal}
        onRetry={handleBridge}
      />
    </>
  );
};

export default BridgeNFTL2ToL1ExecuteButton;
