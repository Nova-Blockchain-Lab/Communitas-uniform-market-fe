import * as React from "react";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import EURCAbi from "../abi/EURC.json";
import EnergyBiddingMarketAbi from "../abi/EnergyBiddingMarket.json";
import { energyMarketAddress, EURCAddress } from "../constants/config";
import { useEffect } from "react";
import { Button, Image, Spinner, useToast } from "@chakra-ui/react";
import {
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react";
import DateTimePicker from "./DateTimePicker";

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

const EURCBidItem: React.FC<{
  icon: string;
  unit: string;
  value?: number;
  setValue: (value: string) => void;
}> = ({ icon, unit, value, setValue }) => (
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
      value={value ? value : 0}
      onChange={(val) => {
        setValue(val);
      }}
      min={0}
      precision={2}
      step={0.01}
    >
      <NumberInputField />
      <NumberInputStepper>
        <NumberIncrementStepper />
        <NumberDecrementStepper />
      </NumberInputStepper>
    </NumberInput>
  </div>
);

const BidBox: React.FC = () => {
  const currencyName = "EURC";
  const energyUnit = "kWh";

  const { isConnected, address } = useAccount();
  const [energy, setEnergy] = React.useState<number>(0);
  const [amount, setAmount] = React.useState<BigInt>(BigInt(0));

  const getNextHour = (hourOffset = 0) => {
    const now = new Date();
    now.setHours(now.getHours() + hourOffset);
    now.setMinutes(0, 0, 0);
    return now;
  };

  const [startDate, setStartDate] = React.useState(getNextHour(1));
  const [endDate, setEndDate] = React.useState(getNextHour(1));

  const {
    data: hash,
    isPending: isWritePending,
    writeContract,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({ hash });

  const toast = useToast();

  const { data: decimals } = useReadContract({
    abi: EURCAbi.abi,
    address: EURCAddress,
    functionName: "decimals",
  });

  const {
    data: balance,
    error,
    isPending,
    refetch: refetchBalance,
  } = useReadContract({
    abi: EURCAbi.abi,
    address: EURCAddress,
    functionName: "balanceOf",
    args: [address],
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    abi: EURCAbi.abi,
    address: EURCAddress,
    functionName: "allowance",
    args: [address, energyMarketAddress],
  });

  const handleBid = async (energy: number, amount: BigInt) => {
    const startTimestamp = startDate.getTime() / 1000;
    const endTimestamp = endDate.getTime() / 1000;
    if (startTimestamp == endTimestamp) {
    writeContract({
      abi: EnergyBiddingMarketAbi.abi,
      address: energyMarketAddress,
      functionName: "placeBid",
      args: [startTimestamp, energy, amount],
    });
  } else {
    writeContract({
      abi: EnergyBiddingMarketAbi.abi,
      address: energyMarketAddress,
      functionName: "placeMultipleBids",
      args: [startTimestamp, endTimestamp, energy, amount],
    });
  }
  };

  const handleApprove = async (amount: BigInt) => {
    const tx = writeContract({
      abi: EURCAbi.abi,
      address: EURCAddress,
      functionName: "approve",
      args: [energyMarketAddress, BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935")], //BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935")
    });
  };

  useEffect(() => {
    if (isConnected && isConfirmed) {
      refetchAllowance();
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

  const setEURCAmount = (val?: number) => {
    if (!decimals || !balance || !val) return;
    if (
      +val * 10 ** +decimals.toString() >
      +balance.toString()
    )
      return;
    const newAmount =
      val * 10 ** +decimals.toString();
    console.log(newAmount);
    setAmount(BigInt(newAmount));
  };

  const getEURCAmount = () => {
    if (!decimals || !balance || !amount) return;
    return +amount.toString() / 10 ** +decimals.toString();
  };

  const calculateExactHours = (): number => {
    const diffMilliseconds = endDate.getTime() - startDate.getTime();
    const diffHours = diffMilliseconds / (1000 * 60 * 60);
    
    if (diffHours === 0) {
      return 1;
    }
    
    return Math.abs(diffHours);
  };

  return (
    <div className="flex justify-center items-center">
      <DateTimePicker startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate}/>
      <div className="flex flex-col px-7 py-9 font-medium bg-white rounded-xl shadow-lg max-w-[526px] max-md:px-5">
        <div className="flex gap-5 justify-between px-0.5 py-1 text-2xl font-bold leading-6 text-gray-900 whitespace-nowrap max-md:flex-wrap max-md:max-w-full">
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
              isNaN(parseFloat(val)) ? setEnergy(0) : setEnergy(parseFloat(val));
            }}
          />
        </div>
        <div className="flex gap-5 justify-between px-0.5 py-px mt-8 leading-[100%] max-md:flex-wrap max-md:max-w-full">
          <div className="flex flex-col justify-end text-sm text-gray-500">
            <span className="text-gray-500">{currencyName}</span>
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
              <div className="mt-2 text-gray-900">Connect Wallet to display balance</div>
            ) : null}
            {!(isPending || error) && isConnected ? (
              <div className="mt-2 text-gray-900">
                {(+balance.toString() / 10 ** +decimals.toString()).toFixed(2)}{" "}
                {currencyName}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex gap-4 py-1 mt-2 uppercase whitespace-nowrap bg-white rounded-xl border border-indigo-50 border-solid max-md:flex-wrap max-md:max-w-full">
          <EURCBidItem
            icon={"/eurc.png"}
            unit={currencyName}
            value={getEURCAmount()}
            setValue={(val: string) => {
              setEURCAmount(parseFloat(val));
            }}
          />
          <div
            onClick={() => setAmount(balance)}
            className="inline-block px-2 py-2 my-auto text-xs font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            Max
          </div>
        </div>
        <div className="shrink-0 mt-4 rounded-lg bg-slate-50 h-[50px] max-md:max-w-full">
          <div className="flex justify-between px-4 py-2">
            <span>Total amount to pay:</span>
            <span>{getEURCAmount() ? (energy * getEURCAmount()! * calculateExactHours()).toFixed(2) : 0} EURC</span>
          </div>
        </div>
        <div className="shrink-0 mt-4 rounded-lg bg-slate-50 h-[50px] max-md:max-w-full" />
        {!isConnected ? (
          <div className="justify-center items-center px-8 py-4 mt-10 text-base leading-4 text-center text-white bg-blue-600 rounded-lg border border-blue-600 border-solid max-md:px-5 max-md:max-w-full">
            <div className="flex justify-center">
              <w3m-connect-button />
            </div>
          </div>
        ) : null}

        {isWritePending || isConfirming ? (
          <Button
            disabled={true}
            className="justify-center items-center px-8 py-4 mt-10 text-base leading-4 text-center text-white bg-blue-600 rounded-lg border border-blue-600 border-solid max-md:px-5 max-md:max-w-full"
          >
            <Spinner />
          </Button>
        ) : null}
        {isConnected &&
        !isWritePending &&
        !isConfirming &&
        allowance >= amount ? (
          <Button
            onClick={() => handleBid(energy, amount)}
            className="justify-center items-center px-8 py-4 mt-10 text-base leading-4 text-center text-white bg-blue-600 rounded-lg border border-blue-600 border-solid max-md:px-5 max-md:max-w-full"
          >
            Submit
          </Button>
        ) : null}
        {isConnected &&
        !isWritePending &&
        !isConfirming &&
        allowance < amount ? (
          <Button
            onClick={() => handleApprove(amount)}
            className="justify-center items-center px-8 py-4 mt-10 text-base leading-4 text-center text-white bg-blue-600 rounded-lg border border-blue-600 border-solid max-md:px-5 max-md:max-w-full"
          >
            Approve
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default BidBox;
