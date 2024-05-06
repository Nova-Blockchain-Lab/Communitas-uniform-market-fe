import {
	arbitrumSepolia,
} from "wagmi/chains";
import { http, createConfig } from 'wagmi'



export const defaultChain = arbitrumSepolia;


export const chains = [
	defaultChain
];

const contractAddresses = {
	[arbitrumSepolia.id]: {
		energyMarket: "0xD7907D20217A466CE4759c5A83cE2Cad2682536c",
		eurc: "0xe951eB04Cd25471013eb571780677Bc9918f4B1A",
	}
}

export const config = createConfig({
	chains: [arbitrumSepolia],
	transports: {
	  [arbitrumSepolia.id]: http(),
	},
  })

export const getEnergyMarketAddress = () => contractAddresses[defaultChain.id].energyMarket;

export const getEURCAddress = () => contractAddresses[defaultChain.id].eurc;