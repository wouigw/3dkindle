import "./index.css";
import { Composition } from "remotion";
import { MyComposition, TOTAL_DURATION, CompositionSchema } from "./Composition";
import { Cover } from "./cover/Cover";
import { loadFont as loadSans } from "@remotion/google-fonts/NotoSansSC";
import { loadFont as loadSerif } from "@remotion/google-fonts/NotoSerifSC";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: sansFontFamily } = loadSans("normal", {
  weights: ["300", "400", "500", "700", "900"],
});
const { fontFamily: serifFontFamily } = loadSerif("normal", {
  weights: ["300", "400", "500", "600"],
});
const { fontFamily: monoFontFamily } = loadMono("normal", {
  weights: ["400", "500", "700"],
});

const coverProps = {
  fontFamily: sansFontFamily,
  serifFontFamily,
  monoFontFamily,
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="Kindle3DPromo"
      component={MyComposition}
      schema={CompositionSchema}
      durationInFrames={TOTAL_DURATION}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={coverProps}
    />

    <Composition
      id="CoverWide"
      component={Cover}
      durationInFrames={1}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ ...coverProps, format: "wide" as const }}
    />
    <Composition
      id="CoverSquare"
      component={Cover}
      durationInFrames={1}
      fps={30}
      width={1440}
      height={1080}
      defaultProps={{ ...coverProps, format: "square" as const }}
    />
    <Composition
      id="CoverVertical"
      component={Cover}
      durationInFrames={1}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ ...coverProps, format: "vertical" as const }}
    />
  </>
);

export { sansFontFamily, serifFontFamily, monoFontFamily };
