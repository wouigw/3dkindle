import React from "react";
import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { BaseSceneProps } from "../types/scene";
import { Corner, PAPER } from "../components/Corner";
import { fadeIn, slideIn } from "../utils/animations";

const POINTS = [
  ["拖动旋转", "滚轮缩放，空白处拖拽"],
  ["墨水屏材质", "纸感 · 颗粒 · 视角暗化"],
  ["前光灯", "亮度与色温真实照亮机身"],
];

export const Scene2Device: React.FC<BaseSceneProps> = ({ monoFontFamily, serifFontFamily }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelOpacity = fadeIn(frame, 0.2 * fps, 0.8 * fps);
  const titleOpacity = fadeIn(frame, 0.35 * fps, 1.0 * fps);
  const titleY = slideIn(frame, 0.35 * fps, 1.05 * fps, 26);
  const bodyOpacity = fadeIn(frame, 0.7 * fps, 1.3 * fps);

  const zoom = interpolate(frame, [0, 6.5 * fps], [1.0, 1.035], {
    extrapolateRight: "clamp",
  });
  const driftX = interpolate(frame, [0, 6.5 * fps], [0, -10], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: "#08080a", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${zoom}) translateX(${driftX}px)` }}>
        <OffthreadVideo
          src={staticFile("footage/rotate.mp4")}
          trimBefore={450}
          trimAfter={744}
          playbackRate={1.5}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>

      {/* left scrim */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(8,8,10,0.97) 0%, rgba(8,8,10,0.9) 26%, rgba(8,8,10,0.4) 48%, rgba(8,8,10,0) 64%)",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(8,8,10,0.55) 0%, rgba(8,8,10,0) 22%, rgba(8,8,10,0) 74%, rgba(8,8,10,0.6) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 118,
          top: "50%",
          transform: "translateY(-50%)",
          width: 620,
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
          01 — DEVICE
        </div>

        <h2
          style={{
            margin: 0,
            fontFamily: serifFontFamily,
            fontWeight: 500,
            fontSize: 78,
            lineHeight: 1.16,
            letterSpacing: "0.02em",
            color: PAPER,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          真机质感
          <br />
          实时渲染
        </h2>

        <p
          style={{
            marginTop: 34,
            marginBottom: 0,
            fontFamily: serifFontFamily,
            fontSize: 23,
            lineHeight: 1.85,
            color: "rgba(242,239,230,0.6)",
            opacity: bodyOpacity,
            maxWidth: 520,
          }}
        >
          磨砂黑机身、倒角高光、玻璃层反光，
          <br />
          全部由 Three.js 在浏览器里逐帧计算。
        </p>

        <div style={{ marginTop: 46, display: "flex", flexDirection: "column", gap: 20 }}>
          {POINTS.map(([title, desc], i) => {
            const o = fadeIn(frame, (1.15 + i * 0.16) * fps, (1.65 + i * 0.16) * fps);
            const x = slideIn(frame, (1.15 + i * 0.16) * fps, (1.75 + i * 0.16) * fps, -16);
            return (
              <div
                key={title}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  opacity: o,
                  transform: `translateX(${x}px)`,
                }}
              >
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: 3,
                    background: "#d9c9a6",
                    opacity: 0.8,
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    fontFamily: serifFontFamily,
                    fontSize: 21,
                    color: "rgba(242,239,230,0.82)",
                    width: 132,
                  }}
                >
                  {title}
                </div>
                <div
                  style={{
                    fontFamily: monoFontFamily,
                    fontSize: 13,
                    letterSpacing: "0.08em",
                    color: "rgba(242,239,230,0.34)",
                  }}
                >
                  {desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 66,
          top: 62,
          fontFamily: monoFontFamily,
          fontSize: 11,
          letterSpacing: "0.3em",
          color: "rgba(242,239,230,0.26)",
          opacity: fadeIn(frame, 1.4 * fps, 2 * fps),
        }}
      >
        REAL-TIME · WEBGL
      </div>

      <Corner index="02" label="Device" monoFontFamily={monoFontFamily} />
    </AbsoluteFill>
  );
};
