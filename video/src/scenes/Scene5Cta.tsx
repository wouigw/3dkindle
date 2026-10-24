import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BackgroundOrbs } from "../components";
import type { BaseSceneProps } from "../types/scene";
import { Corner, PAPER } from "../components/Corner";
import { fadeIn, slideIn } from "../utils/animations";

export const Scene5Cta: React.FC<BaseSceneProps> = ({ monoFontFamily, serifFontFamily }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame: frame - 6, fps, config: { damping: 200, mass: 0.8 } });
  const cardScale = interpolate(enter, [0, 1], [0.93, 1]);
  const cardY = interpolate(enter, [0, 1], [40, 0]);
  const cardRotate = interpolate(enter, [0, 1], [-7.5, -3]);

  const labelOpacity = fadeIn(frame, 0.2 * fps, 0.8 * fps);
  const titleOpacity = fadeIn(frame, 0.3 * fps, 0.95 * fps);
  const titleY = slideIn(frame, 0.3 * fps, 1.05 * fps, 22);
  const bodyOpacity = fadeIn(frame, 0.65 * fps, 1.3 * fps);
  const cmdOpacity = fadeIn(frame, 1.15 * fps, 1.8 * fps);
  const cmdX = slideIn(frame, 1.15 * fps, 1.85 * fps, 18);
  const repoOpacity = fadeIn(frame, 2.5 * fps, 3.15 * fps);
  const repoX = slideIn(frame, 2.5 * fps, 3.2 * fps, 16);
  const readyOpacity = fadeIn(frame, 3.2 * fps, 3.8 * fps);

  return (
    <AbsoluteFill style={{ background: "#08080a", overflow: "hidden" }}>
      <BackgroundOrbs
        orbs={[
          {
            widthClass: "w-[700px]",
            heightClass: "h-[700px]",
            colorClass: "bg-[#332e24]",
            position: { bottom: "-26%", right: "4%" },
            blur: 170,
            opacity: 0.55,
          },
        ]}
      />

      <div
        style={{
          position: "absolute",
          left: 118,
          top: "50%",
          transform: "translateY(-54%)",
          width: 660,
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
          05 — OPEN IT
        </div>

        <h2
          style={{
            margin: 0,
            fontFamily: serifFontFamily,
            fontWeight: 500,
            fontSize: 74,
            lineHeight: 1.22,
            letterSpacing: "0.02em",
            color: PAPER,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          打开，就有一台
          <br />
          Kindle
        </h2>

        <p
          style={{
            marginTop: 30,
            marginBottom: 0,
            fontFamily: serifFontFamily,
            fontSize: 21,
            lineHeight: 1.9,
            color: "rgba(242,239,230,0.55)",
            opacity: bodyOpacity,
          }}
        >
          没有构建步骤，不需要安装依赖，也不用登录。
          <br />
          一个 index.html，加一个本地静态服务器就够了。
        </p>

        <div
          style={{
            marginTop: 40,
            opacity: cmdOpacity,
            transform: `translateX(${cmdX}px)`,
            display: "inline-flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "16px 24px",
              border: "1px solid rgba(242,239,230,0.16)",
              background: "rgba(242,239,230,0.03)",
              fontFamily: monoFontFamily,
              fontSize: 17,
              letterSpacing: "0.02em",
              color: "rgba(242,239,230,0.86)",
            }}
          >
            <span style={{ color: "rgba(217,201,166,0.8)" }}>$</span>
            python -m http.server 8000
          </div>
          <div
            style={{
              fontFamily: monoFontFamily,
              fontSize: 11,
              letterSpacing: "0.2em",
              color: "rgba(242,239,230,0.32)",
              paddingLeft: 2,
            }}
          >
            OR DOUBLE-CLICK INDEX.HTML
          </div>
        </div>

        <div
          style={{
            marginTop: 44,
            display: "flex",
            alignItems: "center",
            gap: 18,
            opacity: fadeIn(frame, 2.4 * fps, 3.0 * fps),
            fontFamily: serifFontFamily,
            fontSize: 19,
            color: "rgba(242,239,230,0.42)",
          }}
        >
          <span>离线运行</span>
          <span style={{ color: "rgba(242,239,230,0.16)" }}>·</span>
          <span>无账号</span>
          <span style={{ color: "rgba(242,239,230,0.16)" }}>·</span>
          <span>数据只在本机</span>
        </div>

        <div
          style={{
            marginTop: 38,
            opacity: repoOpacity,
            transform: `translateX(${repoX}px)`,
          }}
        >
          <div
            style={{
              fontFamily: monoFontFamily,
              fontSize: 11,
              letterSpacing: "0.32em",
              color: "rgba(242,239,230,0.34)",
              marginBottom: 12,
            }}
          >
            SOURCE
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 9,
              fontFamily: monoFontFamily,
              fontSize: 20,
              letterSpacing: "0.01em",
              color: "rgba(217,201,166,0.96)",
            }}
          >
            <span style={{ width: 30, height: 1, background: "rgba(217,201,166,0.5)", alignSelf: "center" }} />
            github.com/wouigw/3dkindle
          </div>
        </div>
      </div>

      {/* device card with the real screen capture */}
      <div
        style={{
          position: "absolute",
          right: 172,
          top: "50%",
          transform: `translateY(-50%) translateY(${cardY}px) scale(${cardScale}) rotate(${cardRotate}deg)`,
          transformOrigin: "center",
          opacity: enter,
        }}
      >
        <div
          style={{
            padding: 15,
            borderRadius: 20,
            background: "linear-gradient(155deg, #1b1b1e 0%, #0d0d0f 55%, #17171a 100%)",
            boxShadow:
              "0 60px 120px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.09)",
          }}
        >
          <div style={{ position: "relative", width: 456, height: 623, borderRadius: 5, overflow: "hidden" }}>
            <Img
              src={staticFile("footage/library-screen.png")}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {/* glass sheen */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(122deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.03) 28%, rgba(255,255,255,0) 46%, rgba(255,255,255,0.05) 100%)",
                mixBlendMode: "screen",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "radial-gradient(120% 80% at 50% 40%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.22) 100%)",
              }}
            />
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            right: -18,
            bottom: 38,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 18px",
            borderRadius: 999,
            background: "rgba(10,10,12,0.86)",
            border: "1px solid rgba(242,239,230,0.18)",
            fontFamily: monoFontFamily,
            fontSize: 11,
            letterSpacing: "0.24em",
            color: "rgba(242,239,230,0.72)",
            opacity: readyOpacity,
            boxShadow: "0 12px 30px rgba(0,0,0,0.5)",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              background: "#d9c9a6",
              boxShadow: "0 0 12px rgba(217,201,166,0.9)",
            }}
          />
          已就绪
        </div>
      </div>

      <Corner index="05" label="Open it" monoFontFamily={monoFontFamily} />
    </AbsoluteFill>
  );
};
