import React from "react";
import { AbsoluteFill, Img, staticFile, useVideoConfig } from "remotion";
import type { BaseSceneProps } from "../types/scene";

const PAPER = "#f2efe6";
const ACCENT = "#d9c9a6";
const INK = "#08080a";

type Format = "wide" | "square" | "vertical";
export type CoverProps = BaseSceneProps & { format: Format };

const LAYOUT = {
  wide: {
    imgScale: 1.32,
    cx: 1576,
    cy: 556,
    text: { left: 112, top: 420, width: 1080, rotate: -2.4 },
    eyebrow: 22,
    line1: 158,
    line2: 124,
    sub: 26,
    stroke: 2.6,
    scrim: "linear-gradient(90deg, rgba(6,6,8,0.97) 0%, rgba(6,6,8,0.93) 26%, rgba(6,6,8,0.6) 46%, rgba(6,6,8,0) 64%)",
  },
  square: {
    imgScale: 1.28,
    cx: 1050,
    cy: 800,
    text: { left: 80, top: 84, width: 760, rotate: -2 },
    eyebrow: 18,
    line1: 88,
    line2: 78,
    sub: 21,
    stroke: 2,
    scrim: "linear-gradient(155deg, rgba(6,6,8,0.96) 0%, rgba(6,6,8,0.9) 34%, rgba(6,6,8,0.35) 56%, rgba(6,6,8,0) 72%)",
  },
  vertical: {
    imgScale: 1.48,
    cx: 540,
    cy: 1260,
    text: { left: 76, top: 176, width: 940, rotate: -1.5 },
    eyebrow: 20,
    line1: 112,
    line2: 100,
    sub: 24,
    stroke: 2.2,
    scrim: "linear-gradient(180deg, rgba(6,6,8,0.97) 0%, rgba(6,6,8,0.92) 26%, rgba(6,6,8,0.45) 42%, rgba(6,6,8,0) 56%)",
  },
} as const;

const Grain: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, opacity: 0.05, pointerEvents: "none" }}>
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <filter id="cover-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves={3} stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter="url(#cover-grain)" />
    </svg>
  </div>
);

export const Cover: React.FC<CoverProps> = ({ format, fontFamily, serifFontFamily, monoFontFamily }) => {
  const L = LAYOUT[format];
  const { width: canvasW, height: canvasH } = useVideoConfig();
  const imgW = 1920 * L.imgScale;
  const imgH = imgW * (2160 / 3840);

  const titleStyle: React.CSSProperties = {
    fontFamily,
    fontWeight: 900,
    color: PAPER,
    letterSpacing: "-0.01em",
    lineHeight: 1.04,
    WebkitTextStroke: `${L.stroke}px rgba(217,201,166,0.55)`,
    textShadow: "0 20px 48px rgba(0,0,0,0.7)",
  };

  return (
    <AbsoluteFill style={{ background: INK, overflow: "hidden" }}>
      <Img
        src={staticFile("cover/frame.png")}
        style={{
          position: "absolute",
          width: imgW,
          height: imgH,
          maxWidth: "none",
          maxHeight: "none",
          left: L.cx - imgW / 2,
          top: L.cy - imgH * 0.5056,
        }}
      />

      <AbsoluteFill
        style={{
          background: `radial-gradient(46% 42% at ${(L.cx / canvasW) * 100}% ${(L.cy / canvasH) * 100}%, rgba(217,201,166,0.09) 0%, rgba(217,201,166,0) 70%)`,
        }}
      />

      <AbsoluteFill style={{ background: L.scrim }} />
      <AbsoluteFill
        style={{
          background: "radial-gradient(120% 90% at 55% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: L.text.left,
          top: L.text.top,
          width: L.text.width,
          transform: `rotate(${L.text.rotate}deg)`,
          transformOrigin: "left top",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: format === "wide" ? 34 : 26,
            fontFamily: monoFontFamily,
            fontSize: L.eyebrow,
            letterSpacing: "0.34em",
            color: "rgba(217,201,166,0.85)",
          }}
        >
          <span style={{ width: 44, height: 2, background: "rgba(217,201,166,0.55)" }} />
          3D E-INK READER
        </div>

        <div style={{ ...titleStyle, fontSize: L.line1, whiteSpace: "nowrap" }}>
          Kindle 吃灰了<span style={{ color: "rgba(217,201,166,0.55)" }}>，</span>
        </div>

        {format === "square" ? (
          <>
            <div style={{ ...titleStyle, fontSize: L.line2, marginTop: 10, whiteSpace: "nowrap" }}>
              我把它搬进
            </div>
            <div style={{ marginTop: 12 }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "2px 16px 10px",
                  background: PAPER,
                  color: "#0a0a0c",
                  fontSize: 96,
                  fontFamily: fontFamily,
                  fontWeight: 900,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.1,
                  transform: "rotate(-1.4deg)",
                  boxShadow: "0 18px 44px rgba(0,0,0,0.55)",
                }}
              >
                浏览器
              </span>
            </div>
          </>
        ) : (
          <div
            style={{
              ...titleStyle,
              fontSize: L.line2,
              marginTop: format === "wide" ? 16 : 12,
              whiteSpace: "nowrap",
            }}
          >
            我把它搬进
            <span
              style={{
                display: "inline-block",
                marginLeft: 12,
                padding: format === "wide" ? "2px 20px 10px" : "1px 15px 8px",
                background: PAPER,
                color: "#0a0a0c",
                transform: "rotate(-1.4deg)",
                boxShadow: "0 18px 44px rgba(0,0,0,0.55)",
                WebkitTextStroke: "0",
                textShadow: "none",
              }}
            >
              浏览器
            </span>
          </div>
        )}

        <div
          style={{
            marginTop: format === "wide" ? 52 : 34,
            fontFamily,
            fontWeight: 400,
            fontSize: L.sub,
            lineHeight: 1.85,
            letterSpacing: "0.04em",
            color: "rgba(242,239,230,0.55)",
          }}
        >
          {format === "vertical" ? (
            <>
              Three.js 实时渲染 · 无后端
              <br />
              无账号 · 离线可用
            </>
          ) : (
            "Three.js 实时渲染 · 无后端 · 无账号 · 离线可用"
          )}
        </div>
      </div>

      <Grain />
    </AbsoluteFill>
  );
};
