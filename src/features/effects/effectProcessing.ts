import type { EffectInstance } from "../project/projectTypes";
import { getBrightnessFilter } from "./processors/brightnessEffect";
import { getColorAdjustFilter } from "./processors/colorAdjustEffect";
import { getContrastFilter } from "./processors/contrastEffect";
import { getFlipFilter } from "./processors/flipEffect";
import { getGrayscaleFilter } from "./processors/grayscaleEffect";
import { getSepiaFilter } from "./processors/sepiaEffect";
import { getTransparencyFilter } from "./processors/transparencyEffect";

export const getEffectFilter = (effect: EffectInstance) => {
  switch (effect.name) {
    case "brightness": return getBrightnessFilter(effect.values.brightness ?? 100);
    case "contrast": return getContrastFilter(effect.values.contrast ?? 100);
    case "grayscale": return getGrayscaleFilter(effect.values.grayscale ?? 0);
    case "sepia": return getSepiaFilter(effect.values.sepia ?? 0);
    case "colorAdjust": return getColorAdjustFilter(effect.values);
    case "transparency": return getTransparencyFilter();
    case "flip": return getFlipFilter(effect.values);
    default: return "";
  }
};

export const getEffectsFilter = (effects: EffectInstance[]) =>
  effects.map(getEffectFilter).filter(Boolean).join(" ") || "none";
