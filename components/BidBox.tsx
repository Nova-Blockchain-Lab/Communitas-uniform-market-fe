import * as React from "react";
import {
  useAccount,
  useBalance,
  useWaitForTransactionReceipt,
  useWriteContract
} from "wagmi";
import EnergyBiddingMarketAbi from "../abi/EnergyBiddingMarket.json";
import { DECIMALS, defaultChain } from "../constants/config";
import { useEffect } from "react";
import { Button, Image, Spinner, useToast } from "@chakra-ui/react";
import { Switch, FormLabel } from "@chakra-ui/react";
import {
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react";
import DateMultiplePicker from "./DateMultiplePicker";
import { useAppContext } from "./AppContext";
import DateRangePicker from "./DateRangePicker";
import { MdOutlineSwapHoriz } from "react-icons/md";
import ConnectAndSwitchNetworkButton from "./ConnectAndSwitchNetworkButton";

const EnergyBidItem: React.FC<{
  icon: string;
  unit: string;
  value?: BigInt;
  setValue: (value: string) => void;
}> = ({ icon, unit, value, setValue }) => (
  <div className="flex gap-4 uppercase">
    <div className="flex flex-col justify-center px-5 py-2.5 text-sm leading-4 text-center text-gray-900 bg-blue-50 rounded-lg max-md:pr-5">
      <div className="flex gap-4 items-center">
        <Image
          src={icon}
          alt="Energy"
          className="shrink-0 self-stretch w-6 aspect-square"
        />
        <div className="self-stretch my-auto">{unit}</div>
        <div className="shrink-0 self-stretch my-auto h-[13px] w-[3px]" />
      </div>
    </div>
    <NumberInput
      className="my-auto text-lg leading-4 text-gray-500"
      value={value ? +value.toString() : 0}
      min={0}
      onChange={(val) => {
        setValue(val);
      }}
    >
      <NumberInputField />
      <NumberInputStepper>
        <NumberIncrementStepper />
        <NumberDecrementStepper />
      </NumberInputStepper>
    </NumberInput>
  </div>
);

const ETHBidItem: React.FC<{
  icon: string;
  unit: string;
  value?: number;
  setValue: (value: string) => void;
  ethPrice?: number;
}> = ({ icon, unit, value, setValue, ethPrice }) => (
  <div className="flex gap-4 uppercase">
    <div className="flex flex-col justify-center px-5 py-2.5 text-sm leading-4 text-center text-gray-900 bg-blue-50 rounded-lg max-md:pr-5">
      <div className="flex gap-4 items-center">
        <Image
          src={icon}
          alt="Currency"
          className="shrink-0 self-stretch w-6 aspect-square"
        />
        <div className="self-stretch my-auto">{unit}</div>
        <div className="shrink-0 self-stretch my-auto h-[13px] w-[3px]" />
      </div>
    </div>
    <NumberInput
      className="my-auto text-lg leading-4 text-gray-500"
      value={value ? value.toFixed(6) : 0}
      onChange={(val) => {
        setValue(val);
      }}
      min={0.000001}
      precision={10}
      step={0.000001}
    >
      <NumberInputField />
      {ethPrice && value && (
        <div className="absolute right-12 top-3 text-xs text-gray-500 shadow-sm">
          {(value * ethPrice).toFixed(2)}€
        </div>
      )}
      <NumberInputStepper>
        <NumberIncrementStepper />
        <NumberDecrementStepper />
      </NumberInputStepper>
    </NumberInput>
  </div>
);

const EURBidItem: React.FC<{
  icon: string;
  unit: string;
  value?: number;
  setValue: (value: number) => void;
  ethPrice: number;
}> = ({ icon, unit, value, setValue, ethPrice }) => (
  <div className="flex gap-4 uppercase">
    <div className="flex flex-col justify-center px-5 py-2.5 text-sm leading-4 text-center text-gray-900 bg-blue-50 rounded-lg max-md:pr-5">
      <div className="flex gap-4 items-center">
        <Image
          src={icon}
          alt="Currency"
          className="shrink-0 self-stretch w-6 aspect-square"
        />
        <div className="self-stretch my-auto">{unit}</div>
        <div className="shrink-0 self-stretch my-auto h-[13px] w-[3px]" />
      </div>
    </div>
    <NumberInput
      className="my-auto text-lg leading-4 text-gray-500"
      value={value ? (value * ethPrice).toFixed(2) : 0}
      onChange={(val) => {
        setValue(parseFloat(val) / ethPrice);
      }}
      min={0.01}
      precision={2}
      step={0.01}
    >
      <NumberInputField />
      {ethPrice && value && (
        <div className="absolute right-12 top-3 text-xs text-gray-500 shadow-sm">
          {value.toFixed(6)} ETH
        </div>
      )}
      <NumberInputStepper>
        <NumberIncrementStepper />
        <NumberDecrementStepper />
      </NumberInputStepper>
    </NumberInput>
  </div>
);

const BidBox: React.FC = () => {
  const currencyName = "ETH";
  const currencyValueName = "EUR";
  const energyUnit = "kWh";

  const { isConnected, address, chainId } = useAccount();

  const [energy, setEnergy] = React.useState<number>(0);
  const [amount, setAmount] = React.useState<BigInt>(BigInt(1000000000000));
  const { ethPrice, energyMarketAddress } = useAppContext();

  const getNextHour = (hourOffset = 0) => {
    const now = new Date();
    now.setHours(now.getHours() + hourOffset);
    now.setMinutes(0, 0, 0);
    return now;
  };

  const [isMultipleDate, setIsMultipleDate] = React.useState<boolean>(false);

  const [isPriceInEUR, setIsPriceInEUR] = React.useState<boolean>(true);

  const [selectedDates, setSelectedDates] = React.useState<Date[]>([
    getNextHour(1),
  ]);

  const [startDate, setStartDate] = React.useState<Date | undefined>(
    getNextHour(1)
  );
  const [endDate, setEndDate] = React.useState<Date | undefined>(
    getNextHour(2)
  );

  const {
    data: hash,
    isPending: isWritePending,
    writeContract,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const toast = useToast();

  const {
    data: balance,
    error,
    isLoading: isPending,
    refetch: refetchBalance,
  } = useBalance({
    address: address,
  });

  const handleBid = async (energy: number, amount: BigInt) => {
    if (!validateBidTime(startDate, endDate, selectedDates)) {
      return;
    }
    if (isMultipleDate) {
        if (selectedDates.length == 0) {
          toast({
            title: "Error",
            description: "Please select at least one date",
            status: "error",
            duration: 9000,
            isClosable: true,
          });
          return;
        }
        if (!energyMarketAddress) {
          toast({
            title: "Error",
            description: "Region not defined",
            status: "error",
            duration: 9000,
            isClosable: true,
          });
          return;
        }

        const timestamps = calculateDifferentHours(
            selectedDates,
            startDate!,
            endDate!
        );

        writeContract({
          abi: EnergyBiddingMarketAbi.abi,
          address: energyMarketAddress,
          functionName: "placeMultipleBids",
          value:
              BigInt(energy) *
              BigInt(amount.toString()) *
              BigInt(timestamps.length),
          args: [timestamps, energy],
        });
      } else {
        if (!startDate || !endDate) {
          toast({
            title: "Error",
            description: "Please select a valid start and end date",
            status: "error",
            duration: 9000,
            isClosable: true,
          });
          return;
        }
        if (!energyMarketAddress) {
          toast({
            title: "Error",
            description: "Region not defined",
            status: "error",
            duration: 9000,
            isClosable: true,
          });
          return;
        }
        const startTimestamp = startDate.getTime() / 1000;
        const endTimestamp = endDate.getTime() / 1000;
        if (startTimestamp == endTimestamp - 3600) {
          writeContract({
            abi: EnergyBiddingMarketAbi.abi,
            address: energyMarketAddress,
            functionName: "placeBid",
            value: BigInt(energy) * BigInt(amount.toString()),
            args: [startTimestamp, energy],
          });
        } else {
          writeContract({
            abi: EnergyBiddingMarketAbi.abi,
            address: energyMarketAddress,
            functionName: "placeMultipleBids",
            value:
                BigInt(energy) *
                BigInt(amount.toString()) *
                BigInt(calculateExactHours()),
            args: [startTimestamp, endTimestamp, energy],
          });
        }
      }
  }

  const validateBidTime = (startDate?: Date, endDate?: Date, selectedDates?: Date[]): boolean => {
    const now = new Date();

    if (startDate && startDate <= now) {
      toast({
        title: "Invalid Start Time",
        description: "The start time must be in the future.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return false;
    }

    if (startDate && endDate && endDate <= startDate) {
      toast({
        title: "Invalid End Time",
        description: "The end time must be after the start time.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return false;
    }

    if (selectedDates && selectedDates.length > 0) {
      const invalidDates = selectedDates.filter(date => date <= now);
      if (invalidDates.length > 0) {
        toast({
          title: "Invalid Selected Dates",
          description: "All selected dates must be in the future.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return false;
      }
    }

    if (calculateExactHours() > 400) {
      toast({
        title: "Too Many Bids",
        description: "The number of bids cannot exceed 400. Please adjust your selection and submit multiple times.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return false;
    }

    return true;
  };

  const calculateDifferentHours = (
    selectedDays: Date[],
    startTime: Date,
    endTime: Date
  ): number[] => {
    const result: number[] = [];

    selectedDays.forEach((day) => {
      // Create new Date objects for the start and end times on the current day
      const start = new Date(day);
      start.setHours(startTime.getHours(), 0, 0, 0);

      const end = new Date(day);
      end.setHours(endTime.getHours(), 0, 0, 0);

      // Calculate whole hours in between and convert to seconds from the epoch
      for (let hour = start.getTime(); hour < end.getTime(); hour += 3600000) {
        // 3600000 ms = 1 hour
        result.push(Math.floor(hour / 1000)); // Convert milliseconds to seconds
      }
    });

    // Remove duplicates and sort the result
    return Array.from(new Set(result)).sort((a, b) => a - b);
  };

  useEffect(() => {
    if (isConnected && isConfirmed) {
      refetchBalance();
    }
  }, [isConfirmed, isConnected]);

  useEffect(() => {
    if (!hash || isConfirming) return;
    if (isConfirmed) sendSuccessfulNotification();
    else sendUnsuccessfulNotification();
  }, [isConfirming]);

  const sendSuccessfulNotification = () => {
    toast({
      title: "Success!",
      description: "Your bid has been placed successfully",
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

  const setETHAmount = (val: number) => {
    if (!balance) return;
    if (+val * 10 ** DECIMALS > +balance.value.toString()) return;
    const newAmount = Math.round(val * 10 ** DECIMALS);
    setAmount(BigInt(newAmount));
  };

  const getETHAmount = () => {
    if (!balance || !amount) return;
    return +amount.toString() / 10 ** DECIMALS;
  };

  const calculateExactHours = (): number => {
    if (!startDate || !endDate) return 0;
    if (isMultipleDate) {
      return calculateDifferentHours(selectedDates, startDate, endDate).length;
    } else {
      const diffMilliseconds = endDate.getTime() - startDate.getTime();
      const diffHours = diffMilliseconds / (1000 * 60 * 60);

      return Math.abs(diffHours);
    }
  };

  const clearSelection = () => {
    setSelectedDates([]);
    setStartDate(getNextHour(1));
    setEndDate(getNextHour(2));
  };

  return (
    <div className="flex justify-center items-center space-x-2">
      <div className="relative flex flex-col items-start space-y-2">
        <div className="p-6 bg-white shadow-md rounded-lg">
          <div className="flex justify-center w-full">
            <div className="flex items-center bg-gray-100 p-2 rounded-md">
              <FormLabel
                  htmlFor="date-mode"
                  mb="0"
                  className="mr-2 text-lg font-semibold text-gray-700"
              >
                Range
              </FormLabel>
              <Switch
                  id="date-mode"
                  isChecked={isMultipleDate}
                  onChange={() => {
                    clearSelection()
                    setIsMultipleDate(!isMultipleDate)
                  }}
                  colorScheme="teal"
                  className="mx-2 scale-125"
              />
              <FormLabel
                  htmlFor="date-mode"
                  mb="0"
                  className="ml-2 text-lg font-semibold text-gray-700"
              >
                Multiple
              </FormLabel>
            </div>
          </div>

          {isMultipleDate ? (
              <DateMultiplePicker
                  selectedDates={selectedDates}
                  setSelectedDates={setSelectedDates}
                  startTime={startDate}
                  setStartTime={setStartDate}
                  endTime={endDate}
                  setEndTime={setEndDate}
              />
          ) : (
              <DateRangePicker
                  startDate={startDate}
                  setStartDate={setStartDate}
                  endDate={endDate}
                  setEndDate={setEndDate}
              />
          )}

          <div className="flex justify-center mt-4">
            <Button
                onClick={clearSelection}
                className="py-2 px-6 text-base text-white bg-gray-500 rounded-lg hover:bg-gray-600 transition"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col px-7 py-9 font-medium bg-white rounded-xl shadow-lg max-w-[526px] max-md:px-5">
        <div
            className="flex gap-5 justify-between px-0.5 py-1 text-2xl font-bold leading-6 text-gray-900 whitespace-nowrap max-md:flex-wrap max-md:max-w-full">
        Bid
        </div>
        <div className="mt-9 text-sm leading-4 text-gray-500 max-md:max-w-full">
          <span className="text-gray-500">Energy</span>
        </div>
        <div className="flex gap-5 justify-between py-1 pr-3 pl-1 mt-2 w-full whitespace-nowrap bg-white rounded-xl border border-indigo-50 border-solid max-md:flex-wrap max-md:max-w-full">
          <EnergyBidItem
            icon={"/energy.png"}
            unit={energyUnit}
            value={BigInt(energy.toString())}
            setValue={(val: string) => {
              isNaN(parseFloat(val))
                ? setEnergy(0)
                : setEnergy(parseFloat(val));
            }}
          />
        </div>
        <div className="flex gap-5 justify-between px-0.5 py-px mt-8 leading-[100%] max-md:flex-wrap max-md:max-w-full">
          <div className="flex flex-col justify-end text-sm text-gray-500">
            <span className="text-gray-500">Price</span>
          </div>
          <div className="flex flex-col mr-40 justify-end">
            <div className="flex flex-row items-center">
              <div
                className="flex bg-gray-100 px-1 py-1 rounded-lg cursor-pointer hover:bg-gray-200 transition"
                onClick={() => setIsPriceInEUR(!isPriceInEUR)}
              >
                <MdOutlineSwapHoriz className="text-sm" />
              </div>
              <div className="flex flex-col justify-center px-2 py-1 text-xs leading-4 text-center text-gray-900 bg-blue-50 rounded-lg ml-2">
                <div className="flex gap-1 items-center">
                  <Image
                    src={isPriceInEUR ? "/eth.png" : "/eur.png"}
                    alt="Currency"
                    className="w-3 h-auto"
                  />
                  <div className="my-auto">
                    {isPriceInEUR ? currencyName : currencyValueName}
                  </div>
                  <div className="shrink-0 my-auto h-[8px] w-[2px]" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col self-start text-xs text-right">
            <div className="self-end text-gray-500">Balance:</div>
            {isPending && isConnected ? (
              <div className="mt-2 text-gray-900">Loading...</div>
            ) : null}
            {error && isConnected ? (
              <div className="mt-2 text-gray-900">Error: {error.message}</div>
            ) : null}
            {!isConnected ? (
              <div className="mt-2 text-gray-900">
                Connect Wallet to display balance
              </div>
            ) : null}
            {!(isPending || error) && isConnected && balance ? (
              <div className="mt-2 text-gray-900">
                {(+balance.value.toString() / 10 ** DECIMALS).toFixed(10)}{" "}
                {currencyName}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex gap-4 py-1 mt-2 uppercase whitespace-nowrap bg-white rounded-xl border border-indigo-50 border-solid max-md:flex-wrap max-md:max-w-full">
          {isPriceInEUR && ethPrice ? (
            <EURBidItem
              icon={"/eur.png"}
              unit={currencyValueName}
              value={getETHAmount()}
              setValue={setETHAmount}
              ethPrice={ethPrice}
            />
          ) : (
            <ETHBidItem
              icon={"/eth.png"}
              unit={currencyName}
              value={getETHAmount()}
              setValue={(val: string) => {
                setETHAmount(parseFloat(val));
              }}
              ethPrice={ethPrice}
            />
          )}
          {balance ? (
            <div
              onClick={() => setAmount(balance.value)}
              className="inline-block px-2 py-2 my-auto text-xs font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              Max
            </div>
          ) : null}
        </div>
        <div className="shrink-0 mt-4 rounded-lg bg-slate-50 h-[50px] max-md:max-w-full">
          <div className="flex justify-between px-4 py-2">
            <span>Total amount to pay:</span>
            <span className="flex items-center">
              {getETHAmount() ? (
                <>
                  {(energy * getETHAmount()! * calculateExactHours()).toFixed(
                    6
                  )}{" "}
                  {currencyName}
                  {ethPrice && (
                    <span className="ml-2 text-xs text-gray-500 shadow-sm">
                      (
                      {(
                        energy *
                        getETHAmount()! *
                        calculateExactHours() *
                        ethPrice
                      ).toFixed(2)}
                      € )
                    </span>
                  )}
                </>
              ) : (
                0
              )}
            </span>
          </div>
        </div>
        <div className="shrink-0 rounded-lg bg-slate-50 h-[20px] max-md:max-w-full">
          <div className="flex justify-between px-4 py-2">
            Bidding for {calculateExactHours()}{" "}
            {calculateExactHours() == 1 ? "hour" : "hours"}
          </div>
        </div>
        {(!isConnected || (chainId && defaultChain.id !== chainId)) && (
            <div className="py-2 mt-10 bg-blue-600 rounded-lg border border-blue-600 border-solid">
              <div className="flex justify-center flex-col items-center">
                <ConnectAndSwitchNetworkButton />
              </div>
            </div>
        )}

        {(isWritePending ||
          isConfirming) && (
            <Button
              disabled={true}
              className="py-2 mt-10 text-base text-center text-white bg-blue-600 rounded-lg border border-blue-600 border-solid max-md:px-5 max-md:max-w-full"
            >
              <Spinner />
            </Button>
          )}
        {isConnected &&
          !isWritePending &&
          !isConfirming &&
          defaultChain.id == chainId && (
            <Button
              onClick={() => handleBid(energy, amount)}
              className="py-2 mt-10 text-base text-center text-white bg-blue-600 rounded-lg border border-blue-600 border-solid max-md:px-5 max-md:max-w-full"
            >
              Submit
            </Button>
          )}
      </div>
    </div>
  );
};

export default BidBox;
