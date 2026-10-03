import React from "react";
import { Series } from "remotion";
import { IntroCard } from "../components/IntroCard";
import { OutroCard } from "../components/OutroCard";
import { DashboardScene } from "../scenes/dashboard/DashboardScene";
import { SCENE_DURATIONS, DURATIONS } from "../lib/timing";

export const DashboardTutorial: React.FC = () => {
  return (
    <Series>
      <Series.Sequence durationInFrames={DURATIONS.intro}>
        <IntroCard title="COMMUNITAS" subtitle="Dashboard Overview" />
      </Series.Sequence>

      <Series.Sequence durationInFrames={SCENE_DURATIONS.dashboard}>
        <DashboardScene />
      </Series.Sequence>

      <Series.Sequence durationInFrames={DURATIONS.outro}>
        <OutroCard />
      </Series.Sequence>
    </Series>
  );
};
