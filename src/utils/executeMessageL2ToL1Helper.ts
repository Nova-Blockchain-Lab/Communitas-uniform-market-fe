import {BlockTag, Provider} from "@ethersproject/abstract-provider";
import {ChildToParentMessageReader, ChildToParentMessageStatus, ChildTransactionReceipt} from "@arbitrum/sdk";
import {baseChain, CONFIRMATION_BUFFER_MINUTES, contractAddresses, defaultChain} from "../../constants/config";
import CommunitasNFTL2Abi from "../../abi/CommunitasNFTL2.json";
import {BigNumber, ethers} from "ethers";
import {formatBalance} from "@/utils/utils";
import {Chain} from "viem";
import dayjs from "dayjs";

const PENDING_MESSAGES_KEY = "arbitrum:bridge:pending-messages";

// Define the structure for NFT data
export interface NFTData {
    tokenId: string;
    image: string;
    name: string;
    description: string;
}

export interface NFTDataStorage extends NFTData {
    hash: string;
    owner: string;
}

export interface NFTDataWithStatus extends NFTDataStorage {
    state: ChildToParentMessageStatus;
}

export interface ETHWithdrawalMessage {
    time: BigNumber;
    token: string;
    from: Chain;
    to: Chain;
    status: WithdrawalStatusType;
    hash: string;
}

// Retrieve the NFT data from localStorage
const getPendingOutgoingMessagesFromStorage = (): NFTDataStorage[] => {
    const storedData = localStorage.getItem(PENDING_MESSAGES_KEY);
    return storedData ? JSON.parse(storedData) : [];
};

// Add a pending NFT to the cache
export const addPendingOutgoingMessageToStorage = (nftData: NFTDataStorage) => {
    const storedData = getPendingOutgoingMessagesFromStorage();
    if (storedData.some((item) => item.hash === nftData.hash)) return; // Avoid duplicates
    localStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify([...storedData, nftData]));
};

// Remove a pending NFT from the cache by hash
export const removePendingOutgoingMessageFromStorage = (hashToRemove: string) => {
    const storedData = getPendingOutgoingMessagesFromStorage();
    const updatedData = storedData.filter((item) => item.hash !== hashToRemove);
    localStorage.setItem(PENDING_MESSAGES_KEY, JSON.stringify(updatedData));
};

// Fetch the state of an outgoing message
export async function getOutgoingMessageState(
    txHash: string,
    l1Provider: Provider,
    l2Provider: Provider
) {
    const receipt = await l2Provider.getTransactionReceipt(txHash);
    const l2Receipt = new ChildTransactionReceipt(receipt);

    const messages = await l2Receipt.getChildToParentMessages(l1Provider);
    const childToParentMsg = messages[0];

    return childToParentMsg.status(l2Provider);
}

// Retrieve pending outgoing NFTs with their states
export const getPendingOutgoingMessages = async (
    l1Provider: Provider,
    l2Provider: Provider
): Promise<NFTDataWithStatus[]> => {
    const pendingNFTs = getPendingOutgoingMessagesFromStorage();

    const nftStates = await Promise.all(
        pendingNFTs.map(async (nft) => {
            const state = await getOutgoingMessageState(nft.hash, l1Provider, l2Provider);
            return {...nft, state, owner: nft.owner};
        })
    );

    return nftStates.filter(({state}) => state !== ChildToParentMessageStatus.CONFIRMED);
};

export const getPendingOutgoingNftsFromEventLogs = async (
    owner: string,
    l1Provider: Provider,
    l2Provider: Provider
): Promise<NFTDataWithStatus[]> => {
    const nftAddressOnL2 = contractAddresses[(await l1Provider.getNetwork()).chainId]["CommunitasNFT"]["General"]
    const nftAddressOnL3 = contractAddresses[(await l2Provider.getNetwork()).chainId]["CommunitasNFT"]["General"]

    const allNfts = await getOutgoingMessagesFromEventLogs(nftAddressOnL2, l1Provider, l2Provider)

    const pendingNfts = allNfts.filter(({state}) => state !== ChildToParentMessageStatus.EXECUTED)

    const nftIface = new ethers.utils.Interface(CommunitasNFTL2Abi.abi);

    const nftsData: NFTDataWithStatus[] = await Promise.all(
        pendingNfts.map(async (pendingNft) => {
            const receipt = await l2Provider.getTransactionReceipt(pendingNft.transactionHash)
            const logs = receipt.logs.filter(log => log.address.toLowerCase() === nftAddressOnL3.toLowerCase());
            const log = nftIface.parseLog(logs.filter((l) => nftIface.parseLog(l).name === "L2ToL1TxCreated")[0])

            const tokenId = log.args.tokenId.toString()
            const owner = log.args.from
            const tokenUri = log.args.tokenURI

            const tokenUriResponse = await fetch(tokenUri);

            return {
                tokenId,
                state: pendingNft.state,
                owner,
                hash: pendingNft.transactionHash, ...(await tokenUriResponse.json())
            };
        })
    )

    return nftsData.filter((nft) => nft.owner === owner)
}

export const getOutgoingMessagesFromEventLogs = async (
    receiver: string,
    l1Provider: Provider,
    l2Provider: Provider
) => {

    const withdrawals = await fetchETHWithdrawalsFromEventLogs({
        receiver: receiver,
        fromBlock: 'earliest',
        toBlock: 'latest',
        l2Provider
    })

    return Promise.all(
        withdrawals.map(async (event) => {
            const state = await getOutgoingMessageState(event.transactionHash, l1Provider, l2Provider);
            return {...event, state};
        })
    );
}

export function fetchETHWithdrawalsFromEventLogs({receiver, fromBlock, toBlock, l2Provider}: {
    receiver?: string
    fromBlock: BlockTag
    toBlock: BlockTag
    l2Provider: Provider
}) {
    if (typeof receiver === 'undefined') {
        return []
    }

    return ChildToParentMessageReader.getChildToParentEvents(
        l2Provider,
        {fromBlock, toBlock},
        undefined,
        receiver
    )
}

export const getETHWithdrawalsInfo = async (receiver: string, l1Provider: Provider, l2Provider: Provider): Promise<ETHWithdrawalMessage[]> => {
    const events = await getOutgoingMessagesFromEventLogs(receiver, l1Provider, l2Provider)

    return Promise.all(events.map(async (event) => {
        return {
            time: event.timestamp,
            token: formatBalance(event.callvalue.toBigInt(), 6),
            from: defaultChain,
            to: baseChain,
            status: WITHDRAWAL_STATUS[await getOutgoingMessageState(event.transactionHash, l1Provider, l2Provider)],
            hash: event.transactionHash
        }
    }))
}



interface WithdrawalStatusType {
    status: string;
    color: string;
}

export const WITHDRAWAL_STATUS: WithdrawalStatusType[] = [
    /**
     * ArbSys.sendTxToL1 called, but assertion not yet confirmed
     */
    {status: "Pending", color: "yellow"},
    /**
     * Assertion for outgoing message confirmed, but message not yet executed
     */
    {status: "Claimable", color: "green"},
    /**
     * Outgoing message executed (terminal state)
     */
    {status: "Success", color: "gray"}
]

export const getTxExpectedDeadlineTimestamp = async (l2Provider: Provider, hash: string) => {
    const txReceipt = await l2Provider.getTransactionReceipt(hash);
    const block = await l2Provider.getBlock(txReceipt.blockNumber);
    const createdAt = dayjs.unix(block.timestamp);
    return createdAt.add(CONFIRMATION_BUFFER_MINUTES, 'minutes').unix()
};