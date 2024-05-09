import {
	arbitrumSepolia,
} from "wagmi/chains";
import { http, createConfig } from 'wagmi'



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
		energyMarket: '0xD0F2229e1C2Cd2415572f730Ab40F1B929Fd69fa',
		eurc: '0x4Ec40C0389a1395E5927366aEd22D9D163c64a75',
	}
}

export const config = createConfig({
	chains: [arbitrumSepolia],
	transports: {
	  [arbitrumSepolia.id]: http(),
	},
  })

export const energyMarketAddress = contractAddresses[defaultChain.id].energyMarket;

export const EURCAddress = contractAddresses[defaultChain.id].eurc;

export const DAYS_TO_DISPLAY = 1; // 0 means today, 1 means today and yesterday and tomorrow.