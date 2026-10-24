import React from "react";
import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { BaseSceneProps } from "../types/scene";
import { Corner, PAPER } from "../components/Corner";
import { fadeIn, slideIn } from "../utils/animations";

const FEATURES = [
  ["01", "书库", "导入 · 排序 · 阅读进度"],
  ["02", "目录", "章节自动识别"],
  ["03", "排版", "字号 · 行距 · 主题"],
  ["04", "书签", "跨书汇总"],
];

const CROSS = 129; // 4.3s

export const Scene3Interface: React.FC<BaseSceneProps> = ({ monoFontFamily, serifFontFamily }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoomA = interpolate(frame, [0, 9.5 * fps], [1.0, 1.02], { extrapolateRight: "clamp" });

  const crossOpacity = interpolate(frame, [CROSS, CROSS + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const aFade = interpolate(frame, [CROSS + 6, CROSS + 22], [1, 0.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelOpacity = fadeIn(frame, 0.2 * fps, 0.75 * fps);
  const titleOpacity = fadeIn(frame, 0.35 * fps, 1.0 * fps);
  const titleY = slideIn(frame, 0.35 * fps, 1.05 * fps, 24);
  const bodyOpacity = fadeIn(frame, 0.75 * fps, 1.35 * fps);

  const capA = interpolate(frame, [0.9 * fps, 1.4 * fps, 4.0 * fps, 4.3 * fps], [0, 1, 1, 0], {
    extrapolateRight: "clamp",
  });
  const capB = fadeIn(frame, 4.5 * fps, 5.0 * fps);

  return (
    <AbsoluteFill style={{ background: "#08080a", overflow: "hidden" }}>
      <AbsoluteFill style={{ opacity: aFade, transform: `scale(${zoomA})` }}>
        <OffthreadVideo
          src={staticFile("footage/reading.mp4")}
          trimBefore={276}
          trimAfter={420}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      <Sequence from={CROSS} durationInFrames={285 - CROSS}>
        <AbsoluteFill style={{ opacity: crossOpacity, transform: "scale(1.015)" }}>
          <OffthreadVideo
            src={staticFile("footage/reading.mp4")}
            trimBefore={534}
            trimAfter={690}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* left scrim for the copy */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(8,8,10,0.98) 0%, rgba(8,8,10,0.94) 28%, rgba(8,8,10,0.62) 42%, rgba(8,8,10,0) 56%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(8,8,10,0.5) 0%, rgba(8,8,10,0) 20%, rgba(8,8,10,0) 78%, rgba(8,8,10,0.55) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 108,
          top: "50%",
          transform: "translateY(-50%)",
          width: 486,
        }}
      >
        <div
          style={{
            fontFamily: monoFontFamily,
            fontSize: 12,
            letterSpacing: "0.36em",
            color: "rgba(217,201,166,0.9)",
            opacity: labelOpacity,
            marginBottom: 30,
          }}
        >
          02 — INTERFACE
        </div>

        <h2
          style={{
            margin: 0,
            fontFamily: serifFontFamily,
            fontWeight: 500,
            fontSize: 52,
            lineHeight: 1.42,
            letterSpacing: "0.01em",
            color: PAPER,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          屏幕里不是视频，
          <br />
          是一套能用的软件
        </h2>

        <p
          style={{
            marginTop: 30,
            marginBottom: 0,
            fontFamily: serifFontFamily,
            fontSize: 19,
            lineHeight: 1.9,
            color: "rgba(242,239,230,0.55)",
            opacity: bodyOpacity,
            maxWidth: 470,
          }}
        >
          界面用 Canvas 2D 画完，再作为贴图交给 Three.js。
          <br />
          你看到的是这块墨水屏，也是它真正的界面。
        </p>

        <div style={{ marginTop: 44, opacity: bodyOpacity }}>
          {FEATURES.map(([idx, name, desc], i) => {
            const o = fadeIn(frame, (1.2 + i * 0.14) * fps, (1.7 + i * 0.14) * fps);
            const x = slideIn(frame, (1.2 + i * 0.14) * fps, (1.8 + i * 0.14) * fps, -14);
            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 18,
                  padding: "13px 0",
                  borderTop: "1px solid rgba(242,239,230,0.09)",
                  opacity: o,
                  transform: `translateX(${x}px)`,
                }}
              >
                <span
                  style={{
                    fontFamily: monoFontFamily,
                    fontSize: 10,
                    letterSpacing: "0.16em",
                    color: "rgba(217,201,166,0.55)",
                    width: 26,
                  }}
                >
                  {idx}
                </span>
                <span
                  style={{
                    fontFamily: serifFontFamily,
                    fontSize: 20,
                    color: "rgba(242,239,230,0.9)",
                    width: 88,
                  }}
                >
                  {name}
                </span>
                <span
                  style={{
                    fontFamily: serifFontFamily,
                    fontSize: 16,
                    color: "rgba(242,239,230,0.38)",
                  }}
                >
                  {desc}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ position: "relative", height: 20, marginTop: 20 }}>
          <div
            style={{
              position: "absolute",
              fontFamily: monoFontFamily,
              fontSize: 11,
              letterSpacing: "0.22em",
              color: "rgba(242,239,230,0.3)",
              opacity: capA,
            }}
          >
            READING · PAGE TURN
          </div>
          <div
            style={{
              position: "absolute",
              fontFamily: monoFontFamily,
              fontSize: 11,
              letterSpacing: "0.22em",
              color: "rgba(242,239,230,0.3)",
              opacity: capB,
            }}
          >
            TYPOGRAPHY · THEME
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 58,
          top: "50%",
          transform: "translateY(-50%) rotate(90deg)",
          transformOrigin: "center",
          fontFamily: monoFontFamily,
          fontSize: 10,
          letterSpacing: "0.4em",
          color: "rgba(242,239,230,0.2)",
          opacity: fadeIn(frame, 1.6 * fps, 2.2 * fps),
        }}
      >
        LIVE UI · CANVAS 2D
      </div>

      <Corner index="03" label="Interface" monoFontFamily={monoFontFamily} />
    </AbsoluteFill>
  );
};
