import React from "react";
import { Series } from "remotion";
import { IntroCard } from "../components/IntroCard";
import { ChapterCard } from "../components/ChapterCard";
import { OutroCard } from "../components/OutroCard";
import { CheckBuyerOrdersScene } from "../scenes/orders/CheckBuyerOrdersScene";
import { CheckSellerOrdersScene } from "../scenes/orders/CheckSellerOrdersScene";
import { CancelBidScene } from "../scenes/orders/CancelBidScene";
import { SCENE_DURATIONS, DURATIONS } from "../lib/timing";

export const OrderManagementTutorial: React.FC = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={DURATIONS.intro}>
        <IntroCard title="COMMUNITAS" subtitle="Order Management Tutorial" />
      </Series.Sequence>

      <Series.Sequence durationInFrames={DURATIONS.chapterCard}>
        <ChapterCard chapter={1} title="Buyer Orders" description="Check bid results and clearing prices" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.checkBuyerOrders}>
        <CheckBuyerOrdersScene />
      </Series.Sequence>

      <Series.Sequence durationInFrames={DURATIONS.chapterCard}>
        <ChapterCard chapter={2} title="Seller Orders" description="View sold energy amounts" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.checkSellerOrders}>
        <CheckSellerOrdersScene />
      </Series.Sequence>

      <Series.Sequence durationInFrames={DURATIONS.chapterCard}>
        <ChapterCard chapter={3} title="Cancel a Bid" description="Remove an active bid order" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.cancelBid}>
        <CancelBidScene />
      </Series.Sequence>

      <Series.Sequence durationInFrames={DURATIONS.outro}>
        <OutroCard />
      </Series.Sequence>
    </Series>
  );
};
