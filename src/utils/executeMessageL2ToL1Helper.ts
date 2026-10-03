import type { Signer } from "ethers";
import { BigNumber, ethers } from "ethers";
import {
    ChildToParentMessageReader,
    ChildToParentMessageStatus,
    ChildTransactionReceipt,
    EthDepositMessageStatus,
    EventFetcher,
    ParentEthDepositTransactionReceipt,
} from "@arbitrum/sdk";
import { Inbox__factory } from "@arbitrum/sdk/dist/lib/abi/factories/Inbox__factory";
import type { Chain } from "viem";

import CommunitasNFTL2Abi from "@/../abi/CommunitasNFTL2.json";
import outputInfo from "@/../constants/outputInfo.json";
import { baseChain, defaultChain } from "@/config/chains";
import { CONFIRMATION_BUFFER_MINUTES, contractAddresses } from "@/config/constants";
import { l1Provider, l2Provider } from "@/config/providers";
import { formatBalance } from "@/utils/utils";

export interface NFTData {
    tokenId: string;
    image: string;
    name: string;
    description: string;
}

export interface NFTDataWithStatus extends NFTData {
    hash: string;
    owner: string;
    state: ChildToParentMessageStatus;
}

export enum MessageType {
    DEPOSIT = 1,
    WITHDRAW = 2,
}

export type BridgeStatus = "pending" | "claimable" | "completed";

export interface ETHDepositOrWithdrawalMessage {
    /** unix seconds */
    time: number;
    token: string;
    from: Chain;
    to: Chain;
    status: BridgeStatus;
    hash: string;
    type: MessageType;
}

// Keyed by the SDK enums: ChildToParentMessageStatus starts at 0, EthDepositMessageStatus at 1.
export const WITHDRAWAL_STATUS: Record<ChildToParentMessageStatus, BridgeStatus> = {
    [ChildToParentMessageStatus.UNCONFIRMED]: "pending",
    [ChildToParentMessageStatus.CONFIRMED]: "claimable",
    [ChildToParentMessageStatus.EXECUTED]: "completed",
};

export const DEPOSIT_STATUS: Record<EthDepositMessageStatus, BridgeStatus> = {
    [EthDepositMessageStatus.PENDING]: "pending",
    [EthDepositMessageStatus.DEPOSITED]: "completed",
};

/** State of the Nova Cidade to Arbitrum Sepolia message created by `txHash`. */
export async function getOutgoingMessageState(txHash: string) {
    const receipt = new ChildTransactionReceipt(await l2Provider.getTransactionReceipt(txHash));
    const [message] = await receipt.getChildToParentMessages(l1Provider);
    return message.status(l2Provider);
}

/** Execute a confirmed withdrawal on the parent chain. The signer must be on Arbitrum Sepolia. */
export async function executeWithdrawal(txHash: string, signer: Signer) {
    const receipt = new ChildTransactionReceipt(await l2Provider.getTransactionReceipt(txHash));
    const [message] = await receipt.getChildToParentMessages(signer);
    if (!message) throw new Error("No withdrawal message found for this transaction");
    return message.execute(l2Provider);
}

/** Unix time when the withdrawal sent in `hash` should become claimable. */
export async function getTxExpectedDeadlineTimestamp(hash: string) {
    const receipt = await l2Provider.getTransactionReceipt(hash);
    const { timestamp } = await l2Provider.getBlock(receipt.blockNumber);
    return timestamp + CONFIRMATION_BUFFER_MINUTES * 60;
}

/** Withdrawals to `receiver` over the last month (~1 Nova Cidade block per second), with their state. */
async function getOutgoingMessagesFromEventLogs(receiver: string) {
    const fromBlock = Math.max(0, (await l2Provider.getBlockNumber()) - 2_592_000);
    const events = await ChildToParentMessageReader.getChildToParentEvents(
        l2Provider,
        { fromBlock, toBlock: "latest" },
        undefined,
        receiver,
    );
    return Promise.all(
        events.map(async (event) => ({ ...event, state: await getOutgoingMessageState(event.transactionHash) })),
    );
}

/** NFTs `owner` sent from Nova Cidade that are not yet executed on Arbitrum Sepolia. */
export async function getPendingOutgoingNftsFromEventLogs(owner: string): Promise<NFTDataWithStatus[]> {
    const nftOnParent = contractAddresses[baseChain.id].CommunitasNFT.General;
    const nftOnChild = contractAddresses[defaultChain.id].CommunitasNFT.General.toLowerCase();

    const pending = (await getOutgoingMessagesFromEventLogs(nftOnParent)).filter(
        ({ state }) => state !== ChildToParentMessageStatus.EXECUTED,
    );
    const nftIface = new ethers.utils.Interface(CommunitasNFTL2Abi.abi);

    const nfts = await Promise.all(
        pending.map(async (msg) => {
            const receipt = await l2Provider.getTransactionReceipt(msg.transactionHash);
            const logs = receipt.logs.filter((log) => log.address.toLowerCase() === nftOnChild);
            const log = nftIface.parseLog(logs.filter((l) => nftIface.parseLog(l).name === "L2ToL1TxCreated")[0]);
            const metadata = await (await fetch(log.args.tokenURI)).json();
            return {
                ...metadata,
                tokenId: log.args.tokenId.toString(),
                owner: log.args.from,
                hash: msg.transactionHash,
                state: msg.state,
            } as NFTDataWithStatus;
        }),
    );
    return nfts.filter((nft) => nft.owner === owner);
}

export async function getETHWithdrawalsInfo(receiver: string): Promise<ETHDepositOrWithdrawalMessage[]> {
    return (await getOutgoingMessagesFromEventLogs(receiver)).map((event) => ({
        time: event.timestamp.toNumber(),
        token: formatBalance(event.callvalue.toBigInt(), 6),
        from: defaultChain,
        to: baseChain,
        status: WITHDRAWAL_STATUS[event.state],
        hash: event.transactionHash,
        type: MessageType.WITHDRAW,
    }));
}

/**
 * ETH deposits to `receiver` through the Nova Cidade inbox over about the last 26 days
 * (~4 Arbitrum Sepolia blocks per second). The public Arbitrum RPC rejects eth_getLogs
 * spanning more than 10,000,000 blocks, so the window stays under that.
 */
export async function getETHDepositsInfo(receiver: string): Promise<ETHDepositOrWithdrawalMessage[]> {
    const fromBlock = (await l1Provider.getBlockNumber()) - 9_000_000;
    const events = await new EventFetcher(l1Provider).getEvents(
        Inbox__factory,
        (contract) => contract.filters.InboxMessageDelivered(),
        { fromBlock, toBlock: "latest", address: outputInfo.coreContracts.inbox },
    );

    // An ETH deposit's message data is the packed (destination, value), so the first 20 bytes
    // are the receiving address.
    const mine = events.filter((e) => e.event.data.slice(0, 42).toLowerCase() === receiver.toLowerCase());

    return Promise.all(
        mine.map(async (e) => {
            const receipt = await l1Provider.getTransactionReceipt(e.transactionHash);
            // The deposit lands on the child chain, so its status is read there.
            const [deposit] = await new ParentEthDepositTransactionReceipt(receipt).getEthDeposits(l2Provider);
            return {
                time: (await l1Provider.getBlock(receipt.blockNumber)).timestamp,
                token: formatBalance(BigNumber.from("0x" + e.event.data.slice(42)).toBigInt(), 6),
                from: baseChain,
                to: defaultChain,
                status: DEPOSIT_STATUS[await deposit.status()],
                hash: e.transactionHash,
                type: MessageType.DEPOSIT,
            };
        }),
    );
}
