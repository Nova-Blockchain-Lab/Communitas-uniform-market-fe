import React, { useEffect } from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { Wallet, Coins, ArrowDown, Info, RefreshCw } from "lucide-react";
import { Spinner, useToast } from "@chakra-ui/react";
import { motion } from "framer-motion";
import Image from "next/image";

import EnergyBiddingMarketAbi from "@/../abi/EnergyBiddingMarket.json";
import { DECIMALS, defaultChain } from "@/config";
import { useAppContext } from "@/context/AppContext";
import ConnectAndSwitchNetworkButton from "@/components/common/ConnectAndSwitchNetworkButton";
import { Card, CardHeader, Button } from "@/components/ui";

const ClaimBox: React.FC = () => {
  const { isConnected, address, chainId } = useAccount();
  const { ethPrice, energyMarketAddress } = useAppContext();
  const toast = useToast();

  // Contract interactions
  const { data: hash, isPending: isWritePending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useReadContract(
    chainId === defaultChain.id && energyMarketAddress
      ? {
          abi: EnergyBiddingMarketAbi.abi,
          address: energyMarketAddress,
          functionName: "balanceOf",
          args: [address],
        }
      : undefined
  );

  const balance = balanceData ? Number(balanceData) / 10 ** DECIMALS : 0;
  const balanceInEUR = ethPrice ? balance * ethPrice : 0;
  const hasBalance = balance > 0;

  const handleClaim = async () => {
    if (!hasBalance) {
      toast({
        title: "No Claimable Balance",
        description: "You don't have any earnings to claim.",
        status: "info",
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
      functionName: "claimBalance",
    });
  };

  useEffect(() => {
    if (!hash || isConfirming) return;
    if (isConfirmed) {
      refetchBalance();
      toast({
        title: "Earnings Claimed!",
        description: "Your earnings have been sent to your wallet.",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } else {
      toast({
        title: "Claim Failed",
        description: "Something went wrong. Please try again.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  }, [isConfirming, isConfirmed, hash, refetchBalance, toast]);

  const isLoading = isWritePending || isConfirming;
  const needsConnection = !isConnected || (chainId && defaultChain.id !== chainId);

  return (
    <div className="w-full max-w-md">
      <Card padding="lg">
        <CardHeader
          title="Claim Earnings"
          subtitle="Withdraw your available balance"
          icon={<Wallet size={20} />}
          action={
            !needsConnection && (
              <button
                onClick={() => refetchBalance()}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Refresh balance"
              >
                <RefreshCw size={16} className={isBalanceLoading ? "animate-spin" : ""} />
              </button>
            )
          }
        />

        {needsConnection ? (
          <div className="py-8">
            <ConnectAndSwitchNetworkButton />
          </div>
        ) : (
          <>
            {/* Balance Display */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 mb-6"
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />

              <div className="relative">
                <p className="text-sm text-gray-400 mb-1">Available Balance</p>

                {isBalanceLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Spinner size="lg" color="blue.400" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="text-4xl font-bold text-white">
                        {balance.toFixed(6)}
                      </span>
                      <span className="text-xl text-gray-400">ETH</span>
                    </div>

                    {ethPrice && (
                      <p className="text-lg text-gray-400">
                        ~{balanceInEUR.toFixed(2)} EUR
                      </p>
                    )}
                  </>
                )}
              </div>
            </motion.div>

            {/* Visual indicator */}
            {hasBalance && (
              <div className="flex justify-center mb-6">
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="p-3 rounded-full bg-emerald-500/20 text-emerald-400"
                >
                  <ArrowDown size={24} />
                </motion.div>
              </div>
            )}

            {/* Destination */}
            <div className="p-4 bg-white/5 rounded-xl mb-6">
              <p className="text-xs text-gray-500 mb-2">Claim to</p>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Image src="/eth.png" alt="ETH" width={24} height={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {address}
                  </p>
                  <p className="text-xs text-gray-500">Your connected wallet</p>
                </div>
              </div>
            </div>

            {/* Claim Button */}
            <Button
              fullWidth
              size="lg"
              variant={hasBalance ? "success" : "secondary"}
              onClick={handleClaim}
              loading={isLoading}
              disabled={isLoading || !hasBalance}
              icon={<Coins size={18} />}
            >
              {isLoading
                ? "Processing..."
                : hasBalance
                ? "Claim Earnings"
                : "No Balance to Claim"}
            </Button>

            {/* Info Note */}
            <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
              <Info size={14} className="mt-0.5 flex-shrink-0" />
              <p>
                Your earnings come from matched energy trades. The amount shown is the
                total available for withdrawal from this market region.
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default ClaimBox;
