import { useState, useEffect, useCallback } from "react";
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

export function useTransactionFeedback(): UseTransactionFeedbackReturn {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [status, setStatus] = useState<TransactionStatus>("idle");
  const [details, setDetails] = useState<TransactionDetails | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

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

  // Update status based on transaction state
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
        // Extract readable error message
        let message = err.message;
        if (message.includes("User rejected")) {
          message = "Transaction was rejected by user";
        } else if (message.includes("insufficient funds")) {
          message = "Insufficient funds for this transaction";
        } else if (message.includes("nonce")) {
          message = "Transaction nonce error. Please try again.";
        } else if (message.length > 150) {
          message = message.substring(0, 150) + "...";
        }
        setErrorMessage(message);
      }
    }
  }, [isPending, isConfirming, isConfirmed, writeError, confirmError]);

  const openModal = useCallback((txDetails: TransactionDetails) => {
    setDetails(txDetails);
    setIsModalOpen(true);
    setStatus("idle");
    setErrorMessage(undefined);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    // Only reset if success or error
    if (status === "success" || status === "error") {
      setTimeout(() => {
        setStatus("idle");
        setDetails(undefined);
        setErrorMessage(undefined);
        resetWrite();
      }, 300);
    }
  }, [status, resetWrite]);

  const resetTransaction = useCallback(() => {
    setIsModalOpen(false);
    setStatus("idle");
    setDetails(undefined);
    setErrorMessage(undefined);
    resetWrite();
  }, [resetWrite]);

  return {
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
  };
}

export default useTransactionFeedback;
