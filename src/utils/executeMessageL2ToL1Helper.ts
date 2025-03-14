import {BlockTag, Provider} from "@ethersproject/abstract-provider";
import {
    ChildToParentMessageReader,
    ChildToParentMessageStatus,
    ChildTransactionReceipt,
    EventFetcher,
    getArbitrumNetwork,
    ParentEthDepositTransactionReceipt
} from "@arbitrum/sdk";
import {baseChain, CONFIRMATION_BUFFER_MINUTES, contractAddresses, defaultChain} from "../../constants/config";
import CommunitasNFTL2Abi from "../../abi/CommunitasNFTL2.json";
import {BigNumber, ethers} from "ethers";
import {formatBalance} from "@/utils/utils";
import {Chain} from "viem";
import dayjs from "dayjs";
import {Inbox__factory} from "@arbitrum/sdk/dist/lib/abi/factories/Inbox__factory";

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

export enum MessageType {
    DEPOSIT = 1,
    WITHDRAW = 2
}

export interface ETHDepositOrWithdrawalMessage {
    time: BigNumber;
    token: string;
    from: Chain;
    to: Chain;
    status: MessageStatusType;
    hash: string;
    type: MessageType;
}

export interface ETHDepositEvent {
    txHash: string;
    sender: string;
    amount: BigNumber;
    messageIndex: BigNumber;
    timestamp: BigNumber;
}

/*// Retrieve the NFT data from localStorage
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
};*/

/*// Retrieve pending outgoing NFTs with their states from storage -- approach not used
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
};*/


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

// Fetch the state of a parent to child message
export async function getDepositMessageState(
    txHash: string,
    l1Provider: Provider
) {
    const receipt = await l1Provider.getTransactionReceipt(txHash);
    const l1Receipt = new ParentEthDepositTransactionReceipt(receipt);

    const messages = await l1Receipt.getEthDeposits(l1Provider);
    const parentToChildMsg = messages[0];

    return parentToChildMsg.status();
}

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

export const getDepositMessagesFromEventLogs = async (
    receiver: string,
    l1Provider: Provider,
    l2Provider: Provider
) => {
    const fromBlock = (await l1Provider.getBlockNumber()) - 10_368_000 //4_838_400 2 weeks // 10_368_000 1 month
    const deposits = await fetchETHDepositFromEventLogs({
        receiver, fromBlock, toBlock: 'latest', l1Provider, l2Provider
    })

    return Promise.all(
        deposits.map(async (event) => {
            const state = await getDepositMessageState(event.txHash, l1Provider);
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

async function getBridgeAddress(childProvider: Provider): Promise<string> {
    const arbNetwork = await getArbitrumNetwork(childProvider);
    if (!arbNetwork.ethBridge) {
        throw new Error('This Arbitrum network does not have a eth bridge configured.');
    }

    return arbNetwork.ethBridge.bridge;
}

async function getInboxAddress(childProvider: Provider): Promise<string> {
    const arbNetwork = await getArbitrumNetwork(childProvider);
    if (!arbNetwork.ethBridge.inbox) {
        throw new Error('This Arbitrum network does not have a eth bridge configured.');
    }

    return arbNetwork.ethBridge.inbox;
}


export async function fetchETHDepositFromEventLogs({receiver, fromBlock, toBlock, l1Provider, l2Provider}: {
    receiver?: string
    fromBlock: BlockTag
    toBlock: BlockTag
    l1Provider: Provider
    l2Provider: Provider
}): Promise<ETHDepositEvent[]> {

    const eventFetcher = new EventFetcher(l1Provider);
    const inboxAddress = await getInboxAddress(l2Provider)
    const events = await eventFetcher.getEvents(
        Inbox__factory,
        contract => contract.filters.InboxMessageDelivered(),
        {fromBlock, toBlock, address: inboxAddress}
    );

    let depositEvents: ETHDepositEvent[] = []

    for (const event of events) {
        const {sender, value} = decodePackedInboxMessageDelivered(event.event.data)

        if (receiver?.toLowerCase() !== sender.toLowerCase())
            continue

        depositEvents.push({
            txHash: event.transactionHash,
            sender: sender,
            amount: value,
            messageIndex: event.event.messageNum,
            timestamp: BigNumber.from(await getTxTimestamp(l1Provider, event.transactionHash))
        })
    }

    return depositEvents
}

export const getETHWithdrawalsInfo = async (receiver: string, l1Provider: Provider, l2Provider: Provider): Promise<ETHDepositOrWithdrawalMessage[]> => {
    const events = await getOutgoingMessagesFromEventLogs(receiver, l1Provider, l2Provider)

    return events.map((event) => {
        return {
            time: event.timestamp,
            token: formatBalance(event.callvalue.toBigInt(), 6),
            from: defaultChain,
            to: baseChain,
            status: WITHDRAWAL_STATUS[event.state],
            hash: event.transactionHash,
            type: MessageType.WITHDRAW
        }
    })
}

export const getETHDepositsInfo = async (receiver: string, l1Provider: Provider, l2Provider: Provider): Promise<ETHDepositOrWithdrawalMessage[]> => {
    const events = await getDepositMessagesFromEventLogs(receiver, l1Provider, l2Provider)

    return events.map((event) => ({
        time: event.timestamp,
        token: formatBalance(event.amount.toBigInt(), 6),
        from: baseChain,
        to: defaultChain,
        status: DEPOSIT_STATUS[event.state],
        hash: event.txHash,
        type: MessageType.DEPOSIT
    }))
}


interface MessageStatusType {
    status: string;
    color: string;
}

export const WITHDRAWAL_STATUS: MessageStatusType[] = [
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

export const DEPOSIT_STATUS: MessageStatusType[] = [
    /**
     * ETH is not deposited on Chain yet
     */
    {status: "Pending", color: "yellow"},
    /**
     * ETH is deposited successfully on Chain
     */
    {status: "Deposited", color: "black"}
]

export const getTxExpectedDeadlineTimestamp = async (l2Provider: Provider, hash: string) => {
    const timestamp = await getTxTimestamp(l2Provider, hash)
    const createdAt = dayjs.unix(timestamp);
    return createdAt.add(CONFIRMATION_BUFFER_MINUTES, 'minutes').unix()
};

export const getTxTimestamp = async (provider: Provider, hash: string) => {
    const txReceipt = await provider.getTransactionReceipt(hash)
    const block = await provider.getBlock(txReceipt.blockNumber);
    return block.timestamp
}

function decodePackedInboxMessageDelivered(encodedData: string) {
    const sender = encodedData.slice(0, 42); // First 20 bytes for address
    const value = ethers.BigNumber.from("0x" + encodedData.slice(42)); // Remaining bytes for uint256
    return {sender, value};
}