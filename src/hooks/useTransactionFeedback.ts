import { useCallback, useState } from "react";
import { useConfig, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import type { TransactionStatus } from "@/components/ui/TransactionModal";

type TxPatch = { status?: TransactionStatus; hash?: string };

/** Short, user-facing message for a wallet, viem or ethers error. */
export function txErrorMessage(err: unknown): string {
  const e = (err ?? {}) as { shortMessage?: string; reason?: string; message?: string; code?: unknown };
  const raw = e.shortMessage ?? e.reason ?? e.message ?? "Something went wrong. Please try again.";
  if (e.code === 4001 || e.code === "ACTION_REJECTED" || /user (rejected|denied)/i.test(raw)) {
    return "Transaction was rejected in your wallet";
  }
  if (/insufficient funds/i.test(raw)) return "Insufficient funds for this transaction";
  return raw.length > 150 ? `${raw.slice(0, 150)}...` : raw;
}

/**
 * State for one transaction flow and its TransactionModal.
 * `run` drives a multi-step flow (ethers bridge calls); `send` covers a single wagmi
 * contract write: submit, then wait for the receipt (a revert throws).
 */
export function useTransactionFeedback() {
  const config = useConfig();
  const { writeContractAsync } = useWriteContract();
  const [isOpen, setIsOpen] = useState(false);
  const [tx, setTx] = useState<{ status: TransactionStatus; hash?: string; error?: string }>({
    status: "idle",
  });

  const run = useCallback(async (flow: (update: (patch: TxPatch) => void) => Promise<void>) => {
    setIsOpen(true);
    setTx({ status: "pending" });
    try {
      await flow((patch) => setTx((t) => ({ ...t, ...patch })));
      setTx((t) => ({ ...t, status: "success" }));
      return true;
    } catch (err) {
      console.error(err);
      setTx((t) => ({ ...t, status: "error", error: txErrorMessage(err) }));
      return false;
    }
  }, []);

  const send = useCallback(
    (submit: () => Promise<`0x${string}`>) =>
      run(async (update) => {
        const hash = await submit();
        update({ hash, status: "confirming" });
        await waitForTransactionReceipt(config, { hash });
      }),
    [run, config],
  );

  const close = useCallback(() => setIsOpen(false), []);
  const isBusy = tx.status === "pending" || tx.status === "confirming" || tx.status === "bridging";

  return { ...tx, isOpen, isBusy, run, send, close, writeContractAsync };
}
