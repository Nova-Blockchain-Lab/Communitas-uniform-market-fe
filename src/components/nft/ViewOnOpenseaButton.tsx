import React from "react";
import {Button} from "@chakra-ui/react";
import {contractAddresses, OPENSEA_URL_CREATOR} from "@/config";
import {useAccount} from "wagmi";

interface ViewOnOpenseaButtonProps {
    tokenId: string;
}

const ViewOnOpenseaButton: React.FC<ViewOnOpenseaButtonProps> = ({tokenId}) => {

    const {chainId} = useAccount()

    const contractAddress = contractAddresses[chainId!]["CommunitasNFT"]["General"];
    const openseaLink = OPENSEA_URL_CREATOR(contractAddress, tokenId);

    return (
        <Button
            as="a"
            href={openseaLink}
            target="_blank"
            rel="noopener noreferrer"
            colorScheme="whiteAlpha"
            variant="outline"
            width="full"
            size="sm"
            fontSize="xs"
            borderColor="whiteAlpha.400"
            _hover={{ bg: "whiteAlpha.200", borderColor: "whiteAlpha.600" }}
        >
            OpenSea
        </Button>
    );
};

export default ViewOnOpenseaButton;
