import jsonAddresses from "@/../constants/addresses.json";

export const DECIMALS = 18;

// Minutes after a withdrawal before it is expected to be claimable on the parent chain
export const CONFIRMATION_BUFFER_MINUTES = 70;

/** Per chain id, per contract name, per region: deployed contract address */
export const contractAddresses = jsonAddresses as Record<
  string,
  Record<string, Record<string, `0x${string}`>>
>;

export const OPENSEA_URL_CREATOR = (contract: string, tokenId: string) =>
  `https://testnets.opensea.io/assets/arbitrum_sepolia/${contract}/${tokenId}`;

// The contract works in Watts, the UI shows kWh
export const WATTS_PER_KWH = 1000;
