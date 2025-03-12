import React, {useState} from "react";
import {useEthersSigner} from "@/utils/ethersHelper";
import {useAppContext} from "../AppContext";
import {Spinner, ToastId, useToast} from "@chakra-ui/react";
import {defaultChain} from "../../constants/config";
import {EthBridger, EthDepositMessageStatus, getArbitrumNetwork} from "@arbitrum/sdk";
import {BigNumber} from "ethers";

interface SubmitDepositButtonProps {
    amount: BigInt;
}

export const SubmitDepositButton: React.FC<SubmitDepositButtonProps> = ({amount}) => {
    const signer = useEthersSigner()
    const {l2Provider} = useAppContext()
    const toast = useToast()

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const sendWaitingForRetryableNotification = (): ToastId => {
        return toast({
            title: "Transaction is confirmed, waiting for bridge confirmation",
            description: `Waiting for transaction to be executed in the ${defaultChain.name} network. This process can take up to 15 min.`,
            status: "loading",
            duration: null,
            isClosable: true,
        });
    }

    const sendSuccessfulDepositNotification = () => {
        toast({
            title: "Success!",
            description: `ETH has been bridged successfully and confirmed on ${defaultChain.name}!`,
            status: "success",
            duration: 9000,
            isClosable: true,
        });
    };

    const sendUnsuccessfulDepositNotification = (message: string) => {
        toast({
            title: "Failed",
            description: message,
            status: "error",
            duration: 9000,
            isClosable: true,
        });
    };

    const handleDeposit = async () => {
        if (!signer || !l2Provider) return;

        setIsLoading(true)

        try {
            const childChainNetwork = getArbitrumNetwork(defaultChain.id);
            const ethBridger = new EthBridger(childChainNetwork);

            const depositTransaction = await ethBridger.deposit({
                amount: BigNumber.from(amount),
                parentSigner: signer
            });

            const depositTransactionReceipt = await depositTransaction.wait();

            const toastId = sendWaitingForRetryableNotification()

            const transactionResult = await depositTransactionReceipt.waitForChildTransactionReceipt(
                l2Provider,
            );

            toast.close(toastId);

            if (transactionResult.complete) {
                sendSuccessfulDepositNotification();
                console.log(
                    `Message successfully executed on the child chain. Status: ${
                        EthDepositMessageStatus[await transactionResult.message.status()]
                    }`,
                );
            } else {
                const message = `Message failed execution on the child chain. Status ${
                    EthDepositMessageStatus[await transactionResult.message.status()]
                }`
                sendUnsuccessfulDepositNotification(message);
                console.error(message);
            }
        } catch (e: any) {
            console.log(e)
        }
        setIsLoading(false);
    }

    return (
        <button
            onClick={handleDeposit}
            disabled={isLoading}
            className="flex gap-3 justify-center items-center p-4 mt-5 bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded-xl border border-solid cursor-pointer border-white border-opacity-10 transition duration-200 w-full max-sm:p-3">
            {isLoading ? <Spinner/> : "Deposit"}
        </button>
    )
}
