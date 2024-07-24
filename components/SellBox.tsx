import * as React from "react";
import { useAccount, useConnect, useDisconnect, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import EnergyBiddingMarketAbi from "../abi/EnergyBiddingMarket.json"
import { Button, Image, Spinner, useToast } from "@chakra-ui/react";
import {
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from "@chakra-ui/react";
import { useEffect } from "react";
import { useAppContext } from "./AppContext";



const EnergyBidItem: React.FC<{
  icon: string;
  unit: string;
  value?: BigInt;
  setValue: (value: number) => void;
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
      onChange={(val) => {
        setValue(+val);
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

const BidBox: React.FC = () => {

    const energyUnit = "kWh";

    const { isConnected, address } = useAccount();
    const [ energy, setEnergy ] = React.useState<number>(0);

    const { energyMarketAddress } = useAppContext();

    const { data: hash, isPending: isWritePending, writeContract } = useWriteContract()

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

    const toast = useToast();

  const handleAsk = async (energy: number, hour: number) => {
    if (!energyMarketAddress) return;
    writeContract({
      abi: EnergyBiddingMarketAbi.abi,
      address: energyMarketAddress,
      functionName: 'placeAsk',
      args: [hour, energy],
    })
  }

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
  
  const getCurrentTimestamp = (): number => {
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours());
    nextHour.setMinutes(0);
    nextHour.setSeconds(0);
    nextHour.setMilliseconds(0);
    return nextHour.getTime()/1000;
};


  return (
    <div className="flex justify-center items-center">
    <div className="flex flex-col px-7 py-9 font-medium bg-white rounded-xl shadow-lg max-w-[526px] max-md:px-5">
        <div className="flex gap-5 justify-between px-0.5 py-1 text-2xl font-bold leading-6 text-gray-900 whitespace-nowrap max-md:flex-wrap max-md:max-w-full">Sell Energy</div>
      <div className="mt-9 text-sm leading-4 text-gray-500 max-md:max-w-full">
        <span className="text-gray-500">Energy</span>
      </div>
      <div className="flex gap-5 justify-between py-1 pr-3 pl-1 mt-2 w-full whitespace-nowrap bg-white rounded-xl border border-indigo-50 border-solid max-md:flex-wrap max-md:max-w-full">
        <EnergyBidItem icon={"/energy.png"} unit={energyUnit} value={BigInt(energy.toString())} setValue={setEnergy} />
      </div>
      
      <div className="shrink-0 mt-4 rounded-lg bg-slate-50 h-[50px] max-md:max-w-full" />
      { !isConnected ? 
      <div className="justify-center items-center px-8 py-4 mt-10 text-base leading-4 text-center text-white bg-blue-600 rounded-lg border border-blue-600 border-solid max-md:px-5 max-md:max-w-full">
      <div className="flex justify-center">
      <w3m-connect-button />
      </div>
      </div> : null}

      { isWritePending || isConfirming  ? 
        <Button disabled={true} className="justify-center items-center px-8 py-4 mt-10 text-base leading-4 text-center text-white bg-blue-600 rounded-lg border border-blue-600 border-solid max-md:px-5 max-md:max-w-full">
          <Spinner color='inherit'/>
        </Button> : null  
    }
      { isConnected && !isWritePending && !isConfirming ? 
        <Button onClick={() => handleAsk(energy, getCurrentTimestamp())} className="justify-center items-center px-8 py-4 mt-10 text-base leading-4 text-center text-white bg-blue-600 rounded-lg border border-blue-600 border-solid max-md:px-5 max-md:max-w-full">
            Submit
        </Button>
        : null }
      
    </div>
    </div>
  );
};

export default BidBox;