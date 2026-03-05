import React, { useState } from "react";
import { useAccount } from "wagmi";
import { BarChart3 } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

import { defaultChain } from "@/config";
import { useAppContext } from "@/context/AppContext";
import { useDashboardData } from "@/hooks/useDashboardData";
import ConnectAndSwitchNetworkButton from "@/components/common/ConnectAndSwitchNetworkButton";
import DateNavigationBar from "@/components/common/DateNavigationBar";
import { Card, CardHeader } from "@/components/ui";
import HourSelector from "./HourSelector";
import BubbleVisualization from "./BubbleVisualization";

const EnergyDashboard: React.FC = () => {
  const { isConnected, chainId } = useAccount();
  const { ethPrice } = useAppContext();
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [selectedHour, setSelectedHour] = useState<number>(
    new Date().getHours()
  );
  const { hourData, isPending } = useDashboardData(selectedDay);

  const needsConnection =
    !isConnected || (chainId !== undefined && defaultChain.id !== chainId);
  const currentHourData = hourData.find((h) => h.hour === selectedHour);

  return (
    <div className="w-full max-w-6xl">
      <Card padding="lg">
        <CardHeader
          title="Energy Exchange"
          subtitle="Real-time market participant visualization"
          icon={<BarChart3 size={20} />}
        />

        <DateNavigationBar
          selectedDay={selectedDay}
          onDayChange={setSelectedDay}
        />

        {needsConnection ? (
          <div className="py-8">
            <ConnectAndSwitchNetworkButton />
          </div>
        ) : isPending ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" color="blue.400" />
          </div>
        ) : (
          <>
            <HourSelector
              hours={hourData}
              selectedHour={selectedHour}
              onSelectHour={setSelectedHour}
            />
            <BubbleVisualization data={currentHourData} ethPrice={ethPrice} />
          </>
        )}
      </Card>
    </div>
  );
};

export default EnergyDashboard;
