import React, { useEffect, useState } from "react";
import { ArrowUpRight, ArrowDownLeft, Clock, Check, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import {
  ETHDepositOrWithdrawalMessage,
  getOutgoingMessageState,
  getTxExpectedDeadlineTimestamp,
  MessageType,
  WITHDRAWAL_STATUS,
} from "@/utils/executeMessageL2ToL1Helper";
import { ARBITRUM_EXPLORER_URL_CREATOR, baseChain, defaultChain } from "@/config";
import { ChildToParentMessageStatus, ChildTransactionReceipt } from "@arbitrum/sdk";
import { useAccount, useSwitchChain } from "wagmi";
import { useEthersSigner } from "@/utils/ethersHelper";
import { useAppContext } from "@/context/AppContext";
import { useToast, Link } from "@chakra-ui/react";
import { formatTimestamp } from "@/utils/utils";

interface MessageHistoryRowProps {
  message: ETHDepositOrWithdrawalMessage;
  refetchMessages: () => void;
}

const MessageHistoryRow: React.FC<MessageHistoryRowProps> = ({ message, refetchMessages }) => {
  const { address, isConnected, chainId } = useAccount();
  const { l1Provider, l2Provider } = useAppContext();
  const { switchChain } = useSwitchChain();
  const signer = useEthersSigner();
  const toast = useToast();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [remainingTime, setRemainingTime] = useState<number | undefined>(undefined);
  const [isWaitingForConfirmation, setIsWaitingForConfirmation] = useState<boolean>(false);

  const isDeposit = message.type === MessageType.DEPOSIT;
  const isSuccess = message.status.status === "Success";

  const executeBridge = async (hash: string) => {
    if (chainId === defaultChain.id) switchChain({ chainId: baseChain.id });

    if (!isConnected || !address || !l1Provider || !l2Provider || !signer) return;

    setIsLoading(true);

    const receipt = await l2Provider.getTransactionReceipt(hash);
    const l2Receipt = new ChildTransactionReceipt(receipt);

    const messages = await l2Receipt.getChildToParentMessages(signer);
    const childToParentMsg = messages[0];

    try {
      const tx = await childToParentMsg.execute(l2Provider);
      const txReceipt = await tx.wait(1);

      sendSuccessfulExecutionNotification(txReceipt.transactionHash);
      refetchMessages();
    } catch (e) {
      console.log(e);
      sendUnsuccessfulNotification();
    }

    setIsLoading(false);
  };

  const sendSuccessfulExecutionNotification = (hash: string) => {
    const openseaLink = ARBITRUM_EXPLORER_URL_CREATOR(hash);
    toast({
      title: "Withdrawal Complete!",
      description: (
        <>
          Your funds are now available.{" "}
          <Link href={openseaLink} isExternal color="emerald.400">
            View Transaction
          </Link>
        </>
      ),
      status: "success",
      duration: 9000,
      isClosable: true,
    });
  };

  const sendUnsuccessfulNotification = () => {
    toast({
      title: "Transaction Failed",
      description: "Something went wrong. Please try again later.",
      status: "error",
      duration: 9000,
      isClosable: true,
    });
  };

  useEffect(() => {
    if (message.type === MessageType.DEPOSIT) return;
    const updateWithdrawalStatus = async () => {
      if (!l1Provider || !l2Provider) return;
      setIsLoading(true);
      const state = await getOutgoingMessageState(message.hash, l1Provider, l2Provider);
      message.status = WITHDRAWAL_STATUS[state];
      setIsWaitingForConfirmation(state === ChildToParentMessageStatus.UNCONFIRMED);
      setIsLoading(false);
    };
    const interval = setInterval(updateWithdrawalStatus, 60 * 1_000);
    updateWithdrawalStatus();
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!l2Provider || message.type === MessageType.DEPOSIT) return;
    const fetchAndSetRemainingTime = async () => {
      setIsLoading(true);
      const time = await getTxExpectedDeadlineTimestamp(l2Provider, message.hash);
      setRemainingTime(time);
      setIsLoading(false);
    };

    fetchAndSetRemainingTime();
    const interval = setInterval(fetchAndSetRemainingTime, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusConfig = () => {
    if (isSuccess) {
      return {
        color: "emerald",
        bgColor: "bg-emerald-500/10",
        textColor: "text-emerald-400",
        icon: <Check size={12} />,
      };
    }
    if (isWaitingForConfirmation) {
      return {
        color: "amber",
        bgColor: "bg-amber-500/10",
        textColor: "text-amber-400",
        icon: <Clock size={12} />,
      };
    }
    return {
      color: "blue",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-400",
      icon: <AlertCircle size={12} />,
    };
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Direction icon */}
          <div
            className={`
              w-8 h-8 rounded-lg flex items-center justify-center
              ${isDeposit ? "bg-emerald-500/10" : "bg-blue-500/10"}
            `}
          >
            {isDeposit ? (
              <ArrowDownLeft size={16} className="text-emerald-400" />
            ) : (
              <ArrowUpRight size={16} className="text-blue-400" />
            )}
          </div>

          {/* Type and time */}
          <div>
            <p className="text-sm font-medium text-white">
              {isDeposit ? "Deposit" : "Withdrawal"}
            </p>
            <p className="text-xs text-gray-500">{formatTimestamp(message.time)} ago</p>
          </div>
        </div>

        {/* Status badge */}
        <div
          className={`
            flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium
            ${statusConfig.bgColor} ${statusConfig.textColor}
          `}
        >
          {statusConfig.icon}
          {message.status.status}
        </div>
      </div>

      {/* Route */}
      <div className="flex items-center gap-2 mb-3 text-xs">
        <span className="text-gray-400">{message.from.name}</span>
        <span className="text-gray-600">→</span>
        <span className="text-gray-400">{message.to.name}</span>
      </div>

      {/* Amount */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white">{message.token}</span>

        {/* Action button */}
        {!isDeposit && !isSuccess && (
          <div>
            {!isConnected && (
              <w3m-connect-button size="sm" />
            )}

            {isConnected && chainId !== message.to.id && !isWaitingForConfirmation && (
              <button
                onClick={() => switchChain({ chainId: message.to.id })}
                className="px-3 py-1.5 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
              >
                Switch Network
              </button>
            )}

            {isConnected && chainId === message.to.id && !isWaitingForConfirmation && (
              <button
                onClick={() => executeBridge(message.hash)}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Processing
                  </>
                ) : (
                  "Claim"
                )}
              </button>
            )}

            {isConnected && isWaitingForConfirmation && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400">
                <Clock size={12} />
                {formatTimestamp(remainingTime)} left
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageHistoryRow;
