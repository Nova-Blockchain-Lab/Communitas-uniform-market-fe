import React, { useEffect, useState } from "react";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { TrendingUp, Info, Clock, AlertCircle } from "lucide-react";
import Image from "next/image";

import EnergyBiddingMarketAbi from "@/../abi/EnergyBiddingMarket.json";
import { defaultChain } from "@/config";
import { useAppContext } from "@/context/AppContext";
import ConnectAndSwitchNetworkButton from "@/components/common/ConnectAndSwitchNetworkButton";
import { Card, CardHeader, CardSection, Button } from "@/components/ui";
import { TransactionModal, TransactionStatus } from "@/components/ui/TransactionModal";

const SellBox: React.FC = () => {
  const { isConnected, chainId, address } = useAccount();
  const { energyMarketAddress, ethPrice } = useAppContext();

  const [energy, setEnergy] = useState<number>(0);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txStatus, setTxStatus] = useState<TransactionStatus>("idle");
  const [txError, setTxError] = useState<string | undefined>();

  // Validation state
  const [validationError, setValidationError] = useState<string | null>(null);

  // Contract interactions
  const { data: hash, isPending: isWritePending, writeContract, error: writeError, reset: resetWrite } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: confirmError } = useWaitForTransactionReceipt({ hash });

  // Update modal status based on transaction state
  useEffect(() => {
    if (isWritePending) {
      setTxStatus("pending");
    } else if (isConfirming) {
      setTxStatus("confirming");
    } else if (isConfirmed) {
      setTxStatus("success");
    } else if (writeError || confirmError) {
      setTxStatus("error");
      const err = writeError || confirmError;
      if (err) {
        let message = err.message;
        if (message.includes("User rejected") || message.includes("user rejected")) {
          message = "Transaction was rejected in your wallet";
        } else if (message.includes("insufficient funds")) {
          message = "Insufficient funds for this transaction";
        } else if (message.length > 150) {
          message = message.substring(0, 150) + "...";
        }
        setTxError(message);
      }
    }
  }, [isWritePending, isConfirming, isConfirmed, writeError, confirmError]);

  const getCurrentTimestamp = (): number => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now.getTime() / 1000;
  };

  const getCurrentHourDisplay = (): string => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    return now.toLocaleString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Live validation
  useEffect(() => {
    if (energy <= 0) {
      setValidationError(null);
      return;
    }

    if (!energyMarketAddress) {
      setValidationError("Please select a region first");
      return;
    }

    setValidationError(null);
  }, [energy, energyMarketAddress]);

  const handleSell = async () => {
    if (validationError || energy <= 0) return;

    // Open modal and reset state
    setIsModalOpen(true);
    setTxStatus("idle");
    setTxError(undefined);
    resetWrite();

    try {
      writeContract({
        abi: EnergyBiddingMarketAbi.abi,
        address: energyMarketAddress!,
        functionName: "placeAsk",
        args: [energy, address],
      });
    } catch (err) {
      setTxStatus("error");
      setTxError("Failed to initiate transaction");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    if (txStatus === "success") {
      setEnergy(0);
    }
    setTimeout(() => {
      setTxStatus("idle");
      setTxError(undefined);
    }, 300);
  };

  const isLoading = isWritePending || isConfirming;
  const needsConnection = !isConnected || (chainId && defaultChain.id !== chainId);
  const canSubmit = !validationError && energy > 0 && !isLoading;

  return (
    <>
      <div className="w-full max-w-md">
        <Card padding="lg">
          <CardHeader
            title="Sell Energy"
            subtitle="List your available energy for sale"
            icon={<TrendingUp size={20} />}
          />

          {/* Current Hour Display */}
          <div className="flex items-center gap-3 p-3 sm:p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-4 md:mb-6">
            <Clock size={20} className="text-emerald-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-emerald-400/70">Selling for current hour</p>
              <p className="text-sm font-medium text-emerald-400 truncate">{getCurrentHourDisplay()}</p>
            </div>
          </div>

          {/* Energy Input */}
          <CardSection title="Energy Amount" className="mb-4 md:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 px-3 sm:px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <Image src="/energy.png" alt="Energy" width={24} height={24} />
                <span className="text-xs sm:text-sm font-medium text-amber-400">kWh</span>
              </div>
              <input
                type="number"
                value={energy || ""}
                onChange={(e) => setEnergy(Math.max(0, parseInt(e.target.value) || 0))}
                min={0}
                placeholder="0"
                className="flex-1 px-3 sm:px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base sm:text-lg font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-500"
              />
            </div>
          </CardSection>

          {/* Quick Amount Buttons */}
          <div className="flex gap-2 mb-4 md:mb-6">
            {[10, 50, 100, 500].map((amount) => (
              <button
                key={amount}
                onClick={() => setEnergy(amount)}
                className={`
                  flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all
                  ${energy === amount
                    ? "bg-emerald-500 text-white"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                {amount}
              </button>
            ))}
          </div>

          {/* Validation Error */}
          {validationError && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
              <p className="text-xs sm:text-sm text-red-400">{validationError}</p>
            </div>
          )}

          {/* Summary */}
          <div className="p-3 sm:p-4 bg-white/5 rounded-xl space-y-3 mb-4 md:mb-6">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-400">Energy to sell</span>
              <span className="font-bold text-base sm:text-lg text-white">{energy} kWh</span>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-400">Market</span>
              <span className="text-xs sm:text-sm text-gray-300">
                {energyMarketAddress ? "Ready" : "Select a region"}
              </span>
            </div>
          </div>

          {/* Action Button */}
          {needsConnection ? (
            <ConnectAndSwitchNetworkButton />
          ) : (
            <Button
              fullWidth
              size="lg"
              variant="success"
              onClick={handleSell}
              loading={isLoading}
              disabled={!canSubmit}
            >
              {isLoading ? "Processing..." : "List Energy for Sale"}
            </Button>
          )}

          {/* Info Note */}
          <div className="mt-4 flex items-start gap-2 text-[10px] sm:text-xs text-gray-500">
            <Info size={14} className="mt-0.5 flex-shrink-0" />
            <p>
              Your energy will be listed for the current hour. If matched with a buyer, you will
              receive payment at the market clearing price.
            </p>
          </div>
        </Card>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        status={txStatus}
        hash={hash}
        error={txError}
        details={{
          type: "sell",
          amount: energy,
        }}
        onClose={closeModal}
        onRetry={handleSell}
      />
    </>
  );
};

export default SellBox;
