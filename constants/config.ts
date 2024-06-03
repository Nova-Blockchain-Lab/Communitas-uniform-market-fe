import {
	arbitrumSepolia,
} from "wagmi/chains";
import { http } from 'wagmi'
import { TransactionExecutionError } from "viem";
import { defaultWagmiConfig } from "@web3modal/wagmi";



export const defaultChain = arbitrumSepolia;

export const chains = [
	defaultChain
];

type EthereumAddress = `0x${string}`;

interface ContractAddresses {
    [key: number]: {
        energyMarket: EthereumAddress;
        eurc: EthereumAddress;
    };
}

const contractAddresses: ContractAddresses = {
	[arbitrumSepolia.id]: {
		energyMarket: '0xE4299e02946366d4A6Fd86490fB271Ccce6374f7',
		eurc: '0xC37e53e7D0c313D6c838eCcE3C89884798e85AbE',
	}
}

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "";

export const metadata = {
  name: "COMMUNITAS Energy Market",
  description: "A Energy Market for the COMMUNITAS community.",
  url: "https://web3modal.com",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

export const config = defaultWagmiConfig({
	chains: [arbitrumSepolia],
	projectId,
	metadata,
	enableEmail: true // Optional - false by default
  })

export const energyMarketAddress = contractAddresses[defaultChain.id].energyMarket;

export const EURCAddress = contractAddresses[defaultChain.id].eurc;

export const DAYS_TO_DISPLAY = 1; // 0 means today, 1 means today and yesterday and tomorrow.