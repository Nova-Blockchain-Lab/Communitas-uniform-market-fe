import React, {useEffect} from "react";
import {Button, Spinner, useToast} from "@chakra-ui/react";
import {useAccount, useWaitForTransactionReceipt, useWriteContract} from "wagmi";
import CommunitasNFTL2 from "@/../abi/CommunitasNFTL2.json";
import {contractAddresses} from "@/config";
import {NFTData} from "@/utils/executeMessageL2ToL1Helper";

interface BridgeNFTL2ToL1ButtonProps {
    nft: NFTData;
    refetchNFTs: () => {};
}

const BridgeNFTL2ToL1Button: React.FC<BridgeNFTL2ToL1ButtonProps> = ({nft, refetchNFTs}) => {
    const {isConnected, address, chain} = useAccount();

    const nftContractAddress = contractAddresses[chain!.id]["CommunitasNFT"]["General"];

    const toast = useToast();

    const {
        data: hash,
        isPending: isWritePending,
        writeContract,
    } = useWriteContract();

    const {isLoading: isConfirming, isSuccess: isConfirmed} = useWaitForTransactionReceipt({hash});

    useEffect(() => {
        if (!hash || isConfirming) return;

        if (isConfirmed) {
            sendWaitingForValidationNotification();
            refetchNFTs();
        } else {
            sendUnsuccessfulNotification();
        }
    }, [isConfirming]);


    const sendUnsuccessfulNotification = () => {
        toast({
            title: "Failed",
            description: "Something went wrong. Please try again later.",
            status: "error",
            duration: 9000,
            isClosable: true,
        });
    };

    const sendWaitingForValidationNotification = () => {
        toast({
            title: "Transaction is confirmed, waiting for bridge validation",
            description: `Waiting for transaction to be validated. This process takes about 1 hour.`,
            status: "loading",
            duration: 9000,
            isClosable: true,
        });
    }

    const handleBridge = async () => {
        if (!isConnected || !chain || !address) return;

        writeContract({
            abi: CommunitasNFTL2.abi,
            address: nftContractAddress,
            functionName: "bridgeToL1",
            args: [nft.tokenId]
        });
    };

    return (
        <Button
            colorScheme="blue"
            width="full"
            size="sm"
            fontSize="xs"
            isLoading={isWritePending || isConfirming}
            onClick={handleBridge}
            disabled={isWritePending || isConfirming || !isConnected}
        >
            {isWritePending || isConfirming ? <Spinner size="sm" /> : "Bridge to L1"}
        </Button>
    );
};

export default BridgeNFTL2ToL1Button;
