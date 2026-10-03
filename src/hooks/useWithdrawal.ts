import { useQuery } from "@tanstack/react-query";
import { useEthersSigner } from "@/utils/ethersHelper";
import { useTransactionFeedback } from "@/hooks/useTransactionFeedback";
import {
  type BridgeStatus,
  executeWithdrawal,
  getOutgoingMessageState,
  getTxExpectedDeadlineTimestamp,
  WITHDRAWAL_STATUS,
} from "@/utils/executeMessageL2ToL1Helper";

/**
 * Status of a Nova Cidade to Arbitrum Sepolia withdrawal (ETH or NFT), polled every minute,
 * plus the claim action. Shared by the bridge history and the NFT tab; react-query keys
 * by hash, so two components showing the same withdrawal share one poll.
 */
/** Pass `undefined` for a row that is not a withdrawal: nothing is fetched. */
export function useWithdrawal(hash: string | undefined, initialStatus?: BridgeStatus) {
  const signer = useEthersSigner();
  const tx = useTransactionFeedback();

  const statusQuery = useQuery({
    queryKey: ["withdrawalStatus", hash],
    queryFn: async () => WITHDRAWAL_STATUS[await getOutgoingMessageState(hash!)],
    enabled: !!hash,
    refetchInterval: 60_000,
  });
  const { data: deadline } = useQuery({
    queryKey: ["withdrawalDeadline", hash],
    queryFn: () => getTxExpectedDeadlineTimestamp(hash!),
    enabled: !!hash,
    staleTime: Infinity,
  });

  const claim = () =>
    tx.run(async (update) => {
      if (!signer || !hash) throw new Error("Connect your wallet first");
      const sent = await executeWithdrawal(hash, signer);
      update({ hash: sent.hash, status: "confirming" });
      await sent.wait(1);
      await statusQuery.refetch();
    });

  return {
    status: statusQuery.data ?? initialStatus,
    isLoading: statusQuery.isLoading,
    /** unix seconds */
    deadline,
    claim,
    tx,
  };
}
