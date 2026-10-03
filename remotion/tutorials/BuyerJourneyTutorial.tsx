import React from "react";
import { Series } from "remotion";
import { IntroCard } from "../components/IntroCard";
import { ChapterCard } from "../components/ChapterCard";
import { OutroCard } from "../components/OutroCard";
import { BridgeFundsScene } from "../scenes/bridge/BridgeFundsScene";
import { BidOnEnergyScene } from "../scenes/buy/BidOnEnergyScene";
import { CheckBuyerOrdersScene } from "../scenes/orders/CheckBuyerOrdersScene";
import { ClaimBuyerRefundScene } from "../scenes/claim/ClaimBuyerRefundScene";
import { SCENE_DURATIONS, DURATIONS } from "../lib/timing";

export const BuyerJourneyTutorial: React.FC = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={DURATIONS.intro}>
        <IntroCard title="COMMUNITAS" subtitle="Buyer Journey Tutorial" />
      </Series.Sequence>

      <Series.Sequence durationInFrames={DURATIONS.chapterCard}>
        <ChapterCard chapter={1} title="Bridge Funds" description="Get ETH on your L2 wallet" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.bridgeFunds}>
        <BridgeFundsScene />
      </Series.Sequence>

      <Series.Sequence durationInFrames={DURATIONS.chapterCard}>
        <ChapterCard chapter={2} title="Place a Bid" description="Buy energy on the market" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.bidOnEnergy}>
        <BidOnEnergyScene />
      </Series.Sequence>

      <Series.Sequence durationInFrames={DURATIONS.chapterCard}>
        <ChapterCard chapter={3} title="Check Results" description="See if your bid was matched" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.checkBuyerOrders}>
        <CheckBuyerOrdersScene />
      </Series.Sequence>

      <Series.Sequence durationInFrames={DURATIONS.chapterCard}>
        <ChapterCard chapter={4} title="Claim Refund" description="Withdraw refunded money" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.claimBuyerRefund}>
        <ClaimBuyerRefundScene />
      </Series.Sequence>

      <Series.Sequence durationInFrames={DURATIONS.outro}>
        <OutroCard />
      </Series.Sequence>
    </Series>
  );
};
