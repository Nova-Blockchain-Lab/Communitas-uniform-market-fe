import React from "react";
import {Box, Image, Text} from "@chakra-ui/react";
import BridgeNFTL1ToL2Button from "./BridgeNFTL1ToL2Button";
import {NFTData, NFTDataWithStatus} from "@/utils/executeMessageL2ToL1Helper";
import BridgeNFTL2ToL1Button from "./BridgeNFTL2ToL1Button";
import BridgeNFTL2ToL1ExecuteButton from "./BridgeNFTL2ToL1ExecuteButton";
import ViewOnOpenseaButton from "./ViewOnOpenseaButton";

interface NFTCardProps {
    isL3: boolean
    nft: NFTData | NFTDataWithStatus
    refetchNFTs: () => {};
}

const NFTCard: React.FC<NFTCardProps> = ({nft, isL3, refetchNFTs}) => {
    const isPendingMessage = (nft as NFTDataWithStatus).hash !== undefined
    return (
        <Box
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            bg="white"
            boxShadow="md"
            transition="transform 0.2s, box-shadow 0.2s"
            _hover={{transform: "scale(1.05)", boxShadow: "lg"}}
        >
            <Text>#{nft.tokenId.toString()}</Text>
            <Image src={nft.image} alt={nft.name}/>
            <Box p={4}>
                <Text fontWeight="bold" noOfLines={2}>
                    {nft.name}
                </Text>
                <Text fontSize="sm" color="gray.500" noOfLines={3}>
                    {nft.description}
                </Text>
                {!isPendingMessage && !isL3 && (
                    <>
                        <BridgeNFTL1ToL2Button tokenId={nft.tokenId} refetchNFTs={refetchNFTs}/>
                        <ViewOnOpenseaButton tokenId={nft.tokenId}/>
                    </>
                )}
                {!isPendingMessage && isL3 && <BridgeNFTL2ToL1Button nft={nft} refetchNFTs={refetchNFTs}/>}
                {isPendingMessage &&
                    <BridgeNFTL2ToL1ExecuteButton nft={nft as NFTDataWithStatus} refetchNFTs={refetchNFTs}/>}
            </Box>
        </Box>
    );
};

export default NFTCard;
