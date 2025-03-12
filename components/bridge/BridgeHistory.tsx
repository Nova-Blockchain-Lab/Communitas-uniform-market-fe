"use client";
import React, {useEffect, useState} from "react";
import {useAccount, useSwitchChain} from "wagmi";
import {ETHWithdrawalMessage, formatTimestamp, getETHWithdrawalsInfo} from "@/utils/executeMessageL2ToL1Helper";
import {useAppContext} from "../AppContext";
import {Spinner} from "@chakra-ui/react";
import {ArbitrumIcon, NovaCidadeIcon} from "./IconComponents";
import {baseChain, defaultChain} from "../../constants/config";
import {ChildTransactionReceipt} from "@arbitrum/sdk";
import {useEthersSigner} from "@/utils/ethersHelper";


const BridgeHistory: React.FC = () => {
    const {address, isConnected, chainId} = useAccount();
    const {l1Provider, l2Provider} = useAppContext();
    const {switchChain} = useSwitchChain();
    const signer = useEthersSigner()

    const [messages, setMessages] = useState<ETHWithdrawalMessage[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false)

    const handleBridge = async (hash: string) => {
        if (chainId === defaultChain.id)
            switchChain({chainId: baseChain.id})

        if (!isConnected || !address || !l1Provider || !l2Provider || !signer) return;

        const receipt = await l2Provider.getTransactionReceipt(hash)
        const l2Receipt = new ChildTransactionReceipt(receipt)

        const messages = await l2Receipt.getChildToParentMessages(signer)
        const childToParentMsg = messages[0]

        try {

            const tx = await childToParentMsg.execute(l2Provider)

            const txReceipt = await tx.wait(1)

            //sendSuccessfulExecutionNotification()

        } catch (e) {
            console.log(e)
            //sendUnsuccessfulNotification()
        }
    };

    const getWithdrawalsMessages = async () => {
        if (!isConnected || !address || !l1Provider || !l2Provider || isLoading) return;

        setIsLoading(true)

        const messages = await getETHWithdrawalsInfo(address, l1Provider, l2Provider)
        setMessages(messages)

        setIsLoading(false)
    }

    useEffect(() => {
        getWithdrawalsMessages()
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
                    <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-75"><Spinner/></div>
                )}
                {!isLoading && messages.map((msg, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-100">
                        <td className="px-4 py-2">{formatTimestamp(msg.time)}</td>
                        <td className="px-4 py-2">{msg.token}</td>
                        <td className="px-4 py-2 truncate max-w-xs"><NovaCidadeIcon/> {msg.from}</td>
                        <td className="px-4 py-2 truncate max-w-xs"><ArbitrumIcon/> {msg.to}</td>
                        <td className={`px-4 py-2 text-${msg.status.color}-600 font-semibold`}>{msg.status.status}</td>
                        <td className="px-4 py-2"><button className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow transition duration-200 hover:bg-blue-700 text-center max-sm:px-3 max-sm:py-3" onClick={() => handleBridge(msg.hash)}>Claim</button></td>
                        {/*<td className="px-4 py-2 text-blue-600 hover:underline cursor-pointer">
                            {"Details"}
                        </td>*/}
                    </tr>
                ))}
                </tbody>
            </table>
            {!messages.length && (
                <div className="py-4 text-center text-gray-500">No bridge history found.</div>
            )}
        </div>
    );
};

export default BridgeHistory;
