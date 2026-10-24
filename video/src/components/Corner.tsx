import React from "react";

export const PAPER = "#f2efe6";
export const MUTED = "rgba(242,239,230,0.55)";
export const FAINT = "rgba(242,239,230,0.32)";
export const ACCENT = "#d9c9a6";

/** Small scene index marker, bottom-left, like a printed plate number. */
export const Corner: React.FC<{
  index: string;
  label: string;
  monoFontFamily: string;
  opacity?: number;
}> = ({ index, label, monoFontFamily, opacity = 0.55 }) => (
  <div
    className="absolute pointer-events-none"
    style={{
      left: 72,
      bottom: 54,
      fontFamily: monoFontFamily,
      fontSize: 12,
      letterSpacing: "0.24em",
      color: `rgba(242,239,230,${0.34 * opacity})`,
      textTransform: "uppercase",
    }}
  >
    {index} / 05 — {label}
  </div>
);

/** Thin hairline that draws itself from the left. */
export const Rule: React.FC<{ width: number; progress: number; color?: string }> = ({
  width,
  progress,
  color = "rgba(242,239,230,0.22)",
}) => (
  <div style={{ width, height: 1, background: "rgba(255,255,255,0.06)" }}>
    <div style={{ width: width * progress, height: 1, background: color }} />
  </div>
);
