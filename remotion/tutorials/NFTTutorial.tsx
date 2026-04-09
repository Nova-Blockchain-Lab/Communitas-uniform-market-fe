import React from "react";
import { Series } from "remotion";
import { IntroCard } from "../components/IntroCard";
import { ChapterCard } from "../components/ChapterCard";
import { OutroCard } from "../components/OutroCard";
import { MintNFTScene } from "../scenes/nft/MintNFTScene";
import { BridgeNFTScene } from "../scenes/nft/BridgeNFTScene";
import { GalleryScene } from "../scenes/nft/GalleryScene";
import { SCENE_DURATIONS, DURATIONS } from "../lib/timing";

export const NFTTutorial: React.FC = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={DURATIONS.intro}>
        <IntroCard title="COMMUNITAS" subtitle="NFT Tutorial" />
      </Series.Sequence>

      <Series.Sequence durationInFrames={DURATIONS.chapterCard}>
        <ChapterCard chapter={1} title="Mint an NFT" description="Create your community membership token" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.mintNFT}>
        <MintNFTScene />
      </Series.Sequence>

      <Series.Sequence durationInFrames={DURATIONS.chapterCard}>
        <ChapterCard chapter={2} title="Bridge NFT" description="Transfer NFT between L1 and L2" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.bridgeNFT}>
        <BridgeNFTScene />
      </Series.Sequence>

      <Series.Sequence durationInFrames={DURATIONS.chapterCard}>
        <ChapterCard chapter={3} title="NFT Gallery" description="Browse your collection" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.gallery}>
        <GalleryScene />
      </Series.Sequence>

      <Series.Sequence durationInFrames={DURATIONS.outro}>
        <OutroCard />
      </Series.Sequence>
    </Series>
  );
};
