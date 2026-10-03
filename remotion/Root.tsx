import React from "react";
import { Composition, Folder } from "remotion";
import { FPS, WIDTH, HEIGHT, SCENE_DURATIONS, DURATIONS, sec } from "./lib/timing";

// Components
import { IntroCard } from "./components/IntroCard";
import { OutroCard } from "./components/OutroCard";
import { ChapterCard } from "./components/ChapterCard";

// Scenes
import { ConnectWalletScene } from "./scenes/wallet/ConnectWalletScene";
import { BridgeFundsScene } from "./scenes/bridge/BridgeFundsScene";
import { BidOnEnergyScene } from "./scenes/buy/BidOnEnergyScene";
import { SellEnergyScene } from "./scenes/sell/SellEnergyScene";
import { CheckBuyerOrdersScene } from "./scenes/orders/CheckBuyerOrdersScene";
import { CheckSellerOrdersScene } from "./scenes/orders/CheckSellerOrdersScene";
import { CancelBidScene } from "./scenes/orders/CancelBidScene";
import { ClaimBuyerRefundScene } from "./scenes/claim/ClaimBuyerRefundScene";
import { ClaimSellerEarningsScene } from "./scenes/claim/ClaimSellerEarningsScene";
import { MintNFTScene } from "./scenes/nft/MintNFTScene";
import { BridgeNFTScene } from "./scenes/nft/BridgeNFTScene";
import { GalleryScene } from "./scenes/nft/GalleryScene";
import { DashboardScene } from "./scenes/dashboard/DashboardScene";

// Tutorials
import { FullTutorial } from "./tutorials/FullTutorial";
import { BuyerJourneyTutorial } from "./tutorials/BuyerJourneyTutorial";
import { SellerJourneyTutorial } from "./tutorials/SellerJourneyTutorial";
import { OrderManagementTutorial } from "./tutorials/OrderManagementTutorial";
import { BridgeTutorial } from "./tutorials/BridgeTutorial";
import { NFTTutorial } from "./tutorials/NFTTutorial";
import { DashboardTutorial } from "./tutorials/DashboardTutorial";

// Calculate total durations for tutorials
const fullTutorialDuration =
  DURATIONS.intro +
  9 * DURATIONS.chapterCard + // 9 chapters
  SCENE_DURATIONS.connectWallet +
  SCENE_DURATIONS.bridgeFunds +
  SCENE_DURATIONS.bidOnEnergy +
  SCENE_DURATIONS.sellEnergy +
  SCENE_DURATIONS.checkBuyerOrders +
  SCENE_DURATIONS.checkSellerOrders +
  SCENE_DURATIONS.claimBuyerRefund +
  SCENE_DURATIONS.claimSellerEarnings +
  SCENE_DURATIONS.cancelBid +
  DURATIONS.outro;

const buyerJourneyDuration =
  DURATIONS.intro +
  4 * DURATIONS.chapterCard +
  SCENE_DURATIONS.bridgeFunds +
  SCENE_DURATIONS.bidOnEnergy +
  SCENE_DURATIONS.checkBuyerOrders +
  SCENE_DURATIONS.claimBuyerRefund +
  DURATIONS.outro;

const sellerJourneyDuration =
  DURATIONS.intro +
  4 * DURATIONS.chapterCard +
  SCENE_DURATIONS.bridgeFunds +
  SCENE_DURATIONS.sellEnergy +
  SCENE_DURATIONS.checkSellerOrders +
  SCENE_DURATIONS.claimSellerEarnings +
  DURATIONS.outro;

const orderManagementDuration =
  DURATIONS.intro +
  3 * DURATIONS.chapterCard +
  SCENE_DURATIONS.checkBuyerOrders +
  SCENE_DURATIONS.checkSellerOrders +
  SCENE_DURATIONS.cancelBid +
  DURATIONS.outro;

const bridgeTutorialDuration =
  DURATIONS.intro +
  DURATIONS.chapterCard +
  SCENE_DURATIONS.bridgeFunds +
  DURATIONS.outro;

const nftTutorialDuration =
  DURATIONS.intro +
  3 * DURATIONS.chapterCard +
  SCENE_DURATIONS.mintNFT +
  SCENE_DURATIONS.bridgeNFT +
  SCENE_DURATIONS.gallery +
  DURATIONS.outro;

const dashboardTutorialDuration =
  DURATIONS.intro +
  SCENE_DURATIONS.dashboard +
  DURATIONS.outro;

