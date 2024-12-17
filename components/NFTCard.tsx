import React from "react";
import { Box, Image, Text, Button } from "@chakra-ui/react";
import BridgeNFTL1ToL2Button from "./BridgeNFTL1ToL2Button";

interface NFTCardProps {
    isL3: boolean
    nft: {
        tokenId: string;
        image: string;
        name: string;
        description: string;
    };
    refetchNFTs: () => {};
}

const NFTCard: React.FC<NFTCardProps> = ({ nft, isL3, refetchNFTs }) => {
    return (
        <Box
            borderWidth="1px"
            borderRadius="lg"
            overflow="hidden"
            bg="gray.50"
            boxShadow="sm"
            transition="transform 0.2s"
            _hover={{ transform: "scale(1.05)" }}
        >
            <Text>#{nft.tokenId.toString()}</Text>
            <Image src={nft.image} alt={nft.name} />
            <Box p={4}>
                <Text fontWeight="bold" noOfLines={2}>
                    {nft.name}
                </Text>
                <Text fontSize="sm" color="gray.500" noOfLines={3}>
                    {nft.description}
                </Text>
                {!isL3 && <BridgeNFTL1ToL2Button tokenId={nft.tokenId} refetchNFTs={refetchNFTs}/>}
            </Box>
        </Box>
    );
};

export default NFTCard;
