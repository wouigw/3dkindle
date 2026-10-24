import "./index.css";
import { Composition } from "remotion";
import { MyComposition, TOTAL_DURATION, CompositionSchema } from "./Composition";
import { loadFont as loadSans } from "@remotion/google-fonts/NotoSansSC";
import { loadFont as loadSerif } from "@remotion/google-fonts/NotoSerifSC";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: sansFontFamily } = loadSans("normal", {
  weights: ["300", "400", "500", "700"],
});
const { fontFamily: serifFontFamily } = loadSerif("normal", {
  weights: ["300", "400", "500", "600"],
});
const { fontFamily: monoFontFamily } = loadMono("normal", {
  weights: ["400", "500", "700"],
});

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Kindle3DPromo"
    component={MyComposition}
    schema={CompositionSchema}
    durationInFrames={TOTAL_DURATION}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{
      fontFamily: sansFontFamily,
      serifFontFamily,
      monoFontFamily,
    }}
  />
);

export { sansFontFamily, serifFontFamily, monoFontFamily };
