import {
	arbitrumSepolia,
} from "wagmi/chains";
import { defaultWagmiConfig } from "@web3modal/wagmi";



export const defaultChain = arbitrumSepolia;

export const chains = [
	defaultChain
];

type EthereumAddress = `0x${string}`;

interface ContractAddresses {
    [key: number]: {
        energyMarket: EthereumAddress;
    };
}

const contractAddresses: ContractAddresses = {
	[arbitrumSepolia.id]: {
		energyMarket: '0x3CDCE2e7849b44bFED073024fA21421c03714E79',
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

export const DAYS_TO_DISPLAY = 1; // 0 means today, 1 means today and yesterday and tomorrow.