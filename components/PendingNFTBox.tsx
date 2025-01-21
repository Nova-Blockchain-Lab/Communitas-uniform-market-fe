import React, {useEffect, useState} from "react";
import {Box, Grid, Text} from "@chakra-ui/react";
import NFTCard from "./NFTCard";
import {getPendingOutgoingNftsFromEventLogs, NFTDataWithStatus} from "@/utils/executeMessageL2ToL1Helper";
import {useAppContext} from "./AppContext";
import {useAccount} from "wagmi";
import {BsClock} from "react-icons/bs";

interface PendingNFTsBoxProps {
    refetchNFTs: () => {};
}

const PendingNFTs: React.FC<PendingNFTsBoxProps> = ({refetchNFTs}) => {
    const {l1Provider, l2Provider} = useAppContext()
    const {address} = useAccount()

    const [pendingNFTs, setPendingNFTs] = useState<NFTDataWithStatus[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchPendingNFTs = async () => {
        if (!l1Provider || !l2Provider || !address) return;
        setIsLoading(true);
        try {
            const nfts = await getPendingOutgoingNftsFromEventLogs(address, l1Provider, l2Provider)
            setPendingNFTs(nfts);
        } catch (error) {
            console.error("Error fetching pending NFTs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const refetchAllNfts = async () => {
        refetchNFTs()
        fetchPendingNFTs()
    }

    useEffect(() => {
        fetchPendingNFTs();
    }, []);

    return isLoading || pendingNFTs.length === 0 ? <></> : (
        <Box
            w="full"
            maxW="1200px"
            bg="white"
            borderRadius="xl"
            boxShadow="lg"
            p={6}
            mt={6}
        >
            <Text fontSize="2xl" fontWeight="bold" mb={6} textAlign="center" display="flex" alignItems="center" gap={2}>
                <BsClock/> You Have Pending NFTs
            </Text>
            <Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={6}>
                {pendingNFTs.map((nft) => (
                    <NFTCard
                        key={nft.tokenId}
                        isL3={false} // todo: modify
                        nft={nft}
                        refetchNFTs={refetchAllNfts}
                    />
                ))}
            </Grid>
        </Box>
    );
};

export default PendingNFTs;
