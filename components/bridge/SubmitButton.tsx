"use client";
import React, {useState} from "react";
import {WalletIcon} from "./IconComponents";
import {useAccount, useSwitchChain} from "wagmi";
import {EthBridger, EthDepositMessageStatus, getArbitrumNetwork} from "@arbitrum/sdk";
import {baseChain, defaultChain} from "../../constants/config";
import {useEthersSigner} from "@/utils/ethersHelper";
import {BigNumber} from "ethers";
import {useAppContext} from "../AppContext";
import {ToastId, useToast} from "@chakra-ui/react";
import {SubmitDepositButton} from "./SubmitDepositButton";
import {SubmitWithdrawalButton} from "./SubmitWithdrawalButton";

interface SubmitButtonProps {
    originNetwork: number;
    amount: BigInt;
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({originNetwork, amount}) => {
    const {isConnected, chain} = useAccount();
    const {switchChain} = useSwitchChain();

    if (!isConnected)
        return (
            <button
                className="flex gap-3 justify-center items-center p-4 mt-5 bg-blue-700 rounded-xl border border-solid cursor-pointer border-white border-opacity-10 w-full max-sm:p-3">
                <WalletIcon/>
                <w3m-connect-button/>
            </button>
        );

    if (originNetwork !== chain?.id)
        return (
            <div
                className="flex gap-3 justify-center items-center p-4 mt-5 bg-blue-700 rounded-xl border border-solid cursor-pointer border-white border-opacity-10 w-full max-sm:p-3">
                <WalletIcon/>
                <button
                    onClick={() => switchChain({chainId: originNetwork})}
                    className="flex gap-2 justify-center items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full cursor-pointer transition duration-200"
                >
                    Change Network
                </button>
            </div>
        )

    if (originNetwork === defaultChain.id)
        return ( <SubmitWithdrawalButton amount={amount}/> )

    return (<SubmitDepositButton amount={amount}/>);
};
