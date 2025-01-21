import {
    useAccount,
    useReadContracts,
    useWaitForTransactionReceipt,
    useWriteContract,
} from "wagmi";
import {DECIMALS, defaultChain} from "../constants/config";
import EnergyBiddingMarketAbi from "../abi/EnergyBiddingMarket.json";
import {useEffect, useState} from "react";
import {useAppContext} from "./AppContext";
import {AbiFunction} from "viem";
import {DayPicker} from "react-day-picker";
import "react-day-picker/dist/style.css";
import {
    Button,
    Box,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    ModalFooter,
    useToast,
    Spinner,
} from "@chakra-ui/react"; // Add Button and Box import
import {FaCalendarAlt} from "react-icons/fa";
import ConnectAndSwitchNetworkButton from "./ConnectAndSwitchNetworkButton"; // Import an icon for the button

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

const getTimestampsForDay = (day: Date): number[] => {
    const timestamps: number[] = [];
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 0, 0, 0);
    for (
        let hour = new Date(start);
        hour <= end;
        hour.setHours(hour.getHours() + 1)
    ) {
        timestamps.push(hour.getTime() / 1000);
    }
    return timestamps;
};

// BidItem component
interface BidItemProps {
    time: number;
    index: number;
    settled: boolean;
    amount: BigInt;
    price: BigInt;
    canceled: boolean;
    isMarketClearedForHour?: boolean;
    clearingPrice?: BigInt;
    refetch: () => void;
}

const BidItem: React.FC<BidItemProps> = ({
                                             time,
                                             index,
                                             settled,
                                             amount,
                                             price,
                                             canceled,
                                             isMarketClearedForHour,
                                             clearingPrice,
                                             refetch,
                                         }) => {
    const {ethPrice, energyMarketAddress} = useAppContext();

    const toast = useToast();

    const {
        data: hash,
        isPending: isWritePending,
        writeContract,
    } = useWriteContract();

    const {isLoading: isConfirming, isSuccess: isConfirmed} =
        useWaitForTransactionReceipt({hash});

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

    /*const isInTheFuture = (timestamp: number): boolean => {
      return new Date() < new Date(timestamp * 1000);
    };*/

    const handleCancelButton = async () => {
        if (!energyMarketAddress) return;
        writeContract({
            abi: EnergyBiddingMarketAbi.abi as AbiFunction[],
            address: energyMarketAddress,
            functionName: "cancelBid",
            args: [time, index],
        });
    };

    useEffect(() => {
        if (!hash || isConfirming) return;
        if (isConfirmed) {
            sendSuccessfulNotification();
            refetch();
        } else sendUnsuccessfulNotification();
    }, [isConfirming]);

    return (
        <div
            className="relative flex flex-col justify-center p-2.5 w-full bg-white border-b border-gray-100 border-solid">
            <div className="relative z-10 flex gap-2.5 text-neutral-700">
                <div className="flex-1 text-base font-semibold">Bid</div>
                <div className="flex gap-2.5 self-start text-sm text-right">
                    <div>{formatDate(time)}</div>
                </div>
                <div>
                    {(isWritePending || isConfirming) && (
                        <Spinner size="sm" color="red"/>
                    )}
                    {!canceled &&
                        !isMarketClearedForHour &&
                        !isWritePending &&
                        !isConfirming && (
                            <Button w="80%" h="90%" bg="red.500" onClick={handleCancelButton}>
                                Cancel
                            </Button>
                        )}
                </div>
            </div>

            <div className="relative z-10 flex gap-2.5 self-start mt-2.5 text-xs text-neutral-400">
                {settled ? (
                    <div className="justify-center pr-2.5 border-r border-gray-100 border-solid text-green-600">
                        Settled
                    </div>
                ) : isMarketClearedForHour ? (
                    <div className="justify-center pr-2.5 border-r border-gray-100 border-solid text-red-600">
                        Unsettled
                    </div>
                ) : (
                    <div className="justify-center pr-2.5 border-r border-gray-100 border-solid text-red-600">
                        Not Cleared
                    </div>
                )}
                {amount && (
                    <div className="justify-center pr-2.5 border-r border-gray-100 border-solid text-stone-600">
                        {"Amount: " + amount.toString()}
                    </div>
                )}
                <div className="flex items-center">
                    <div className="text-indigo-600">
                        Price: {(+price.toString() / 10 ** DECIMALS).toFixed(6)} ETH
                    </div>
                    {ethPrice && (
                        <div className="ml-2 text-xs text-gray-500 shadow-sm">
                            ({((+price.toString() / 10 ** DECIMALS) * ethPrice).toFixed(2)}€)
                        </div>
                    )}
                    <div className="text-indigo-600">&nbsp;per kWh</div>
                </div>
                {isMarketClearedForHour && clearingPrice && (
                    <div className="flex items-center">
                        <div className="text-indigo-600">
                            Clearing Price:{" "}
                            {(+clearingPrice.toString() / 10 ** DECIMALS).toFixed(6)} ETH
                        </div>
                        {ethPrice && (
                            <div className="ml-2 text-xs text-gray-500 shadow-sm">
                                (
                                {(
                                    (+clearingPrice.toString() / 10 ** DECIMALS) *
                                    ethPrice
                                ).toFixed(2)}
                                € )
                            </div>
                        )}
                        <div className="text-indigo-600">&nbsp;per kWh</div>
                    </div>
                )}
            </div>

            {canceled && (
                <div className="absolute inset-0 z-20 pointer-events-none">
                    <div
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white font-bold text-center px-8 py-1 opacity-75">
                        Canceled
                    </div>
                </div>
            )}
        </div>
    );
};

