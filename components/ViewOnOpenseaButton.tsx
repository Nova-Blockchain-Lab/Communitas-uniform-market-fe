import React from "react";
import {Button} from "@chakra-ui/react";
import {contractAddresses, OPENSEA_URL_CREATOR} from "../constants/config";
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
            colorScheme="blue"
            size="sm"
            mt={2}
        >
            View on OpenSea
        </Button>
    );
};

export default ViewOnOpenseaButton;
