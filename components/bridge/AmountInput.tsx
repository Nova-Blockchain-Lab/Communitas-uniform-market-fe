import React from "react";
import {InfoIcon, TokenIcon} from "./IconComponents";
import {useAppContext} from "../AppContext";

interface AmountInputProps {
    label: string;
    amount: string;
    maxAmount?: string;
    showTokenSelector?: boolean;
    tokenName?: string;
    isInput: boolean;
    showInfoIcon?: boolean;
    onChange?: (value: string) => void;
}

export const AmountInput: React.FC<AmountInputProps> = ({
                                                            label,
                                                            amount,
                                                            maxAmount,
                                                            showTokenSelector = false,
                                                            tokenName,
                                                            isInput,
                                                            showInfoIcon = false,
                                                            onChange,
                                                        }) => {
    const { ethPrice } = useAppContext();

    return (
        <div
            className="p-4 mt-2 rounded-xl border border-solid bg-white bg-opacity-20 border-white border-opacity-10 max-sm:p-3">
            <div className="flex gap-1.5 items-center text-xs text-white">
                {showInfoIcon && <InfoIcon/>}
                <span>{label}</span>
            </div>

            {maxAmount && (
                <div className="flex justify-end mb-2 text-xs text-white">
                    <span>Max:</span>
                    <span>{maxAmount}</span>
                </div>
            )}

            <div className="flex justify-between items-center">
                {isInput ? (
                    <div className="relative inline-block w-full">
                        <input
                            type="text"
                            value={amount}
                            onChange={(e) => onChange && onChange(e.target.value)}
                            className="bg-transparent border border-gray-300 rounded-lg w-full p-2 text-left text-xl text-white placeholder-transparent focus:outline-none focus:ring-0"
                        />
                        {amount === "" && (
                            <div className="absolute inset-0 flex items-center pointer-events-none px-3">
                                <span className="text-gray-400 text-lg">0</span>
                            </div>
                        )}
                    </div>

                ) : (
                    <span className="text-xl text-white">{amount}</span>
                )}

                {showTokenSelector && (
                    <button
                        className="flex gap-2 items-center cursor-pointer"
                        aria-label="Select token"
                    >
                        <TokenIcon tokenName={tokenName || "USDT"}/>
                    </button>
                )}
            </div>
            {isInput && ethPrice && (
                <div className="flex justify-end text-xs text-gray-800 mt-1">
                    ${(+amount * ethPrice).toFixed(2)}
                </div>
            )}
        </div>
    );
};
