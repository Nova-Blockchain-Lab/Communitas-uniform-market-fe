import { formatEther } from "viem";
import { formatDistanceToNowStrict } from "date-fns";

/** "0.0123 ETH" with a fixed number of decimals, "0 ETH" when empty */
export const formatBalance = (wei: bigint | undefined, fixedDecimals = 4): string =>
  wei ? `${Number(formatEther(wei)).toFixed(fixedDecimals)} ETH` : "0 ETH";

/** Seconds from now until a unix time, 0 once it has passed */
export const secondsUntil = (unixSeconds: number): number =>
  Math.max(0, unixSeconds - Date.now() / 1000);

/** "12 minutes left" until a unix time, "Finalizing" once it has passed */
export const timeLeftLabel = (unixSeconds: number): string =>
  secondsUntil(unixSeconds) > 0
    ? `${formatDistanceToNowStrict(unixSeconds * 1000)} left`
    : "Finalizing";
