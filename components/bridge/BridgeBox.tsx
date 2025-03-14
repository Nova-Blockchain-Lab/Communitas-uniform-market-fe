"use client";
import React, {useEffect, useState} from "react";
import {AmountInput} from "./AmountInput";
import {SwapIcon} from "./IconComponents";
import {SubmitButton} from "./SubmitButton";
import NetworkSelector from "./NetworkSelector";
import {useAccount, useConfig} from "wagmi";
import {useAppContext} from "../AppContext";
import {baseChain, defaultChain} from "../../constants/config";
import {formatBalance} from "@/utils/utils";

export const BridgeBox: React.FC = () => {
    const {chains} = useConfig()

    const {address, isConnected} = useAccount()

    const {l1Provider, l2Provider} = useAppContext()

    const [selectedOriginNetwork, onSelectOriginNetwork] = useState<number>(baseChain.id)
    const [selectedDestinationNetwork, onSelectedDestinationNetwork] = useState<number>(defaultChain.id)

    const [depositAmount, setDepositAmount] = useState<BigInt>(BigInt(0))
    const [inputDisplayValue, setInputDisplayValue] = useState<string>("");

    const [originBalance, setOriginBalance] = useState<BigInt | undefined>()
    const [destinationBalance, setDestinationBalance] = useState<BigInt | undefined>()

    const onSelectOriginNetworkHelper = (id: number) => {
        onSelectOriginNetwork(id);
        onSelectedDestinationNetwork(chains.map((chain) => chain.id).filter((_id) => id !== _id)[0])
    }

    const onSelectDestinationNetworkHelper = (id: number) => {
        onSelectedDestinationNetwork(id);
        onSelectOriginNetwork(chains.map((chain) => chain.id).filter((_id) => id !== _id)[0])
    }

    const switchNetworks = () => {
        onSelectDestinationNetworkHelper(selectedOriginNetwork)
    }

    const handleAmountChange = (inputValue: string) => {
        setInputDisplayValue(inputValue);

        const normalizedValue = inputValue.replace(/,/g, '').trim();

        if (!normalizedValue || isNaN(Number(normalizedValue))) {
            setDepositAmount(BigInt(0));
            return;
        }

        try {
            // Multiply by 10^18 and handle decimal conversion
            const parts = normalizedValue.split(".");
            const integerPart = BigInt(parts[0]) * BigInt(10 ** 18);
            const fractionalPart = parts[1] ? BigInt(parts[1].padEnd(18, '0').slice(0, 18)) : BigInt(0);

            const finalValue = integerPart + fractionalPart;
            setDepositAmount(finalValue);
        } catch (e) {
            console.warn("Invalid input:", e);
            setDepositAmount(BigInt(0));
        }
    };

    const hasEnoughBalance = originBalance !== undefined ? originBalance >= depositAmount : false;

    const setBalancesWithProvider = async (chainId: number) => {
        if (!address || !l1Provider || !l2Provider) {
            setOriginBalance(undefined)
            setDestinationBalance(undefined)
            return;
        }

        if (chainId === defaultChain.id) {
            setOriginBalance(BigInt((await l1Provider.getBalance(address)).toString()))
            setDestinationBalance(BigInt((await l2Provider.getBalance(address)).toString()))
        } else if (chainId === baseChain.id) {
            setOriginBalance(BigInt((await l2Provider.getBalance(address)).toString()))
            setDestinationBalance(BigInt((await l1Provider.getBalance(address)).toString()))
        }
    }

    useEffect(() => {
        setBalancesWithProvider(selectedDestinationNetwork)
    }, [selectedDestinationNetwork, address, isConnected, l1Provider, l2Provider]);

    return (
        <div className="space-y-4">
            <div>
                <div className="flex items-center mb-2">
                    <span className="text-sm text-white font-bold mr-4">From</span>
                    <NetworkSelector
                        selectedNetwork={selectedOriginNetwork}
                        onSelectNetwork={onSelectOriginNetworkHelper}
                    />
                </div>
                <AmountInput
                    label="Send:"
                    maxAmount={formatBalance(originBalance)}
                    amount={inputDisplayValue}
                    showTokenSelector={true}
                    tokenName="ETH"
                    isInput={true}
                    onChange={handleAmountChange}
                />
                {!hasEnoughBalance && originBalance && (
                    <div className="text-red-500 text-sm">
                        Insufficient balance
                    </div>
                )}
            </div>

            <div className="flex justify-center my-2">
                <button onClick={switchNetworks} aria-label="Swap networks"
                        className="p-2 rounded-full bg-white bg-opacity-20 backdrop-blur-sm">
                    <SwapIcon/>
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <div className="flex items-center mb-2">
                        <span className="text-sm text-white font-bold mr-4">To</span>
                        <NetworkSelector selectedNetwork={selectedDestinationNetwork}
                                         onSelectNetwork={onSelectDestinationNetworkHelper}/>
                    </div>
                    <AmountInput
                        label="Current balance:"
                        amount={formatBalance(destinationBalance)}
                        showTokenSelector={false}
                        isInput={false}
                        showInfoIcon={true}
                    />
                </div>
            </div>

            <SubmitButton originNetwork={selectedOriginNetwork} amount={depositAmount}
                          hasEnoughBalance={hasEnoughBalance}/>
        </div>
    );
};

export default BridgeBox;