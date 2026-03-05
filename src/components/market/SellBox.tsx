import React, { useEffect, useState } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { TrendingUp, Info, Clock, ShieldX, AlertTriangle } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { motion } from "motion/react";
import Image from "next/image";

import EnergyBiddingMarketAbi from "@/../abi/EnergyBiddingMarket.json";
import { defaultChain, WATTS_PER_KWH } from "@/config";
import { useAppContext } from "@/context/AppContext";
import { useMarketToast } from "@/hooks/useMarketToast";
import ConnectAndSwitchNetworkButton from "@/components/common/ConnectAndSwitchNetworkButton";
import { Card, CardHeader, CardSection, Button, SkeletonRows, SkeletonBlock } from "@/components/ui";
import { TransactionModal, TransactionStatus } from "@/components/ui/TransactionModal";

const SellBox: React.FC = () => {
  const { isConnected, chainId, address } = useAccount();
  const { energyMarketAddress, ethPrice } = useAppContext();
  const toast = useMarketToast();

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

  // Fix #4: Check seller whitelist status
  const { data: isWhitelisted, isLoading: isWhitelistLoading } = useReadContract({
    address: energyMarketAddress,
    abi: EnergyBiddingMarketAbi,
    functionName: "isSellerWhitelisted",
    args: [address],
    query: { enabled: !!address && !!energyMarketAddress },
  }) as { data: boolean | undefined; isLoading: boolean };

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

  const handleSell = () => {
    if (energy <= 0) {
      toast.error("Invalid Amount", "Please enter a positive energy amount.");
      return;
    }

    if (!energyMarketAddress) {
      toast.error("Region Not Selected", "Please select a region first.");
      return;
    }

    // Fix #2: Convert kWh to Watts for contract
    writeContract({
      abi: EnergyBiddingMarketAbi,
      address: energyMarketAddress,
      functionName: "placeAsk",
      args: [energy * WATTS_PER_KWH, address],
    });
  };

  useEffect(() => {
    if (!hash || isConfirming) return;
    if (isConfirmed) {
      toast.success("Energy Listed Successfully!", `You've listed ${energy} kWh for sale.`);
      setEnergy(0);
    } else {
      toast.error("Transaction Failed", "Something went wrong. Please try again.");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConfirming, isConfirmed, hash, energy]);

  const isLoading = isWritePending || isConfirming;
  const needsConnection = !isConnected || (chainId && defaultChain.id !== chainId);
  const canSubmit = !validationError && energy > 0 && !isLoading;

  return (
    <div className="w-full max-w-md">
      <Card padding="lg" loading={isWhitelistLoading}>
        <CardHeader
          title="Sell Energy"
          subtitle="List your available energy for sale"
          icon={<TrendingUp size={20} />}
        />

        {/* Whitelist Warning Banner */}
        {isConnected && !needsConnection && !isWhitelistLoading && isWhitelisted === false && (
          <div className="relative overflow-hidden p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-xl mb-6">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-amber-400" />
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 mt-0.5">
                <AlertTriangle size={20} className="text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-300">Seller Not Whitelisted</p>
                <p className="text-xs text-amber-400/80 mt-1.5 leading-relaxed">
                  Your wallet address is not authorized to sell energy on this market. Please contact the market operator to request seller access.
                </p>
                <p className="text-xs text-amber-500/60 mt-2 font-mono truncate">
                  {address}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Current Hour Display */}
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-6">
          <Clock size={20} className="text-emerald-400" />
          <div>
            <p className="text-xs text-emerald-400/70">Selling for current hour</p>
            <p className="text-sm font-medium text-emerald-400">{getCurrentHourDisplay()}</p>
          </div>
        </div>

        {/* Energy Input */}
        <CardSection title="Energy Amount" className="mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <Image src="/energy.png" alt="Energy" width={24} height={24} />
              <span className="text-sm font-medium text-amber-400">kWh</span>
            </div>
            <input
              type="number"
              value={energy}
              onChange={(e) => setEnergy(Math.max(0, parseInt(e.target.value) || 0))}
              min={0}
              placeholder="0"
              disabled={isWhitelisted === false}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base sm:text-lg font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </CardSection>

        {/* Quick Amount Buttons */}
        <div className="flex gap-2 mb-6">
          {[
            { value: 0.1, label: "100W" },
            { value: 0.5, label: "500W" },
            { value: 1, label: "1 kWh" },
            { value: 5, label: "5 kWh" },
            { value: 10, label: "10 kWh" },
          ].map(({ value, label }) => (
            <motion.button
              key={value}
              whileTap={{ scale: 0.92 }}
              whileHover={{ scale: 1.04 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={() => setEnergy(value)}
              disabled={isWhitelisted === false}
              className={`
                flex-1 py-3 text-sm min-h-[44px] font-medium rounded-lg transition-colors
                ${energy === value
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {label}
            </motion.button>
          ))}
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
            disabled={isLoading || energy <= 0 || isWhitelisted === false}
          >
            {isWhitelistLoading ? "Checking authorization..." : isLoading ? "Processing..." : "List Energy for Sale"}
          </Button>
        )}

        {/* Info Note */}
        <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
          <Info size={14} className="mt-0.5 flex-shrink-0" />
          <p>
            Your energy will be listed for the current hour. If matched with a buyer, you will
            receive payment at the market clearing price.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default SellBox;
