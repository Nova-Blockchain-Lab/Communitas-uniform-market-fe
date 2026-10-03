import React from "react";
import { Series } from "remotion";
import { IntroCard } from "../components/IntroCard";
import { ChapterCard } from "../components/ChapterCard";
import { OutroCard } from "../components/OutroCard";
import { ConnectWalletScene } from "../scenes/wallet/ConnectWalletScene";
import { BridgeFundsScene } from "../scenes/bridge/BridgeFundsScene";
import { BidOnEnergyScene } from "../scenes/buy/BidOnEnergyScene";
import { SellEnergyScene } from "../scenes/sell/SellEnergyScene";
import { CheckBuyerOrdersScene } from "../scenes/orders/CheckBuyerOrdersScene";
import { CheckSellerOrdersScene } from "../scenes/orders/CheckSellerOrdersScene";
import { ClaimBuyerRefundScene } from "../scenes/claim/ClaimBuyerRefundScene";
import { ClaimSellerEarningsScene } from "../scenes/claim/ClaimSellerEarningsScene";
import { CancelBidScene } from "../scenes/orders/CancelBidScene";
import { SCENE_DURATIONS, DURATIONS, sec } from "../lib/timing";

export const FullTutorial: React.FC = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={DURATIONS.intro}>
        <IntroCard title="COMMUNITAS" subtitle="Energy Market — Complete Tutorial" />
      </Series.Sequence>

      {/* Chapter 1: Getting Started */}
      <Series.Sequence durationInFrames={DURATIONS.chapterCard}>
        <ChapterCard chapter={1} title="Connect Your Wallet" description="Link your Web3 wallet to the platform" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.connectWallet}>
        <ConnectWalletScene />
      </Series.Sequence>

      {/* Chapter 2: Bridge Funds */}
      <Series.Sequence durationInFrames={DURATIONS.chapterCard}>
        <ChapterCard chapter={2} title="Bridge Funds to L2" description="Transfer ETH to Nova Cidade network" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.bridgeFunds}>
        <BridgeFundsScene />
      </Series.Sequence>

      {/* Chapter 3: Buy Energy */}
      <Series.Sequence durationInFrames={DURATIONS.chapterCard}>
        <ChapterCard chapter={3} title="Bid on Energy" description="Place a buy order on the energy market" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.bidOnEnergy}>
        <BidOnEnergyScene />
      </Series.Sequence>

      {/* Chapter 4: Sell Energy */}
      <Series.Sequence durationInFrames={DURATIONS.chapterCard}>
        <ChapterCard chapter={4} title="Sell Energy" description="List your energy for sale" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.sellEnergy}>
        <SellEnergyScene />
      </Series.Sequence>

      {/* Chapter 5: Check Buyer Orders */}
      <Series.Sequence durationInFrames={DURATIONS.chapterCard}>
        <ChapterCard chapter={5} title="Check Buyer Orders" description="Review your bid results and clearing prices" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.checkBuyerOrders}>
        <CheckBuyerOrdersScene />
      </Series.Sequence>

      {/* Chapter 6: Check Seller Orders */}
      <Series.Sequence durationInFrames={DURATIONS.chapterCard}>
        <ChapterCard chapter={6} title="Check Seller Orders" description="View your sold energy amounts" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.checkSellerOrders}>
        <CheckSellerOrdersScene />
      </Series.Sequence>

      {/* Chapter 7: Claim Buyer Refund */}
      <Series.Sequence durationInFrames={DURATIONS.chapterCard}>
        <ChapterCard chapter={7} title="Claim Buyer Refund" description="Withdraw refunded money from rejected bids" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.claimBuyerRefund}>
        <ClaimBuyerRefundScene />
      </Series.Sequence>

      {/* Chapter 8: Claim Seller Earnings */}
      <Series.Sequence durationInFrames={DURATIONS.chapterCard}>
        <ChapterCard chapter={8} title="Claim Seller Earnings" description="Withdraw earnings from sold energy" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.claimSellerEarnings}>
        <ClaimSellerEarningsScene />
      </Series.Sequence>

      {/* Chapter 9: Cancel Bid */}
      <Series.Sequence durationInFrames={DURATIONS.chapterCard}>
        <ChapterCard chapter={9} title="Cancel a Bid" description="Remove an active bid from the market" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.cancelBid}>
        <CancelBidScene />
      </Series.Sequence>

      {/* Outro */}
      <Series.Sequence durationInFrames={DURATIONS.outro}>
        <OutroCard />
      </Series.Sequence>
    </Series>
  );
};
