import React from "react";
import { Series } from "remotion";
import { IntroCard } from "../components/IntroCard";
import { ChapterCard } from "../components/ChapterCard";
import { OutroCard } from "../components/OutroCard";
import { BridgeFundsScene } from "../scenes/bridge/BridgeFundsScene";
import { SellEnergyScene } from "../scenes/sell/SellEnergyScene";
import { CheckSellerOrdersScene } from "../scenes/orders/CheckSellerOrdersScene";
import { ClaimSellerEarningsScene } from "../scenes/claim/ClaimSellerEarningsScene";
import { SCENE_DURATIONS, DURATIONS } from "../lib/timing";

export const SellerJourneyTutorial: React.FC = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={DURATIONS.intro}>
        <IntroCard title="COMMUNITAS" subtitle="Seller Journey Tutorial" />
      </Series.Sequence>

      <Series.Sequence durationInFrames={DURATIONS.chapterCard}>
        <ChapterCard chapter={1} title="Bridge Funds" description="Get ETH for gas on L2" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.bridgeFunds}>
        <BridgeFundsScene />
      </Series.Sequence>

      <Series.Sequence durationInFrames={DURATIONS.chapterCard}>
        <ChapterCard chapter={2} title="Sell Energy" description="List energy on the market" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.sellEnergy}>
        <SellEnergyScene />
      </Series.Sequence>

      <Series.Sequence durationInFrames={DURATIONS.chapterCard}>
        <ChapterCard chapter={3} title="Check Results" description="See how much energy was sold" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.checkSellerOrders}>
        <CheckSellerOrdersScene />
      </Series.Sequence>

      <Series.Sequence durationInFrames={DURATIONS.chapterCard}>
        <ChapterCard chapter={4} title="Claim Earnings" description="Withdraw your earnings" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.claimSellerEarnings}>
        <ClaimSellerEarningsScene />
      </Series.Sequence>

      <Series.Sequence durationInFrames={DURATIONS.outro}>
        <OutroCard />
      </Series.Sequence>
    </Series>
  );
};
