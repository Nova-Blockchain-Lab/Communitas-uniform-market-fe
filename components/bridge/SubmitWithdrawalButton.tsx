import React, {useState} from "react";
import {useEthersSigner} from "@/utils/ethersHelper";
import {useAppContext} from "../AppContext";
import {Spinner, ToastId, useToast} from "@chakra-ui/react";
import {defaultChain} from "../../constants/config";
import {EthBridger, EthDepositMessageStatus, getArbitrumNetwork} from "@arbitrum/sdk";
import {BigNumber} from "ethers";
import {useAccount} from "wagmi";

interface SubmitWithdrawalButtonProps {
    amount: BigInt;
}

export const SubmitWithdrawalButton: React.FC<SubmitWithdrawalButtonProps> = ({amount}) => {
    const {address} = useAccount()
    const signer = useEthersSigner()
    const {l2Provider} = useAppContext()
    const toast = useToast()

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const sendWaitingForWithdrawalValidationNotification = () => {
        toast({
            title: "Transaction is confirmed, waiting for bridge validation",
            description: `Waiting for transaction to be validated. This process takes about 1 hour.`,
            status: "loading",
            duration: 9000,
            isClosable: true,
        });
    }

    const sendUnsuccessfulWithdrawalNotification = () => {
        toast({
            title: "Failed",
            description: "Something went wrong. Please try again or check logs for more information.",
            status: "error",
            duration: 9000,
            isClosable: true,
        });
    };

    const handleWithdrawal = async () => {
        if (!signer || !l2Provider || !address) return;

        setIsLoading(true)

        try {
            const childChainNetwork = await getArbitrumNetwork(l2Provider);
            const ethBridger = new EthBridger(childChainNetwork);

            const withdrawTransaction = await ethBridger.withdraw({
                from: address,
                amount: BigNumber.from(amount),
                childSigner: signer,
                destinationAddress: address,
            });

            const withdrawTransactionReceipt = await withdrawTransaction.wait();

            const withdrawEventsData = withdrawTransactionReceipt.getChildToParentEvents();
            console.log('Withdrawal data:', withdrawEventsData);
            sendWaitingForWithdrawalValidationNotification();
        } catch (e: any) {
            sendUnsuccessfulWithdrawalNotification();
            console.log(e)
        }
        setIsLoading(false);
    }

    return (
        <button
            onClick={handleWithdrawal}
            disabled={isLoading}
            className="flex gap-3 justify-center items-center p-4 mt-5 bg-blue-700 hover:bg-blue-600 text-white font-semibold rounded-xl border border-solid cursor-pointer border-white border-opacity-10 transition duration-200 w-full max-sm:p-3">
            {isLoading ? <Spinner/> : "Withdrawal"}
        </button>
    )
}
