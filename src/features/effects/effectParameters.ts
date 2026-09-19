import type { EffectInstance } from "../project/projectTypes";

export type EffectParameters = {
  brightness: number;
  contrast: number;
  grayscale: number;
  sepia: number;
  hue: number;
  saturation: number;
  lightness: number;
  chromaKeyColor: string;
  chromaKeyTolerance: number;
  colorKeyColor: string;
  colorKeyTolerance: number;
  luminanceKey: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  invertLuminance: boolean;
  invertHue: boolean;
  invertAlpha: boolean;
  monochromeColor: string;
  monochromeStrength: number;
  gradientStartColor: string;
  gradientEndColor: string;
  gradientAngle: number;
  gradientStrength: number;
  glowColor: string;
  glowStrength: number;
  glowRadius: number;
  blurRadius: number;
  mosaicSize: number;
  mosaicStrength: number;
  clipTop: number;
  clipBottom: number;
  clipLeft: number;
  clipRight: number;
  diagonalClipAngle: number;
  maskShape: "circle" | "rectangle" | "ellipse";
  maskX: number;
  maskY: number;
  maskWidth: number;
  maskHeight: number;
  maskBlur: number;
  maskInvert: boolean;
  shadowColor: string;
  shadowOpacity: number;
  shadowDistance: number;
  shadowAngle: number;
  shadowBlur: number;
  outlineColor: string;
  outlineWidth: number;
  outlineOpacity: number;
  imageLoopX: number;
  imageLoopY: number;
  imageLoopOffsetX: number;
  imageLoopOffsetY: number;
  imageLoopMirror: boolean;
  imageLoopOpacity: number;
};

export const defaultEffectParameters: EffectParameters = {
  brightness: 100,
  contrast: 100,
  grayscale: 0,
  sepia: 0,
  hue: 0,
  saturation: 100,
  lightness: 100,
  chromaKeyColor: "#00ff00",
  chromaKeyTolerance: 30,
  colorKeyColor: "#ffffff",
  colorKeyTolerance: 10,
  luminanceKey: 0,
  flipHorizontal: false,
  flipVertical: false,
  invertLuminance: false,
  invertHue: false,
  invertAlpha: false,
  monochromeColor: "#ffffff",
  monochromeStrength: 100,
  gradientStartColor: "#ffffff",
  gradientEndColor: "#000000",
  gradientAngle: 0,
  gradientStrength: 0,
  glowColor: "#ffffff",
  glowStrength: 0,
  glowRadius: 8,
  blurRadius: 0,
  mosaicSize: 8,
  mosaicStrength: 0,
  clipTop: 0,
  clipBottom: 0,
  clipLeft: 0,
  clipRight: 0,
  diagonalClipAngle: 45,
  maskShape: "rectangle",
  maskX: 0,
  maskY: 0,
  maskWidth: 100,
  maskHeight: 100,
  maskBlur: 0,
  maskInvert: false,
  shadowColor: "#000000",
  shadowOpacity: 0,
  shadowDistance: 8,
  shadowAngle: 45,
  shadowBlur: 8,
  outlineColor: "#000000",
  outlineWidth: 0,
  outlineOpacity: 100,
  imageLoopX: 1,
  imageLoopY: 1,
  imageLoopOffsetX: 0,
  imageLoopOffsetY: 0,
  imageLoopMirror: false,
  imageLoopOpacity: 100,
};

export const normalizeEffect = (effect: EffectInstance): EffectInstance => ({
  ...effect,
  values: {
    ...defaultEffectParameters,
    ...effect.values,
    blurRadius: Math.max(
      0,
      Number.isFinite(Number(effect.values.blurRadius))
        ? Number(effect.values.blurRadius)
        : defaultEffectParameters.blurRadius,
    ),
  },
});
