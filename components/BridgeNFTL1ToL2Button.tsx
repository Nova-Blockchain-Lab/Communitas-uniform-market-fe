import React, {useEffect, useState} from "react";
import {Button, Spinner, ToastId, useToast} from "@chakra-ui/react";
import {useAccount, useWaitForTransactionReceipt, useWriteContract} from "wagmi";
import CommunitasNFTL1Abi from "../abi/CommunitasNFTL1.json";
import {contractAddresses, defaultChain} from "../constants/config";
import {ParentToChildMessageGasEstimator, ParentToChildMessageStatus, ParentTransactionReceipt,} from "@arbitrum/sdk";
import {ethers} from "ethers";
import {getBaseFee} from "@arbitrum/sdk/dist/lib/utils/lib";
import {useAppContext} from "./AppContext";

export interface BridgeNFTL1ToL2ButtonProps {
    tokenId: string;
    refetchNFTs: () => {};
}

const BridgeNFTL1ToL2Button: React.FC<BridgeNFTL1ToL2ButtonProps> = ({tokenId, refetchNFTs}) => {
    const {isConnected, address, chain} = useAccount();
    const {l1Provider, l2Provider} = useAppContext()

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const nftContractAddress = contractAddresses[chain!.id]["CommunitasNFT"]["General"];
    const nftContractAddressOnL2 = contractAddresses[defaultChain.id]["CommunitasNFT"]["General"];

    const toast = useToast();

    const {
        data: hash,
        isPending: isWritePending,
        error,
        writeContract,
    } = useWriteContract();

    const {isLoading: isConfirming, isSuccess: isConfirmed} = useWaitForTransactionReceipt({hash});

    useEffect(() => {
        if (!hash || isConfirming) return;

        if (isConfirmed) {
            checkFinality(hash);
        } else {
            sendUnsuccessfulNotification();
            setIsLoading(false);
        }
    }, [isConfirming]);

    useEffect(() => {
        if (error)
            setIsLoading(false)
    }, [isWritePending]);

    const sendSuccessfulNotification = () => {
        toast({
            title: "Success!",
            description: `NFT has been bridged successfully and confirmed on ${defaultChain.name}!`,
            status: "success",
            duration: 9000,
            isClosable: true,
        });
    };

    const sendUnsuccessfulNotification = () => {
        toast({
            title: "Failed",
            description: "Something went wrong. Please try again later.",
            status: "error",
            duration: 9000,
            isClosable: true,
        });
    };

    const sendWaitingForRetryableNotification = (): ToastId => {
        return toast({
            title: "Transaction is confirmed, waiting for bridge confirmation",
            description: `Waiting for transaction to be executed in the ${defaultChain.name} network. This process can take up to 15 min.`,
            status: "loading",
            duration: null,
            isClosable: true,
        });
    }

    const checkFinality = async (txHash: string) => {
        if (!address || !l1Provider || !l2Provider) return;
        try {

            const l1TxReceipt = new ParentTransactionReceipt(await l1Provider.getTransactionReceipt(txHash));

            const messages = await l1TxReceipt.getParentToChildMessages(l2Provider)
            const message = messages[0];

            console.log("Waiting for L2 finality. This may take up to 10-15 minutes...");
            const toastLoadingId = sendWaitingForRetryableNotification();
            const result = await message.waitForStatus();

            toast.close(toastLoadingId);

            if (result.status === ParentToChildMessageStatus.REDEEMED) {
                console.log(
                    `NFT successfully bridged to Arbitrum. L2 Tx Hash: ${result.childTxReceipt.transactionHash}`
                );
                sendSuccessfulNotification();
            } else {
                console.error(
                    `L2 finality failed. Status: ${ParentToChildMessageStatus[result.status]}`
                );
                sendUnsuccessfulNotification();
            }
        } catch (error) {
            console.error("Error verifying L2 finality:", error);
            sendUnsuccessfulNotification();
        }
        setIsLoading(false)
        refetchNFTs()
    };

    const handleBridge = async () => {
        if (!isConnected || !chain || !address || !l1Provider || !l2Provider) return;

        setIsLoading(true)

        const ABI = ['function mintFromBridge(address receiver, uint256 tokenId)']
        const iface = new ethers.utils.Interface(ABI)
        const calldata = iface.encodeFunctionData('mintFromBridge', [address, tokenId])

        const parentToChildMessageGasEstimator = new ParentToChildMessageGasEstimator(l2Provider)

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
        )

        const gasPriceBid = await l2Provider.getGasPrice()
        console.log(`L2 gas price: ${gasPriceBid.toString()}`)

        console.log(
            `Sending NFT to L2 with ${parentToChildMessageGasParams.deposit.toString()} callValue for L2 fees:`
        )

        writeContract({
            abi: CommunitasNFTL1Abi.abi,
            address: nftContractAddress,
            functionName: "bridgeToL2",
            args: [tokenId, parentToChildMessageGasParams.maxSubmissionCost, parentToChildMessageGasParams.gasLimit, gasPriceBid],
            value: parentToChildMessageGasParams.deposit.toBigInt()
        });

    };

    return (
        <Button
            colorScheme="blue"
            width="full"
            mt={2}
            isLoading={isWritePending || isConfirming}
            onClick={handleBridge}
            disabled={isWritePending || isConfirming || !isConnected || isLoading}
        >
            {isWritePending || isConfirming || isLoading ? <Spinner/> : "Bridge NFT to L2"}
        </Button>
    );
};

export default BridgeNFTL1ToL2Button;
