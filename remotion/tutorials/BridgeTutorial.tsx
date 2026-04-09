import React from "react";
import { Series } from "remotion";
import { IntroCard } from "../components/IntroCard";
import { ChapterCard } from "../components/ChapterCard";
import { OutroCard } from "../components/OutroCard";
import { BridgeFundsScene } from "../scenes/bridge/BridgeFundsScene";
import { SCENE_DURATIONS, DURATIONS } from "../lib/timing";

export const BridgeTutorial: React.FC = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={DURATIONS.intro}>
        <IntroCard title="COMMUNITAS" subtitle="Bridge Funds Tutorial" />
      </Series.Sequence>

      <Series.Sequence durationInFrames={DURATIONS.chapterCard}>
        <ChapterCard chapter={1} title="Bridge ETH to L2" description="Transfer funds from Optimism to Nova Cidade" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_DURATIONS.bridgeFunds}>
        <BridgeFundsScene />
      </Series.Sequence>

      <Series.Sequence durationInFrames={DURATIONS.outro}>
        <OutroCard />
      </Series.Sequence>
    </Series>
  );
};