// MyList component for bids
interface MyListProps {
    bids: any;
    timestamps: number[];
    isMarketClearedForHour?: boolean[];
    clearingPrice?: BigInt[];
    refetch: () => void;
}

const MyListBids: React.FC<MyListProps> = ({
                                               bids,
                                               timestamps,
                                               isMarketClearedForHour,
                                               clearingPrice,
                                               refetch,
                                           }) => {
    return (
        <div className="flex flex-col whitespace-nowrap border border-gray-100 border-solid w-auto">
            {bids.map((item: any, i: any) =>
                item.result.map((bid: any, j: number) => (
                    <div
                        key={i.toString() + j.toString()}
                        className="flex flex-col justify-center p-2.5 w-full bg-white border-b border-gray-100 border-solid space-y-4"
                    >
                        <BidItem
                            key={i.toString() + j.toString()}
                            time={timestamps[i]}
                            index={j}
                            settled={bid.settled}
                            amount={bid.amount}
                            price={bid.price}
                            canceled={bid.canceled}
                            isMarketClearedForHour={isMarketClearedForHour?.at(i)}
                            clearingPrice={clearingPrice?.at(i)}
                            refetch={refetch}
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
    isMarketClearedForHour?: boolean;
    clearingPrice?: BigInt;
}

const AskItem: React.FC<AskItemProps> = ({
                                             time,
                                             settled,
                                             amount,
                                             matchedAmount,
                                             isMarketClearedForHour,
                                             clearingPrice,
                                         }) => {
    const {ethPrice} = useAppContext();

    return (
        <div className="flex flex-col justify-center p-2.5 w-full bg-white border-b border-gray-100 border-solid">
            <div className="flex gap-2.5 text-neutral-700">
                <div className="flex-1 text-base font-semibold">Ask</div>
                <div className="flex gap-2.5 self-start text-sm text-right">
                    <div>{time}</div>
                </div>
            </div>
            <div className="flex gap-2.5 self-start mt-2.5 text-xs text-neutral-400">
                {!isMarketClearedForHour ? (
                    <div className="justify-center pr-2.5 border-r border-gray-100 border-solid text-red-600">
                        Not Cleared
                    </div>
                ) : settled ? (
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
                {isMarketClearedForHour && clearingPrice && (
                    <div className="flex items-center">
                        <div className="text-indigo-600">
                            Clearing Price:{" "}
                            {(+clearingPrice.toString() / 10 ** DECIMALS).toFixed(6)} ETH
                        </div>
                        {ethPrice && (
                            <div className="ml-2 text-xs text-gray-500 shadow-sm">
                                (
                                {(
                                    (+clearingPrice.toString() / 10 ** DECIMALS) *
                                    ethPrice
                                ).toFixed(2)}
                                € )
                            </div>
                        )}
                        <div className="text-indigo-600">&nbsp;per kWh</div>
                    </div>
                )}
            </div>
        </div>
    );
};

// MyList component for asks
const MyListAsks: React.FC<{
    asks: any;
    timestamps: number[];
    isMarketClearedForHour?: boolean[];
    clearingPrice?: BigInt[];
}> = ({asks, timestamps, isMarketClearedForHour, clearingPrice}) => {
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
        <div className="flex flex-col whitespace-nowrap border border-gray-100 border-solid w-auto">
            {asks.map((item: any, i: any) =>
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
                            isMarketClearedForHour={isMarketClearedForHour?.at(i)}
                            clearingPrice={clearingPrice?.at(i)}
                        />
                    </div>
                ))
            )}
        </div>
    );
};

// Combined parent component
const CombinedOrdersBox: React.FC = () => {
    const {isConnected, address, chainId} = useAccount();

    const {energyMarketAddress} = useAppContext();

    const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date()); // State for selected date
    const [isCalendarOpen, setIsCalendarOpen] = useState(false); // State for calendar visibility

    const timestamps = getTimestampsForDay(selectedDay || new Date());

    const getAllBidsConfig = () => {
        const contracts = [];
        for (const timestamp of timestamps) {
            contracts.push({
                abi: EnergyBiddingMarketAbi.abi as AbiFunction[],
                address: energyMarketAddress,
                functionName: "getBidsByAddress",
                args: [timestamp, address],
            });
        }
        return contracts;
    };

    const getAllAsksConfig = () => {
        const contracts = [];
        for (const timestamp of timestamps) {
            contracts.push({
                abi: EnergyBiddingMarketAbi.abi as AbiFunction[],
                address: energyMarketAddress,
                functionName: "getAsksByAddress",
                args: [timestamp, address],
            });
        }
        return contracts;
    };

    const getIsMarketClearedConfig = () => {
        const contracts = [];
        for (const timestamp of timestamps) {
            contracts.push({
                abi: EnergyBiddingMarketAbi.abi as AbiFunction[],
                address: energyMarketAddress,
                functionName: "isMarketCleared",
                args: [timestamp],
            });
        }
        return contracts;
    };

    const getClearingPriceConfig = () => {
        const contracts = [];
        for (const timestamp of timestamps) {
            contracts.push({
                abi: EnergyBiddingMarketAbi.abi as AbiFunction[],
                address: energyMarketAddress,
                functionName: "getClearingPrice",
                args: [timestamp],
            });
        }
        return contracts;
    };

    const {
        data: bids,
        isPending: isBidsPending,
        refetch: refetchBids,
    } = useReadContracts({
        contracts: defaultChain.id === chainId ? getAllBidsConfig() : [],
    });

    const {
        data: asks,
        isPending: isAsksPending,
        refetch: refetchAsks,
    } = useReadContracts({
        contracts: getAllAsksConfig(),
    });

    const {
        data: isMarketClearedForHour,
        isPending: isMarketClearedPending,
        refetch: refetchMarketCleared,
    } = useReadContracts({
        contracts: defaultChain.id === chainId ? getIsMarketClearedConfig() : [],
    });

    const {
        data: clearingPrice,
        isPending: isClearingPricePending,
        refetch: refetchClearingPrice,
    } = useReadContracts({
        contracts: defaultChain.id === chainId ? getClearingPriceConfig() : [],
    });

    useEffect(() => {
        if (isConnected) {
            refetchBids();
            refetchAsks();
            refetchMarketCleared();
            refetchClearingPrice();
        }
    }, [isConnected]);

    return (
        <div className="flex justify-center items-center">
            <div className="flex flex-col px-7 py-9 font-medium bg-white rounded-xl shadow-lg space-y-6">
                <div
                    className="flex gap-5 justify-between px-0.5 py-1 text-2xl font-bold leading-6 text-gray-900 whitespace-nowrap max-md:flex-wrap max-md:max-w-full">
                    My Orders
                </div>
                <div className="flex items-center space-x-2">
                    <div className="text-lg font-semibold text-gray-700">
                        {selectedDay?.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                        })}
                    </div>
                    <button
                        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <FaCalendarAlt size={20}/>
                    </button>
                </div>
                {isCalendarOpen && (
                    <Modal
                        isOpen={isCalendarOpen}
                        onClose={() => setIsCalendarOpen(false)}
                    >
                        <ModalOverlay/>
                        <ModalContent>
                            <ModalHeader>Select Day to View Orders</ModalHeader>
                            <ModalCloseButton/>
                            <ModalBody>
                                <Box p={2} mt={12}>
                                    <DayPicker
                                        mode="single"
                                        selected={selectedDay}
                                        onSelect={setSelectedDay}
                                    />
                                </Box>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    colorScheme="blue"
                                    onClick={() => setIsCalendarOpen(false)}
                                >
                                    Close
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    </Modal>
                )}
                {(!isConnected || (chainId && defaultChain.id !== chainId)) && (
                    <div className="py-2 mt-10 bg-blue-600 rounded-lg border border-blue-600 border-solid">
                        <div className="flex justify-center flex-col items-center">
                            <ConnectAndSwitchNetworkButton/>
                        </div>
                    </div>
                )}
                {isConnected && energyMarketAddress && defaultChain.id === chainId && (
                    <div className="flex justify-center items-start space-x-4">
                        {isBidsPending ? (
                            <div>Loading Bids...</div>
                        ) : (
                            <MyListBids
                                bids={bids}
                                timestamps={timestamps}
                                isMarketClearedForHour={isMarketClearedForHour?.map(
                                    (cleared: any) => cleared.result
                                )}
                                clearingPrice={clearingPrice?.map((price: any) => price.result)}
                                refetch={refetchBids}
                            />
                        )}
                        {isAsksPending ? (
                            <div>Loading Asks...</div>
                        ) : (
                            <MyListAsks
                                asks={asks}
                                timestamps={timestamps}
                                isMarketClearedForHour={isMarketClearedForHour?.map(
                                    (cleared: any) => cleared.result
                                )}
                                clearingPrice={clearingPrice?.map((price: any) => price.result)}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CombinedOrdersBox;
