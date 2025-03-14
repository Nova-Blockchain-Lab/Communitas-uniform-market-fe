"use client";
import React, {useEffect, useState} from "react";
import {useAccount} from "wagmi";
import {
    ETHDepositOrWithdrawalMessage,
    getETHDepositsInfo,
    getETHWithdrawalsInfo
} from "@/utils/executeMessageL2ToL1Helper";
import {useAppContext} from "../AppContext";
import {Spinner} from "@chakra-ui/react";
import MessageHistoryRow from "./MessageHistoryRow";


const BridgeHistory: React.FC = () => {
    const {address, isConnected} = useAccount();
    const {l1Provider, l2Provider} = useAppContext();

    const [messages, setMessages] = useState<ETHDepositOrWithdrawalMessage[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const getMessages = async () => {
        if (!isConnected || !address || !l1Provider || !l2Provider || isLoading) return;

        setIsLoading(true)

        const withdraws = await getETHWithdrawalsInfo(address, l1Provider, l2Provider)
        const deposits = await getETHDepositsInfo(address, l1Provider, l2Provider)

        const allMessages = [...withdraws, ...deposits].sort((a, b) => b.time.sub(a.time).toNumber());

        setMessages(allMessages)

        setIsLoading(false)
    }

    useEffect(() => {
        getMessages()
    }, [address, isConnected, l1Provider, l2Provider]);


    return (
        <div className="p-6 bg-white rounded-lg shadow-lg overflow-x-auto">
            <table className="min-w-full text-sm text-gray-700">
                <thead className="text-xs uppercase bg-blue-50">
                <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4">Token</th>
                    <th className="px-4">From</th>
                    <th className="px-4">To</th>
                    <th className="px-4">Status</th>
                    <th className="px-4">Claim</th>
                    {/*<th className="px-4">Details</th>*/}
                </tr>
                </thead>
                <tbody>
                {isLoading && (
                    <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-75"><Spinner/>
                    </div>
                )}
                {!isLoading && messages.map((msg, idx) => (
                    <MessageHistoryRow key={idx} message={msg} refetchMessages={getMessages}/>
                ))}
                </tbody>
            </table>
            {!isConnected && (
                <div className="py-4 text-center text-gray-500">Please connect your wallet.</div>
            )}
            {isConnected && !messages.length && (
                <div className="py-4 text-center text-gray-500">No bridge history found.</div>
            )}
        </div>
    );
};

export default BridgeHistory;
