import React from "react";
import { Box, Image, Text } from "@chakra-ui/react";

interface NFTCardProps {
    isL3: boolean
    nft: {
        tokenId: string;
        image: string;
        name: string;
        description: string;
    };
}

const NFTCard: React.FC<NFTCardProps> = ({ nft }) => {
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
            <Text>#{nft.tokenId}</Text>
            <Image src={nft.image} alt={nft.name} />
            <Box p={4}>
                <Text fontWeight="bold" noOfLines={1}>
                    {nft.name}
                </Text>
                <Text fontSize="sm" color="gray.500" noOfLines={2}>
                    {nft.description}
                </Text>
            </Box>
        </Box>
    );
};

export default NFTCard;