export const RemotionRoot: React.FC = () => {
  const shared = { fps: FPS, width: WIDTH, height: HEIGHT };

  return (
    <>
      {/* ─── Full Tutorials ─── */}
      <Folder name="Tutorials">
        <Composition
          id="FullTutorial"
          component={FullTutorial}
          durationInFrames={fullTutorialDuration}
          {...shared}
        />
        <Composition
          id="BuyerJourney"
          component={BuyerJourneyTutorial}
          durationInFrames={buyerJourneyDuration}
          {...shared}
        />
        <Composition
          id="SellerJourney"
          component={SellerJourneyTutorial}
          durationInFrames={sellerJourneyDuration}
          {...shared}
        />
        <Composition
          id="OrderManagement"
          component={OrderManagementTutorial}
          durationInFrames={orderManagementDuration}
          {...shared}
        />
        <Composition
          id="BridgeTutorial"
          component={BridgeTutorial}
          durationInFrames={bridgeTutorialDuration}
          {...shared}
        />
        <Composition
          id="NFTTutorial"
          component={NFTTutorial}
          durationInFrames={nftTutorialDuration}
          {...shared}
        />
        <Composition
          id="DashboardTutorial"
          component={DashboardTutorial}
          durationInFrames={dashboardTutorialDuration}
          {...shared}
        />
      </Folder>

      {/* ─── Individual Scenes ─── */}
      <Folder name="Scenes">
        <Folder name="Wallet">
          <Composition id="ConnectWallet" component={ConnectWalletScene} durationInFrames={SCENE_DURATIONS.connectWallet} {...shared} />
        </Folder>
        <Folder name="Bridge">
          <Composition id="BridgeFunds" component={BridgeFundsScene} durationInFrames={SCENE_DURATIONS.bridgeFunds} {...shared} />
        </Folder>
        <Folder name="Buy">
          <Composition id="BidOnEnergy" component={BidOnEnergyScene} durationInFrames={SCENE_DURATIONS.bidOnEnergy} {...shared} />
        </Folder>
        <Folder name="Sell">
          <Composition id="SellEnergy" component={SellEnergyScene} durationInFrames={SCENE_DURATIONS.sellEnergy} {...shared} />
        </Folder>
        <Folder name="Orders">
          <Composition id="CheckBuyerOrders" component={CheckBuyerOrdersScene} durationInFrames={SCENE_DURATIONS.checkBuyerOrders} {...shared} />
          <Composition id="CheckSellerOrders" component={CheckSellerOrdersScene} durationInFrames={SCENE_DURATIONS.checkSellerOrders} {...shared} />
          <Composition id="CancelBid" component={CancelBidScene} durationInFrames={SCENE_DURATIONS.cancelBid} {...shared} />
        </Folder>
        <Folder name="Claim">
          <Composition id="ClaimBuyerRefund" component={ClaimBuyerRefundScene} durationInFrames={SCENE_DURATIONS.claimBuyerRefund} {...shared} />
          <Composition id="ClaimSellerEarnings" component={ClaimSellerEarningsScene} durationInFrames={SCENE_DURATIONS.claimSellerEarnings} {...shared} />
        </Folder>
        <Folder name="NFT">
          <Composition id="MintNFT" component={MintNFTScene} durationInFrames={SCENE_DURATIONS.mintNFT} {...shared} />
          <Composition id="BridgeNFT" component={BridgeNFTScene} durationInFrames={SCENE_DURATIONS.bridgeNFT} {...shared} />
          <Composition id="Gallery" component={GalleryScene} durationInFrames={SCENE_DURATIONS.gallery} {...shared} />
        </Folder>
        <Folder name="Dashboard">
          <Composition id="Dashboard" component={DashboardScene} durationInFrames={SCENE_DURATIONS.dashboard} {...shared} />
        </Folder>
      </Folder>

      {/* ─── Reusable Components Preview ─── */}
      <Folder name="Components">
        <Composition
          id="IntroCard"
          component={IntroCard}
          durationInFrames={DURATIONS.intro}
          {...shared}
        />
        <Composition
          id="OutroCard"
          component={OutroCard}
          durationInFrames={DURATIONS.outro}
          {...shared}
        />
        <Composition
          id="ChapterCardPreview"
          component={() => <ChapterCard chapter={1} title="Sample Chapter" description="This is a preview" />}
          durationInFrames={DURATIONS.chapterCard}
          {...shared}
        />
      </Folder>
    </>
  );
};
