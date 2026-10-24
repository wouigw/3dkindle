import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BackgroundOrbs } from "../components";
import type { BaseSceneProps } from "../types/scene";
import { Corner, PAPER, Rule } from "../components/Corner";

const orbs = [
  {
    widthClass: "w-[760px]",
    heightClass: "h-[760px]",
    colorClass: "bg-[#3a3325]",
    position: { top: "-22%", left: "-14%" },
    blur: 150,
    opacity: 0.5,
  },
  {
    widthClass: "w-[620px]",
    heightClass: "h-[620px]",
    colorClass: "bg-[#1d2027]",
    position: { bottom: "-24%", right: "-10%" },
    blur: 150,
    opacity: 0.65,
  },
];

export const Scene1Intro: React.FC<BaseSceneProps> = ({ monoFontFamily, serifFontFamily }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelOpacity = interpolate(frame, [0.15 * fps, 0.7 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const mark = spring({ frame: frame - 4, fps, config: { damping: 200, mass: 0.7 } });
  const markScale = interpolate(mark, [0, 1], [0.94, 1]);
  const markY = interpolate(mark, [0, 1], [18, 0]);
  const glow = interpolate(frame, [0, 1.4 * fps, 3.4 * fps], [0.15, 1, 0.62], {
    extrapolateRight: "clamp",
  });

  const subOpacity = interpolate(frame, [0.75 * fps, 1.35 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subTrack = interpolate(frame, [0.75 * fps, 1.5 * fps], [0.5, 0.3], {
    extrapolateRight: "clamp",
  });

  const ruleProgress = interpolate(frame, [1.0 * fps, 1.75 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tagOpacity = interpolate(frame, [1.45 * fps, 2.05 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tagY = interpolate(frame, [1.45 * fps, 2.05 * fps], [10, 0], {
    extrapolateRight: "clamp",
  });

  const metaOpacity = interpolate(frame, [2.0 * fps, 2.6 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const drift = interpolate(frame, [0, 4.5 * fps], [0, -8], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#08080a", overflow: "hidden" }}>
      <BackgroundOrbs orbs={orbs} />

      {/* soft paper glow behind the wordmark */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "48%",
          width: 980,
          height: 560,
          transform: "translate(-50%,-50%)",
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(242,239,230,0.1) 0%, rgba(242,239,230,0.03) 42%, rgba(242,239,230,0) 72%)",
          filter: "blur(18px)",
          opacity: mark * 0.9,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateY(${drift}px)`,
        }}
      >
        <div
          style={{
            fontFamily: monoFontFamily,
            fontSize: 12,
            letterSpacing: "0.42em",
            color: "rgba(242,239,230,0.4)",
            opacity: labelOpacity,
            marginBottom: 42,
            textTransform: "uppercase",
          }}
        >
          Open source · 2026
        </div>

        <div
          style={{
            fontFamily: serifFontFamily,
            fontWeight: 300,
            fontSize: 196,
            lineHeight: 0.9,
            letterSpacing: "-0.035em",
            color: PAPER,
            opacity: mark,
            transform: `scale(${markScale}) translateY(${markY}px)`,
            textShadow: `0 0 90px rgba(217,201,166,${0.34 * glow}), 0 0 200px rgba(217,201,166,${0.16 * glow})`,
          }}
        >
          kindle
        </div>

        <div
          style={{
            marginTop: 34,
            fontFamily: serifFontFamily,
            fontSize: 30,
            fontWeight: 400,
            letterSpacing: `${subTrack}em`,
            color: "rgba(242,239,230,0.8)",
            opacity: subOpacity,
            textIndent: `${subTrack}em`,
          }}
        >
          3D 墨水屏阅读器
        </div>

        <div style={{ marginTop: 46, marginBottom: 44 }}>
          <Rule width={340} progress={ruleProgress} />
        </div>

        <div
          style={{
            fontFamily: serifFontFamily,
            fontSize: 27,
            color: "rgba(242,239,230,0.66)",
            opacity: tagOpacity,
            transform: `translateY(${tagY}px)`,
            letterSpacing: "0.06em",
          }}
        >
          一台跑在浏览器里的 Kindle
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 150,
            fontFamily: monoFontFamily,
            fontSize: 12,
            letterSpacing: "0.24em",
            color: "rgba(242,239,230,0.3)",
            opacity: metaOpacity,
          }}
        >
          THREE.JS r158 · CANVAS 2D · NO SERVER · NO ACCOUNT
        </div>
      </div>

      <Corner index="01" label="Origin" monoFontFamily={monoFontFamily} opacity={metaOpacity} />
    </AbsoluteFill>
  );
};
