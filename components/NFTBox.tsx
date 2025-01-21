import React, {useEffect, useState} from "react";
import {useAccount, useConfig, useReadContract, useReadContracts, useSwitchChain, useWriteContract} from "wagmi";
import {Box, Button, Flex, FormControl, FormLabel, Grid, Spinner, Switch, Text, useToast} from "@chakra-ui/react";
import {contractAddresses, defaultChain} from "../constants/config";
import CommunitasNFTAbi from "../abi/CommunitasNFT.json";
import {AbiFunction} from "viem";
import ConnectAndSwitchNetworkButton from "./ConnectAndSwitchNetworkButton";
import NFTCard from "./NFTCard";
import PendingNFTs from "./PendingNFTBox";

const NFTBox: React.FC = () => {
    const {address, isConnected, chainId, chain} = useAccount();
    const {chains} = useConfig()
    const {switchChain} = useSwitchChain();
    const [nfts, setNfts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const toast = useToast();

    let nftContractAddress: any

    if (isConnected && chainId && chains.map((chain) => chain.id).includes(chainId)) {
        nftContractAddress = contractAddresses[chainId]["CommunitasNFT"]["General"]
    }

    const handleChangeChain = async () => {
        const targetChain = chains.map((chain) => chain.id).filter((id) => id !== chainId)[0]
        switchChain({chainId: targetChain});
    }

    const getAllTokenIdsConfig = (balance: number | undefined) => {
        if (!balance) return [];
        const contracts = [];
        for (let i = 0; i < balance; i++) {
            contracts.push({
                abi: CommunitasNFTAbi.abi as AbiFunction[],
                address: nftContractAddress,
                functionName: "tokenOfOwnerByIndex",
                args: [address, i],
            });
        }
        return contracts;
    };

    const getAllTokenUrisConfig = (tokenIds: (number | undefined)[] | undefined) => {
        if (!tokenIds) return [];
        const contracts = [];
        for (const tokenId of tokenIds) {
            contracts.push({
                abi: CommunitasNFTAbi.abi as AbiFunction[],
                address: nftContractAddress,
                functionName: "tokenURI",
                args: [tokenId],
            });
        }
        return contracts;
    };

    const {
        data: nftsBalance,
        isPending: isBalancePending,
        refetch: refetchBalance
    } = useReadContract(nftContractAddress ? {
        address: nftContractAddress,
        abi: CommunitasNFTAbi.abi,
        functionName: "balanceOf",
        args: [address],
    } : undefined);

    const {data: tokenIdsOwned, isPending: isTokenIdsPending, refetch: refetchTokenIds} = useReadContracts({
        contracts: getAllTokenIdsConfig(nftsBalance ? +nftsBalance.toString() : undefined),
    });

    const {data: tokenUris, isPending: isTokenUrisPending, refetch: refetchTokenUris} = useReadContracts({
        contracts: getAllTokenUrisConfig(
            tokenIdsOwned
                ?.filter((item) => item.result != null)
                .map((item) => +item.result.toString())
        ),
    });

    const fetchOwnedNFTs = async () => {
        if (!address) return;

        setIsLoading(true);
        try {
            if (!tokenIdsOwned || !tokenUris || tokenIdsOwned.length !== tokenUris.length)
                throw new Error(
                    `Different length between tokenIds ${tokenIdsOwned?.length} and tokenUris ${tokenUris?.length}`
                );

            const tokenData = await Promise.all(
                tokenUris.map(async (tokenUri, i) => {
                    const tokenUriResponse = await fetch(tokenUri.result!.toString());
                    const tokenId = tokenIdsOwned[i].result;
                    return {tokenId, ...(await tokenUriResponse.json())};
                })
            );

            setNfts(tokenData);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error fetching NFTs",
                description: "Unable to fetch NFT data. Please try again later.",
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const refetchNFTs = async () => {
        await refetchBalance()
    }

    const {writeContract: mintNFT, isSuccess: isMintSuccess} = useWriteContract();

    const handleMint = () => { // todo remove this
        if (!nftContractAddress) return

        mintNFT({
            abi: CommunitasNFTAbi.abi,
            address: nftContractAddress,
            functionName: "mint"
        })
    }

    useEffect(() => {
        if (isMintSuccess) {
            toast({
                title: "Success!",
                description: "Your NFT has been minted successfully.",
                status: "success",
                duration: 5000,
                isClosable: true,
            });
            refetchNFTs();
        }
    }, [isMintSuccess]);


    useEffect(() => {
        if (isConnected && chainId && chains.map((chain) => chain.id).includes(chainId))
            refetchBalance();
    }, [isConnected, address, chainId]);

    useEffect(() => {
        if (nftsBalance) refetchTokenIds();
    }, [nftsBalance]);

    useEffect(() => {
        if (tokenIdsOwned) refetchTokenUris();
    }, [tokenIdsOwned]);

    useEffect(() => {
        if (tokenUris) fetchOwnedNFTs();
    }, [tokenUris]);

    useEffect(() => {
        setIsLoading(isBalancePending || isTokenIdsPending || isTokenUrisPending);
    }, [isBalancePending, isTokenIdsPending, isTokenUrisPending]);

    if (!isConnected || !(chainId && chains.map((chain) => chain.id).includes(chainId)))
        return (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                <Box
                    w="full"
                    maxW="1200px"
                    bg="white"
                    borderRadius="xl"
                    boxShadow="lg"
                    p={6}
                >
                    <Text fontSize="2xl" fontWeight="bold" mb={6}>
                        Your NFTs
                    </Text>
                    <div className="py-2 mt-10 bg-blue-600 rounded-lg border border-blue-600 border-solid">
                        <div className="flex justify-center flex-col items-center">
                            <ConnectAndSwitchNetworkButton/>
                        </div>
                    </div>
                </Box>
            </Box>
        )

    return (
        <Flex direction="column" alignItems="center" justifyContent="center" p={4}>
            <Box
                w="full"
                maxW="1200px"
                bg="white"
                borderRadius="xl"
                boxShadow="lg"
                p={6}
            >
                <Flex direction="column" alignItems="center" mb={4}>
                    <Text fontSize="3xl" fontWeight="bold" textAlign="center" mb={2}>
                        Your NFTs
                    </Text>
                    <Box w="full" h="1px" bg="gray.300"/>
                    {chainId === defaultChain.id &&
                        <Button
                            colorScheme="blue"
                            size="sm"
                            onClick={handleMint}
                            mt={4}
                        >
                            Mint NFT
                        </Button>
                    }
                    <FormControl display="flex" alignItems="center" mt={4}>
                        <FormLabel margin={2} fontSize="sm" fontWeight="bold">
                            L1
                        </FormLabel>
                        <Switch
                            colorScheme="blue"
                            isChecked={chainId === defaultChain.id}
                            onChange={handleChangeChain}
                        />
                        <FormLabel margin={2} fontSize="sm" fontWeight="bold">
                            L2
                        </FormLabel>
                    </FormControl>
                </Flex>
                {nftsBalance !== undefined && nftsBalance !== null && +nftsBalance.toString() === 0 ? (
                    <Text margin={2}>No NFTs found in your wallet in the {chain?.name} chain</Text>
                ) : (
                    <>
                        {isLoading ? (
                            <Flex justifyContent="center" alignItems="center" height="200px">
                                <Spinner size="lg"/>
                                <Text fontSize="lg" mt={4} ml={4}>Loading NFTs...</Text>
                            </Flex>
                        ) : (
                            <Grid templateColumns="repeat(auto-fill, minmax(200px, 1fr))" gap={6}>
                                {nfts.map((nft) => (
                                    <NFTCard key={nft.tokenId} isL3={chainId === defaultChain.id} nft={nft}
                                             refetchNFTs={refetchNFTs}/>
                                ))}
                            </Grid>
                        )
                        }
                    </>
                )}
            </Box>
            <PendingNFTs refetchNFTs={refetchNFTs}/>
        </Flex>
    );
};

export default NFTBox;
