import React, { useEffect, useState } from "react";
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { TrendingUp, Info, Clock } from "lucide-react";
import { Spinner, useToast } from "@chakra-ui/react";
import Image from "next/image";

import EnergyBiddingMarketAbi from "@/../abi/EnergyBiddingMarket.json";
import { defaultChain } from "@/config";
import { useAppContext } from "@/context/AppContext";
import ConnectAndSwitchNetworkButton from "@/components/common/ConnectAndSwitchNetworkButton";
import { Card, CardHeader, CardSection, Button } from "@/components/ui";

const SellBox: React.FC = () => {
  const { isConnected, chainId, address } = useAccount();
  const { energyMarketAddress, ethPrice } = useAppContext();
  const toast = useToast();

  const [energy, setEnergy] = useState<number>(0);

  // Contract interactions
  const { data: hash, isPending: isWritePending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

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

  const handleSell = async () => {
    if (energy <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a positive energy amount.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!energyMarketAddress) {
      toast({
        title: "Region Not Selected",
        description: "Please select a region first.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    writeContract({
      abi: EnergyBiddingMarketAbi.abi,
      address: energyMarketAddress,
      functionName: "placeAsk",
      args: [energy, address],
    });
  };

  useEffect(() => {
    if (!hash || isConfirming) return;
    if (isConfirmed) {
      toast({
        title: "Energy Listed Successfully!",
        description: `You've listed ${energy} kWh for sale.`,
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      setEnergy(0);
    } else {
      toast({
        title: "Transaction Failed",
        description: "Something went wrong. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [isConfirming, isConfirmed, hash, energy, toast]);

  const isLoading = isWritePending || isConfirming;
  const needsConnection = !isConnected || (chainId && defaultChain.id !== chainId);

  return (
    <div className="w-full max-w-md">
      <Card padding="lg">
        <CardHeader
          title="Sell Energy"
          subtitle="List your available energy for sale"
          icon={<TrendingUp size={20} />}
        />

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
              className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-lg font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 placeholder-gray-500"
            />
          </div>
        </CardSection>

        {/* Quick Amount Buttons */}
        <div className="flex gap-2 mb-6">
          {[10, 50, 100, 500].map((amount) => (
            <button
              key={amount}
              onClick={() => setEnergy(amount)}
              className={`
                flex-1 py-2 text-sm font-medium rounded-lg transition-all
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

        {/* Summary */}
        <div className="p-4 bg-white/5 rounded-xl space-y-3 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Energy to sell</span>
            <span className="font-bold text-lg text-white">{energy} kWh</span>
          </div>
          <div className="h-px bg-white/10" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Market</span>
            <span className="text-sm text-gray-300">
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
            disabled={isLoading || energy <= 0}
          >
            {isLoading ? "Processing..." : "List Energy for Sale"}
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
