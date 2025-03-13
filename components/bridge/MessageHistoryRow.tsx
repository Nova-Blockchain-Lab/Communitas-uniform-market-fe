import React, {useEffect, useState} from "react";
import {
    ETHWithdrawalMessage,
    getOutgoingMessageState,
    getTxExpectedDeadlineTimestamp,
    WITHDRAWAL_STATUS
} from "@/utils/executeMessageL2ToL1Helper";
import {ArbitrumIcon, NovaCidadeIcon, WalletIcon} from "./IconComponents";
import {ARBITRUM_EXPLORER_URL_CREATOR, baseChain, defaultChain} from "../../constants/config";
import {ChildToParentMessageStatus, ChildTransactionReceipt} from "@arbitrum/sdk";
import {useAccount, useSwitchChain} from "wagmi";
import {useEthersSigner} from "@/utils/ethersHelper";
import {useAppContext} from "../AppContext";
import {Link, Spinner, useToast} from "@chakra-ui/react";
import {formatTimestamp} from "@/utils/utils";

interface MessageHistoryRowProps {
    idx: number;
    message: ETHWithdrawalMessage;
    refetchMessages: () => void;
}

const MessageHistoryRow: React.FC<MessageHistoryRowProps> = ({idx, message, refetchMessages}) => {
    const {address, isConnected, chainId} = useAccount();
    const {l1Provider, l2Provider} = useAppContext();

    const {switchChain} = useSwitchChain();
    const signer = useEthersSigner()

    const toast = useToast()

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [remainingTime, setRemainingTime] = useState<number | undefined>(undefined);
    const [isWaitingForConfirmation, setIsWaitingForConfirmation] = useState<boolean>(false);

    const executeBridge = async (hash: string) => {
        if (chainId === defaultChain.id)
            switchChain({chainId: baseChain.id})

        if (!isConnected || !address || !l1Provider || !l2Provider || !signer) return;

        setIsLoading(true)

        const receipt = await l2Provider.getTransactionReceipt(hash)
        const l2Receipt = new ChildTransactionReceipt(receipt)

        const messages = await l2Receipt.getChildToParentMessages(signer)
        const childToParentMsg = messages[0]

        try {

            const tx = await childToParentMsg.execute(l2Provider)

            const txReceipt = await tx.wait(1)

            sendSuccessfulExecutionNotification(txReceipt.transactionHash)

            refetchMessages()

        } catch (e) {
            console.log(e)
            sendUnsuccessfulNotification()
        }

        setIsLoading(false);
    };

    const sendSuccessfulExecutionNotification = (hash: string) => {
        const openseaLink = ARBITRUM_EXPLORER_URL_CREATOR(hash);
        toast({
            title: "Withdrawal process is complete!",
            description: (
                <>
                    You can now access your funds on the base layer. Check the transaction:{" "}
                    <Link href={openseaLink} isExternal>
                        Here
                    </Link>
                </>
            ),
            status: "success",
            duration: 9000,
            isClosable: true,
        });
    }

    const sendUnsuccessfulNotification = () => {
        toast({
            title: "Failed",
            description: "Something went wrong. Please try again later.",
            status: "error",
            duration: 9000,
            isClosable: true,
        });
    };

    const updateWithdrawalStatus = async () => {
        if (!l1Provider || !l2Provider) return
        setIsLoading(true)
        const state = await getOutgoingMessageState(
            message.hash,
            l1Provider,
            l2Provider
        )
        message.status = WITHDRAWAL_STATUS[state]
        setIsWaitingForConfirmation(state === ChildToParentMessageStatus.UNCONFIRMED)
        setIsLoading(false)
    }

    useEffect(() => {
        const interval = setInterval(updateWithdrawalStatus, 60 * 1_000); // Poll every minute
        updateWithdrawalStatus()
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!l2Provider) return;
        const fetchAndSetRemainingTime = async () => {
            const time = await getTxExpectedDeadlineTimestamp(l2Provider, message.hash);
            setRemainingTime(time);
        };

        fetchAndSetRemainingTime();
        const interval = setInterval(fetchAndSetRemainingTime, 60 * 1000); // Update every minute
        return () => clearInterval(interval); // Clean up on unmount
    }, []);

    return (
        <tr key={idx} className="border-b hover:bg-gray-100">
            <td className="px-4 py-2">{formatTimestamp(message.time)} ago</td>
            <td className="px-4 py-2">{message.token}</td>
            <td className="px-4 py-2 truncate max-w-xs"><NovaCidadeIcon/> {message.from.name}</td>
            <td className="px-4 py-2 truncate max-w-xs"><ArbitrumIcon/> {message.to.name}</td>
            <td className={`px-4 py-2 text-${message.status.color}-600 font-semibold`}>{message.status.status}</td>
            <td className="px-4 py-2">
                {!isConnected && (
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow transition duration-200 hover:bg-blue-700 text-center max-sm:px-3 max-sm:py-3">
                        <WalletIcon/>
                        <w3m-connect-button/>
                    </button>
                )}
                {isConnected && chainId !== message.to.id && !isWaitingForConfirmation && message.status.status !== "Success" && (

                    <button
                        onClick={() => switchChain({chainId: message.to.id})}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow transition duration-200 hover:bg-blue-700 text-center max-sm:px-3 max-sm:py-3"
                    >
                        Change Network
                    </button>
                )}
                {isConnected && chainId === message.to.id && !isWaitingForConfirmation && message.status.status !== "Success" && (
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow transition duration-200 hover:bg-blue-700 text-center max-sm:px-3 max-sm:py-3"
                        onClick={() => executeBridge(message.hash)}
                        disabled={isLoading}>
                        {isLoading ? <Spinner/> : "Claim"}
                    </button>
                )}
                {isConnected && chainId === message.to.id && isWaitingForConfirmation && message.status.status !== "Success" && (
                    <div
                        className="px-4 py-2 rounded-lg shadow transition duration-200 text-center max-sm:px-3 max-sm:py-3">
                        Time left:<br/>
                        {formatTimestamp(remainingTime)}
                    </div>
                )}
            </td>
            {/*<td className="px-4 py-2 text-blue-600 hover:underline cursor-pointer">
                            {"Details"}
                        </td>*/}
        </tr>
    )
}

export default MessageHistoryRow;