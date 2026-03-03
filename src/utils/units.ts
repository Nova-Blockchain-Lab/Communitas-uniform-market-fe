import { DECIMALS, WATTS_PER_KWH } from "@/config";

/** Convert Watts (bigint from contract) to kWh for display */
export const wattsToKWh = (watts: bigint): number => Number(watts) / WATTS_PER_KWH;

/** Convert kWh (user input) to Watts for contract */
export const kWhToWatts = (kWh: number): number => kWh * WATTS_PER_KWH;

/** Convert price-per-Watt in wei (bigint from contract) to price-per-kWh in ETH */
export const pricePerWattToPerKWh = (pricePerWatt: bigint): number =>
  (Number(pricePerWatt) * WATTS_PER_KWH) / 10 ** DECIMALS;

/** Convert price-per-kWh in ETH to price-per-Watt in wei (bigint for contract) */
export const pricePerKWhToPerWattWei = (pricePerKWhETH: number): bigint =>
  BigInt(Math.round((pricePerKWhETH * 10 ** DECIMALS) / WATTS_PER_KWH));

/** Convert wei (bigint) to ETH */
export const weiToEth = (wei: bigint): number => Number(wei) / 10 ** DECIMALS;
