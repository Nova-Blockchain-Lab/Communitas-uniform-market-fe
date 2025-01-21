    import React, {useEffect, useState} from "react";
    import {Button, Link, Spinner, useToast} from "@chakra-ui/react";
    import {useAccount, useConfig, useSwitchChain} from "wagmi";
    import {CONFIRMATION_BUFFER_MINUTES, contractAddresses, defaultChain, OPENSEA_URL_CREATOR} from "../constants/config";
    import {getOutgoingMessageState, NFTDataWithStatus} from "@/utils/executeMessageL2ToL1Helper";
    import {useAppContext} from "./AppContext";
    import {ChildToParentMessageStatus, ChildTransactionReceipt} from "@arbitrum/sdk";
    import {useEthersProvider, useEthersSigner} from "@/utils/ethersHelper";
    import dayjs from "dayjs";

    interface BridgeNFTL2ToL1ExecuteButtonProps {
        nft: NFTDataWithStatus;
        refetchNFTs: () => {};
    }

    const BridgeNFTL2ToL1ExecuteButton: React.FC<BridgeNFTL2ToL1ExecuteButtonProps> = ({nft, refetchNFTs}) => {
        const {isConnected, address, chain, chainId} = useAccount();

        const {l1Provider, l2Provider} = useAppContext();

        const signer = useEthersSigner()
        const provider = useEthersProvider()

        const {switchChain} = useSwitchChain();

        const {chains} = useConfig()

        const toast = useToast();

        const [isLoading, setIsLoading] = useState<boolean>(false);
        const [isWaitingForConfirmation, setIsWaitingForConfirmation] = useState<boolean>(true);
        const [remainingTime, setRemainingTime] = useState(0);

        const handleChangeChain = async () => {
            const targetChain = chains.map((chain) => chain.id).filter((id) => id !== chainId)[0]
            switchChain({chainId: targetChain});
        }

        /*useEffect(() => {
            if (nft.state === ChildToParentMessageStatus.UNCONFIRMED)
                waitForConfirmedStatus();
        }, []);*/

        const updateWithdrawalStatus = async () => {
            if (!l1Provider || !l2Provider) return
            nft.state = await getOutgoingMessageState(
                nft.hash,
                l1Provider,
                l2Provider
            )
            setIsWaitingForConfirmation(nft.state === ChildToParentMessageStatus.UNCONFIRMED)
        }

        const getTxRemainingTimeInMinutes = async () => {
            if (!l2Provider) return 0;
            const txReceipt = await l2Provider.getTransactionReceipt(nft.hash);
            const block = await l2Provider.getBlock(txReceipt.blockNumber);
            const createdAt = dayjs.unix(block.timestamp);
            const now = dayjs();
            return Math.max(CONFIRMATION_BUFFER_MINUTES - now.diff(createdAt, 'minutes'), 0);
        };


        useEffect(() => {
            const interval = setInterval(updateWithdrawalStatus, 10_000); // Poll every 10 seconds
            updateWithdrawalStatus()
            return () => clearInterval(interval);
        }, []);

        useEffect(() => {
            const fetchAndSetRemainingTime = async () => {
                const time = await getTxRemainingTimeInMinutes();
                setRemainingTime(time);
            };

            fetchAndSetRemainingTime();
            const interval = setInterval(fetchAndSetRemainingTime, 1000); // Update every second
            return () => clearInterval(interval); // Clean up on unmount
        }, []);


        const sendUnsuccessfulNotification = () => {
            toast({
                title: "Failed",
                description: "Something went wrong. Please try again later.",
                status: "error",
                duration: 9000,
                isClosable: true,
            });
        };

        const sendSuccessfulExecutionNotification = () => {
            const openseaLink = OPENSEA_URL_CREATOR(contractAddresses[chainId!]["CommunitasNFT"]["General"], nft.tokenId);
            toast({
                title: "NFT bridge process is complete",
                description: (
                    <>
                        You can now access and interact with your NFT on the base layer. View it on OpenSea:{" "}
                        <Link href={openseaLink} isExternal>
                            Here
                        </Link>
                    </>
                ),
                status: "success",
                duration: 9000,
                isClosable: true,
            });
        }

        /*const waitForConfirmedStatus = async () => { // this approach seems very API intensive, trying an alternative
            if (!l1Provider || !l2Provider) return;

            setLoading(true)

            const receipt = await l2Provider.getTransactionReceipt(nft.hash)
            const l2Receipt = new ChildTransactionReceipt(receipt)

            const messages = await l2Receipt.getChildToParentMessages(l1Provider)
            const childToParentMsg = messages[0]

            console.log("status", await childToParentMsg.status(l2Provider))

            const timeToWaitMs = 1000 * 60

            await childToParentMsg.waitUntilReadyToExecute(l2Provider, timeToWaitMs)

            setLoading(false)
        }*/

        const handleBridge = async () => {
            if (chainId === defaultChain.id)
                await handleChangeChain()

            if (!isConnected || !chain || !address || !l1Provider || !l2Provider || !signer || !provider) return;

            const receipt = await l2Provider.getTransactionReceipt(nft.hash)
            const l2Receipt = new ChildTransactionReceipt(receipt)

            const messages = await l2Receipt.getChildToParentMessages(signer)
            const childToParentMsg = messages[0]

            try {
                setIsLoading(true)

                const tx = await childToParentMsg.execute(l2Provider)

                const txReceipt = await tx.wait(1)

                refetchNFTs()

                sendSuccessfulExecutionNotification()

            } catch (e) {
                console.log(e)
                sendUnsuccessfulNotification()
            } finally {
                console.log("finaly?")
                setIsLoading(false)
            }

        };

        if (isWaitingForConfirmation || isLoading)
            return (
                <div>
                    <Button
                        colorScheme={"red"}
                        width="full"
                        mt={2}
                        isLoading={isWaitingForConfirmation || isLoading}
                        disabled={!isConnected || isLoading || isWaitingForConfirmation}
                    >
                        <Spinner/>
                    </Button>
                    { isWaitingForConfirmation && <p>Remaining time: {remainingTime} minutes</p> }
                </div>
            )

        if (chainId === defaultChain.id)
            return (
                <Button
                    colorScheme={"blue"}
                    width="full"
                    mt={2}
                    onClick={handleChangeChain}
                >
                    Change Chain
                </Button>
            )

        return (
            <Button
                colorScheme={"green"}
                width="full"
                mt={2}
                onClick={handleBridge}
                disabled={!isConnected}
            >
                Execute Bridge
            </Button>
        );
    };

    export default BridgeNFTL2ToL1ExecuteButton;
