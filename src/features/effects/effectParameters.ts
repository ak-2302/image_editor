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
};
