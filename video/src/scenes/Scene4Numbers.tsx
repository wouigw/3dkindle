import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { BackgroundOrbs } from "../components";
import type { BaseSceneProps } from "../types/scene";
import { Corner, PAPER, Rule } from "../components/Corner";
import { fadeIn, slideIn } from "../utils/animations";

const STATS: { value: number; suffix?: string; label: string; delay: number }[] = [
  { value: 0, label: "服务器与账号", delay: 0 },
  { value: 5, label: "内置样书", delay: 0.15 },
  { value: 3, label: "阅读主题", delay: 0.3 },
  { value: 3580, label: "行原生 JavaScript", delay: 0.45 },
];

const STACK = ["Three.js r158", "Canvas 2D", "IndexedDB", "localStorage", "Vanilla JS"];

export const Scene4Numbers: React.FC<BaseSceneProps> = ({ monoFontFamily, serifFontFamily }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const labelOpacity = fadeIn(frame, 0.1 * fps, 0.6 * fps);
  const titleOpacity = fadeIn(frame, 0.25 * fps, 0.9 * fps);
  const titleY = slideIn(frame, 0.25 * fps, 0.95 * fps, 22);
  const subOpacity = fadeIn(frame, 0.55 * fps, 1.15 * fps);

  const ruleProgress = interpolate(frame, [0.8 * fps, 1.5 * fps], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const stackOpacity = fadeIn(frame, 2.9 * fps, 3.5 * fps);

  return (
    <AbsoluteFill style={{ background: "#08080a", overflow: "hidden" }}>
      <BackgroundOrbs
        orbs={[
          {
            widthClass: "w-[720px]",
            heightClass: "h-[720px]",
            colorClass: "bg-[#2f2a20]",
            position: { top: "-30%", left: "26%" },
            blur: 160,
            opacity: 0.45,
          },
        ]}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 40,
        }}
      >
        <div
          style={{
            fontFamily: monoFontFamily,
            fontSize: 12,
            letterSpacing: "0.36em",
            color: "rgba(217,201,166,0.9)",
            opacity: labelOpacity,
            marginBottom: 28,
          }}
        >
          04 — BY THE NUMBERS
        </div>

        <h2
          style={{
            margin: 0,
            fontFamily: serifFontFamily,
            fontWeight: 500,
            fontSize: 68,
            letterSpacing: "0.03em",
            color: PAPER,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          没有后端，也没有账号
        </h2>

        <p
          style={{
            margin: "22px 0 0",
            fontFamily: serifFontFamily,
            fontSize: 22,
            letterSpacing: "0.04em",
            color: "rgba(242,239,230,0.5)",
            opacity: subOpacity,
          }}
        >
          一本书、一块屏幕，全部留在你的浏览器里
        </p>

        <div style={{ marginTop: 58, marginBottom: 54 }}>
          <Rule width={980} progress={ruleProgress} />
        </div>

        <div style={{ display: "flex", alignItems: "flex-start" }}>
          {STATS.map((s, i) => {
            const start = (1.0 + s.delay) * fps;
            const end = start + 1.3 * fps;
            const value = interpolate(frame, [start, end], [0, s.value], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.cubic),
            });
            const o = fadeIn(frame, start - 0.2 * fps, start + 0.25 * fps);
            const y = slideIn(frame, start - 0.2 * fps, start + 0.4 * fps, 18);
            const display = s.value >= 1000 ? Math.round(value).toLocaleString("en-US") : Math.round(value).toString();

            return (
              <React.Fragment key={s.label}>
                {i > 0 && (
                  <div
                    style={{
                      width: 1,
                      height: 150,
                      background: "rgba(242,239,230,0.1)",
                      margin: "10px 62px 0",
                      opacity: o,
                    }}
                  />
                )}
                <div
                  style={{
                    width: 250,
                    textAlign: "center",
                    opacity: o,
                    transform: `translateY(${y}px)`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: monoFontFamily,
                      fontSize: 108,
                      fontWeight: 400,
                      letterSpacing: "-0.04em",
                      color: PAPER,
                      lineHeight: 1,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {display}
                  </div>
                  <div
                    style={{
                      marginTop: 22,
                      fontFamily: serifFontFamily,
                      fontSize: 21,
                      letterSpacing: "0.08em",
                      color: "rgba(242,239,230,0.5)",
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 76,
            display: "flex",
            alignItems: "center",
            gap: 26,
            opacity: stackOpacity,
            fontFamily: monoFontFamily,
            fontSize: 12,
            letterSpacing: "0.18em",
            color: "rgba(242,239,230,0.34)",
          }}
        >
          {STACK.map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <span style={{ color: "rgba(242,239,230,0.16)" }}>·</span>}
              <span>{s}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      <Corner index="04" label="Numbers" monoFontFamily={monoFontFamily} />
    </AbsoluteFill>
  );
};
