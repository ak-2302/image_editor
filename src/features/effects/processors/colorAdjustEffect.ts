type ColorAdjustValues = { hue?: number; saturation?: number; lightness?: number };

export const getColorAdjustFilter = (values: ColorAdjustValues) =>
  `hue-rotate(${values.hue ?? 0}deg) saturate(${values.saturation ?? 100}%) brightness(${values.lightness ?? 100}%)`;
