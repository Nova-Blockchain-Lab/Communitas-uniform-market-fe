import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { TransactionStatus, TransactionType } from "@/components/ui/TransactionModal";

interface TransactionDetails {
  type: TransactionType;
  amount?: number;
  hours?: number;
  totalCost?: string;
  currency?: string;
}

interface UseTransactionFeedbackReturn {
  // Modal state
  isModalOpen: boolean;
  status: TransactionStatus;
  hash: string | undefined;
  error: string | undefined;
  details: TransactionDetails | undefined;

  // Modal actions
  openModal: (details: TransactionDetails) => void;
  closeModal: () => void;
  resetTransaction: () => void;

  // Contract interaction
  writeContract: ReturnType<typeof useWriteContract>["writeContract"];
  isPending: boolean;
  isConfirming: boolean;
  isConfirmed: boolean;
}

/** Extract a user-friendly message from a transaction error. */
function extractErrorMessage(err: Error): string {
  const message = err.message;
  if (message.includes("User rejected")) {
    return "Transaction was rejected by user";
  }
  if (message.includes("insufficient funds")) {
    return "Insufficient funds for this transaction";
  }
  if (message.includes("nonce")) {
    return "Transaction nonce error. Please try again.";
  }
  if (message.length > 150) {
    return message.substring(0, 150) + "...";
  }
  return message;
}

export function useTransactionFeedback(): UseTransactionFeedbackReturn {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [status, setStatus] = useState<TransactionStatus>("idle");
  const [details, setDetails] = useState<TransactionDetails | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  // Ref to read current status inside closeModal without adding it to deps
  const statusRef = useRef<TransactionStatus>(status);
  statusRef.current = status;

  // Ref to track the close-modal delayed reset timer so it can be cleaned up
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    data: hash,
    isPending,
    writeContract,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash });

  // Derive status from wagmi transaction lifecycle flags.
  // Order matters: pending > confirming > confirmed > error.
  useEffect(() => {
    if (isPending) {
      setStatus("pending");
    } else if (isConfirming) {
      setStatus("confirming");
    } else if (isConfirmed) {
      setStatus("success");
    } else if (writeError || confirmError) {
      setStatus("error");
      const err = writeError || confirmError;
      if (err) {
        setErrorMessage(extractErrorMessage(err));
      }
    }
  }, [isPending, isConfirming, isConfirmed, writeError, confirmError]);

  // Clean up the delayed-reset timer on unmount to prevent state updates
  // on an unmounted component.
  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  const openModal = useCallback((txDetails: TransactionDetails) => {
    // Cancel any pending delayed reset from a previous close
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setDetails(txDetails);
    setIsModalOpen(true);
    setStatus("idle");
    setErrorMessage(undefined);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    // Only reset wagmi + local state after a brief delay when the
    // transaction reached a terminal state, giving the exit animation time.
    const currentStatus = statusRef.current;
    if (currentStatus === "success" || currentStatus === "error") {
      closeTimerRef.current = setTimeout(() => {
        closeTimerRef.current = null;
        setStatus("idle");
        setDetails(undefined);
        setErrorMessage(undefined);
        resetWrite();
      }, 300);
    }
  }, [resetWrite]);

  const resetTransaction = useCallback(() => {
    // Cancel any pending delayed reset
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsModalOpen(false);
    setStatus("idle");
    setDetails(undefined);
    setErrorMessage(undefined);
    resetWrite();
  }, [resetWrite]);

  return useMemo(
    () => ({
      isModalOpen,
      status,
      hash,
      error: errorMessage,
      details,
      openModal,
      closeModal,
      resetTransaction,
      writeContract,
      isPending,
      isConfirming,
      isConfirmed,
    }),
    [
      isModalOpen,
      status,
      hash,
      errorMessage,
      details,
      openModal,
      closeModal,
      resetTransaction,
      writeContract,
      isPending,
      isConfirming,
      isConfirmed,
    ]
  );
}

export default useTransactionFeedback;
