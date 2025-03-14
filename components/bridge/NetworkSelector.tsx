import React, {useState} from "react";
import {DropdownIcon, EthereumIcon, BnbIcon, ArbitrumIcon, NovaCidadeIcon} from "./IconComponents";
import {useConfig} from "wagmi";
import Image from "next/image";

interface NetworkSelectorProps {
    selectedNetwork: number;
    onSelectNetwork: (network: number) => void;
}

const NetworkSelector: React.FC<NetworkSelectorProps> = ({
                                                             selectedNetwork,
                                                             onSelectNetwork,
                                                         }) => {

    const config = useConfig()

    const [isOpen, setIsOpen] = useState(false);

    const networkSelectorOptions = [
        {
            name: config.chains[0].name,
            id: config.chains[0].id,
            icon: <NovaCidadeIcon/>,
        },
        {
            name: config.chains[1].name,
            id: config.chains[1].id,
            icon: <ArbitrumIcon/>,
        },
    ];

    const selectedOption = networkSelectorOptions.find(
        (opt) => opt.id === selectedNetwork
    );

    return (
        <div className="relative">
            <button
                className="flex items-center px-3 py-2 rounded-xl border border-solid cursor-pointer bg-white bg-opacity-20 border-white border-opacity-10 w-full max-sm:px-2 max-sm:py-1.5"
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label={`Select network: ${selectedOption?.name}`}
            >
                <div className="mr-3 w-6 h-6">
                    {selectedOption?.icon}
                </div>
                <span className="grow text-base text-white">
                    {selectedOption?.name}
                </span>
                <DropdownIcon/>
            </button>
            {isOpen && (
                <div className="absolute mt-1 bg-white shadow-lg rounded-xl z-10">
                    {networkSelectorOptions.map((opt) => (
                        <div
                            key={opt.id}
                            className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                                onSelectNetwork(opt.id);
                                setIsOpen(false);
                            }}
                        >
                            <div className="mr-2 w-5 h-5">{opt.icon}</div>
                            <span>{opt.name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NetworkSelector;
