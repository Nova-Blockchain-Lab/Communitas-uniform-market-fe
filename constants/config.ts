import { arbitrumSepolia } from "wagmi/chains";
import { defaultWagmiConfig } from "@web3modal/wagmi";

export const DECIMALS = 18;

export const defaultChain = arbitrumSepolia;

export const chains = [defaultChain];

type EthereumAddress = `0x${string}`;

interface ContractAddresses {
  [key: number]: {
    energyMarket: EthereumAddress;
  };
}

const contractAddresses: ContractAddresses = {
  [arbitrumSepolia.id]: {
    energyMarket: "0x4366F3B76aFf8bAe47009689a7A49130E6fB646A",
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

export const energyMarketAddress =
  contractAddresses[defaultChain.id].energyMarket;

export const DAYS_TO_DISPLAY = 1; // 0 means today, 1 means today and yesterday and tomorrow.
