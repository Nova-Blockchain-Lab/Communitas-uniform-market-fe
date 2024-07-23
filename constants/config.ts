import { arbitrumSepolia } from "wagmi/chains";
import { defaultWagmiConfig } from "@web3modal/wagmi";

export const DECIMALS = 18;

export const defaultChain = arbitrumSepolia;

export const chains = [defaultChain];

type EthereumAddress = `0x${string}`;

interface ContractAddresses {
  [networkId: number]: {
    energyMarket: {
		[country: string]: EthereumAddress;
	}
  };
}

export const contractAddresses: ContractAddresses = {
  [arbitrumSepolia.id]: {
    energyMarket: {
		"Spain": "0x36cf1ab4568ef261b12967a4959CA82eDD0B88f1",
    "Portugal": "0x4366F3B76aFf8bAe47009689a7A49130E6fB646A",
		"Germany": "0x400806DBCc53355FCd284b2c0e10FD3578f1c2ae",
    "Greece": "0x4cFeFDE508Bc2FC80D33fD607cb33cDf9638C5A5",
    "Italy": "0x2Ca5A390a8eBe0591F02fB36960f79A23b60A2Bd",
    "Netherlands": "0xe1D7f763808c0cD58461c85eaD2Dd484f3abea83",
    //"Poland": "",
    //"Croatia": "",
    "Denmark": "0xB177e1A14aF7B0E5991eBccdc11F91801A1DDae8",
	},
  },
};

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
  auth: {
    email: true,
    showWallets: true,
    walletFeatures: true,
  },
  enableCoinbase: true,
  enableInjected: true,
  enableWalletConnect: true,
  enableEIP6963: true,
  coinbasePreference: "all",
});

export const DAYS_TO_DISPLAY = 1; // 0 means today, 1 means today and yesterday and tomorrow.
