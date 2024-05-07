import { useAccount, useReadContracts } from "wagmi";
import { DAYS_TO_DISPLAY, energyMarketAddress } from "../constants/config";
import EnergyBiddingMarketAbi from "../abi/EnergyBiddingMarket.json";
import { useEffect } from "react";

const MyOrdersBox: React.FC = () => {
  

    const { isConnected, address } = useAccount();
    

  const getAllBidsConfig = () => {
    const contracts = [];

    const timestamps = getAllHourTimestamps(DAYS_TO_DISPLAY);

    for (const timestamp of timestamps) {
      contracts.push({
        abi: EnergyBiddingMarketAbi.abi,
        address: energyMarketAddress,
        functionName: "getBidsByAddress",
        args: [timestamp, address],
      });
    }

    return contracts;
  };
  

  const getAllHourTimestamps = (days: number): number[] => {
    const timestamps: number[] = [];
    const now = new Date();

    const startTime = new Date(now);
    startTime.setDate(now.getDate() - days);
    startTime.setHours(0, 0, 0, 0);

    const endTime = new Date(now);
    endTime.setDate(now.getDate() + days);
    endTime.setHours(23, 0, 0, 0);

    for (
      let hour = startTime;
      hour <= endTime;
      hour.setHours(hour.getHours() + 1)
    ) {
      timestamps.push(hour.getTime() / 1000);
    }

    return timestamps;
  };

  const { data, error, isPending, refetch } = useReadContracts({
    contracts: getAllBidsConfig(),
  });

  console.log(data)
  console.log(isConnected)


  useEffect(() => {
    console.log('conected')
    if (isConnected) {
        refetch();
        console.log(data);
    }
  }, [isConnected]);


  return (
    <div className="flex justify-center items-center">
      <div className="flex flex-col px-7 py-9 font-medium bg-white rounded-xl shadow-lg max-w-[526px] max-md:px-5">
        <div className="flex gap-5 justify-between px-0.5 py-1 text-2xl font-bold leading-6 text-gray-900 whitespace-nowrap max-md:flex-wrap max-md:max-w-full">
          My Orders
        </div>
      </div>
    </div>
  );
};

export default MyOrdersBox;
