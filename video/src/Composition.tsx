import React from "react";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { z } from "zod";
import { Scene1Intro } from "./scenes/Scene1Intro";
import { Scene2Device } from "./scenes/Scene2Device";
import { Scene3Interface } from "./scenes/Scene3Interface";
import { Scene4Numbers } from "./scenes/Scene4Numbers";
import { Scene5Cta } from "./scenes/Scene5Cta";

export const CompositionSchema = z.object({
  fontFamily: z.string().describe("Sans-serif family"),
  serifFontFamily: z.string().describe("Serif family"),
  monoFontFamily: z.string().describe("Monospace family"),
});

export type CompositionProps = z.infer<typeof CompositionSchema>;

export const SCENE_DURATIONS = {
  intro: 135,
  device: 195,
  interface: 285,
  numbers: 165,
  cta: 200,
};

const TRANSITION_DURATION = 15;

const Grain: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.05, zIndex: 40 }}>
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves={3} stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  </div>
);

const Vignette: React.FC = () => (
  <div
    className="absolute inset-0 pointer-events-none"
    style={{
      zIndex: 39,
      background:
        "radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.45) 100%)",
    }}
  />
);

export const MyComposition: React.FC<CompositionProps> = ({
  fontFamily,
  serifFontFamily,
  monoFontFamily,
}) => {
  const frame = useCurrentFrame();
  const total = TOTAL_DURATION;
  const timing = linearTiming({ durationInFrames: TRANSITION_DURATION });

  const fadeIn = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [total - 20, total], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#08080a", fontFamily }}>
      <Audio
        src={staticFile("audio/bgm.mp3")}
        trimBefore={30 * 8}
        volume={(f) =>
          interpolate(f, [0, 24, total - 45, total], [0, 0.3, 0.3, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />

      <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>
        <TransitionSeries>
          <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.intro}>
            <Scene1Intro serifFontFamily={serifFontFamily} monoFontFamily={monoFontFamily} />
          </TransitionSeries.Sequence>

          <TransitionSeries.Transition presentation={fade()} timing={timing} />

          <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.device}>
            <Scene2Device serifFontFamily={serifFontFamily} monoFontFamily={monoFontFamily} />
          </TransitionSeries.Sequence>

          <TransitionSeries.Transition presentation={fade()} timing={timing} />

          <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.interface}>
            <Scene3Interface serifFontFamily={serifFontFamily} monoFontFamily={monoFontFamily} />
          </TransitionSeries.Sequence>

          <TransitionSeries.Transition presentation={fade()} timing={timing} />

          <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.numbers}>
            <Scene4Numbers serifFontFamily={serifFontFamily} monoFontFamily={monoFontFamily} />
          </TransitionSeries.Sequence>

          <TransitionSeries.Transition presentation={fade()} timing={timing} />

          <TransitionSeries.Sequence durationInFrames={SCENE_DURATIONS.cta}>
            <Scene5Cta serifFontFamily={serifFontFamily} monoFontFamily={monoFontFamily} />
          </TransitionSeries.Sequence>
        </TransitionSeries>
      </AbsoluteFill>

      <Vignette />
      <Grain />
    </AbsoluteFill>
  );
};

export const TOTAL_DURATION =
  SCENE_DURATIONS.intro +
  SCENE_DURATIONS.device +
  SCENE_DURATIONS.interface +
  SCENE_DURATIONS.numbers +
  SCENE_DURATIONS.cta -
  4 * TRANSITION_DURATION;
