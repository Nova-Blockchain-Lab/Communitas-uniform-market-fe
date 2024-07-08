import { useAccount, useReadContracts } from "wagmi";
import { DAYS_TO_DISPLAY, energyMarketAddress } from "../constants/config";
import EnergyBiddingMarketAbi from "../abi/EnergyBiddingMarket.json";
import { useEffect } from "react";

// Utility function for generating timestamps
export const getAllHourTimestamps = (days: number): number[] => {
  const timestamps: number[] = [];
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const startTime = new Date(now.getTime() - 24 * days * 60 * 60 * 1000);
  const endTime = new Date(now.getTime() + 24 * days * 60 * 60 * 1000);
  for (
    let hour = new Date(startTime);
    hour <= endTime;
    hour.setHours(hour.getHours() + 1)
  ) {
    timestamps.push(hour.getTime() / 1000); // Store timestamps in seconds
  }
  return timestamps;
};

// BidItem component
interface BidItemProps {
  time: string;
  settled: boolean;
  amount: BigInt;
  price: BigInt;
}

const BidItem: React.FC<BidItemProps> = ({ time, settled, amount, price }) => (
  <div className="flex flex-col justify-center p-2.5 w-full bg-white border-b border-gray-100 border-solid">
    <div className="flex gap-2.5 text-neutral-700">
      <div className="flex-1 text-base font-semibold">Bid</div>
      <div className="flex gap-2.5 self-start text-sm text-right">
        <div>{time}</div>
      </div>
    </div>
    <div className="flex gap-2.5 self-start mt-2.5 text-xs text-neutral-400">
      {settled ? (
        <div className="justify-center pr-2.5 border-r border-gray-100 border-solid text-green-600">
          Settled
        </div>
      ) : (
        <div className="justify-center pr-2.5 border-r border-gray-100 border-solid text-red-600">
          Unsettled
        </div>
      )}
      {amount && (
        <div className="justify-center pr-2.5 border-r border-gray-100 border-solid text-stone-600">
          {"Amount: " + amount.toString()}
        </div>
      )}
      <div className="text-indigo-600">
        Price: {(+price.toString() / 10 ** 18).toFixed(6)} ETH
      </div>
    </div>
  </div>
);

// MyList component for bids
interface MyListProps {
  bids: BidItemProps[];
  timestamps: number[];
}

const MyListBids: React.FC<MyListProps> = ({ bids, timestamps }) => {
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col whitespace-nowrap border border-gray-100 border-solid max-w-[400px]">
      {bids.map((item, i) =>
        item.result.map((bid: any, j: number) => (
          <div
            key={i.toString() + j.toString()}
            className="flex flex-col justify-center p-2.5 w-full bg-white border-b border-gray-100 border-solid space-y-4"
          >
            <BidItem
              key={i.toString() + j.toString()}
              time={formatDate(timestamps[i])}
              settled={bid.settled}
              amount={bid.amount}
              price={bid.price}
            />
          </div>
        ))
      )}
    </div>
  );
};

// AskItem component
interface AskItemProps {
  time: string;
  settled: boolean;
  amount: BigInt;
  matchedAmount: BigInt;
}

const AskItem: React.FC<AskItemProps> = ({
  time,
  settled,
  amount,
  matchedAmount,
}) => (
  <div className="flex flex-col justify-center p-2.5 w-full bg-white border-b border-gray-100 border-solid">
    <div className="flex gap-2.5 text-neutral-700">
      <div className="flex-1 text-base font-semibold">Ask</div>
      <div className="flex gap-2.5 self-start text-sm text-right">
        <div>{time}</div>
      </div>
    </div>
    <div className="flex gap-2.5 self-start mt-2.5 text-xs text-neutral-400">
      {settled ? (
        <div className="justify-center pr-2.5 border-r border-gray-100 border-solid text-green-600">
          Settled
        </div>
      ) : matchedAmount == BigInt(0) ? (
        <div className="justify-center pr-2.5 border-r border-gray-100 border-solid text-red-600">
          Unsettled
        </div>
      ) : (
        <div className="justify-center pr-2.5 border-r border-gray-100 border-solid text-yellow-600">
          Half Settled
        </div>
      )}
      {amount && (
        <div className="justify-center pr-2.5 border-r border-gray-100 border-solid text-stone-600">
          {"Amount: " + amount.toString()}
        </div>
      )}
      {matchedAmount && (
        <div className="justify-center pr-2.5 border-r border-gray-100 border-solid text-stone-600">
          {"Amount Sold: " + matchedAmount.toString()}
        </div>
      )}
    </div>
  </div>
);

// MyList component for asks
const MyListAsks: React.FC<{ asks: AskItemProps[]; timestamps: number[] }> = ({
  asks,
  timestamps,
}) => {
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-col whitespace-nowrap border border-gray-100 border-solid max-w-[400px]">
      {asks.map((item, i) =>
        item.result.map((ask: any, j: number) => (
          <div
            key={i.toString() + j.toString()}
            className="flex flex-col justify-center p-2.5 w-full bg-white border-b border-gray-100 border-solid space-y-4"
          >
            <AskItem
              key={i.toString() + j.toString()}
              time={formatDate(timestamps[i])}
              settled={ask.settled}
              amount={ask.amount}
              matchedAmount={ask.matchedAmount}
            />
          </div>
        ))
      )}
    </div>
  );
};

// Combined parent component
const CombinedOrdersBox: React.FC = () => {
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

  const getAllAsksConfig = () => {
    const contracts = [];
    const timestamps = getAllHourTimestamps(DAYS_TO_DISPLAY);
    for (const timestamp of timestamps) {
      contracts.push({
        abi: EnergyBiddingMarketAbi.abi,
        address: energyMarketAddress,
        functionName: "getAsksByAddress",
        args: [timestamp, address],
      });
    }
    return contracts;
  };

  const {
    data: bids,
    isPending: isBidsPending,
    refetch: refetchBids,
  } = useReadContracts({
    contracts: getAllBidsConfig(),
  });

  const {
    data: asks,
    isPending: isAsksPending,
    refetch: refetchAsks,
  } = useReadContracts({
    contracts: getAllAsksConfig(),
  });

  console.log(bids, asks);

  useEffect(() => {
    if (isConnected) {
      refetchBids();
      refetchAsks();
    }
  }, [isConnected]);

  return (
    <div className="flex justify-center items-center">
      <div className="flex flex-col px-7 py-9 font-medium bg-white rounded-xl shadow-lg space-y-6">
        <div className="flex gap-5 justify-between px-0.5 py-1 text-2xl font-bold leading-6 text-gray-900 whitespace-nowrap max-md:flex-wrap max-md:max-w-full">
          My Orders
        </div>
        {!isConnected && <w3m-connect-button />}
        {isConnected && (
          <div className="flex justify-center items-center space-x-4">
            {isBidsPending ? (
              <div>Loading Bids...</div>
            ) : (
              <MyListBids
                bids={bids}
                timestamps={getAllHourTimestamps(DAYS_TO_DISPLAY)}
              />
            )}
            {isAsksPending ? (
              <div>Loading Asks...</div>
            ) : (
              <MyListAsks
                asks={asks}
                timestamps={getAllHourTimestamps(DAYS_TO_DISPLAY)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CombinedOrdersBox;
