import React, { useEffect, useState } from "react";
import {
  useAccount,
  useBalance,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import EnergyBiddingMarketAbi from "../abi/EnergyBiddingMarket.json";
import { DECIMALS, energyMarketAddress } from "../constants/config";
import { Button, Spinner, useToast, Box, Text } from "@chakra-ui/react";
import { useAppContext } from "./AppContext";

const ClaimBox: React.FC = () => {
  const { isConnected, address } = useAccount();
  const toast = useToast();

  const { ethPrice } = useAppContext();

  const {
    data: hash,
    isPending: isWritePending,
    writeContract,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useReadContract({
    abi: EnergyBiddingMarketAbi.abi,
    address: energyMarketAddress,
    functionName: "balanceOf",
    args: [address],
  });

  const handleClaim = async () => {
    writeContract({
      abi: EnergyBiddingMarketAbi.abi,
      address: energyMarketAddress,
      functionName: "claimBalance",
    });
  };

  const sendSuccessfulNotification = () => {
    toast({
      title: "Success!",
      description: "Your balance has been claimed successfully",
      status: "success",
      duration: 9000,
      isClosable: true,
    });
  };

  const sendUnsuccessfulNotification = () => {
    toast({
      title: "Failed",
      description: "Something has gone wrong, please try again later",
      status: "error",
      duration: 9000,
      isClosable: true,
    });
  };

  useEffect(() => {
    if (!hash || isConfirming) return;
    if (isConfirmed) sendSuccessfulNotification();
    else sendUnsuccessfulNotification();
  }, [isConfirming]);

  console.log(((+balanceData.toString() / 10 ** DECIMALS) * ethPrice).toFixed(2));

  return (
    <Box className="flex justify-center items-center">
      <Box className="flex flex-col px-7 py-9 font-medium bg-white rounded-xl shadow-lg max-w-[526px] max-md:px-5">
        <Text className="flex gap-5 justify-between px-0.5 py-1 text-2xl font-bold leading-6 text-gray-900 whitespace-nowrap max-md:flex-wrap max-md:max-w-full">
          Available Balance
        </Text>
        {isBalanceLoading ? (
          <Box className="flex justify-center items-center py-5">
            <Spinner color="blue.500" />
          </Box>
        ) : (
          <Text className="mt-9 text-sm leading-4 text-gray-500 max-md:max-w-full">
            Your Balance:{" "}
            {(+balanceData.toString() / 10 ** DECIMALS).toFixed(6)} ETH{" "}
            {ethPrice ? (
              <span className="ml-2 text-xs text-gray-500 shadow-sm">
                (${((+balanceData.toString() / 10 ** DECIMALS) * ethPrice).toFixed(2)})
              </span>
            ) : null}
          </Text>
        )}

        {!isConnected ||
        isBalanceLoading ||
        isWritePending ||
        isConfirming ||
        +balanceData.toString() == 0 ? (
          <Button
            disabled
            className="justify-center items-center px-8 py-4 mt-10 text-base leading-4 text-center text-white bg-blue-600 rounded-lg border border-blue-600 border-solid max-md:px-5 max-md:max-w-full"
          >
            <Spinner />
          </Button>
        ) : (
          <Button
            onClick={handleClaim}
            className="justify-center items-center px-8 py-4 mt-10 text-base leading-4 text-center text-white bg-blue-600 rounded-lg border border-blue-600 border-solid max-md:px-5 max-md:max-w-full"
          >
            Claim
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default ClaimBox;
