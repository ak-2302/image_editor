import type { EffectInstance } from "../project/projectTypes";

const clamp = (value: number) => Math.max(0, Math.min(1, value));

const hexToRgb = (value: string) => {
  const hex = value.replace("#", "");
  const normalized = hex.length === 3 ? hex.split("").map((part) => part + part).join("") : hex;
  const parsed = Number.parseInt(normalized, 16);
  return {
    red: ((parsed >> 16) & 255) / 255,
    green: ((parsed >> 8) & 255) / 255,
    blue: (parsed & 255) / 255,
  };
};

const rgbToHex = (red: number, green: number, blue: number) =>
  `#${[red, green, blue]
    .map((value) => Math.round(clamp(value) * 255).toString(16).padStart(2, "0"))
    .join("")}`;

export const getEffectColor = (color: string, effects: EffectInstance[]) => {
  let { red, green, blue } = hexToRgb(color);
  let max = Math.max(red, green, blue);
  let min = Math.min(red, green, blue);
  let lightness = (max + min) / 2;
  let saturation = 0;
  let hue = 0;
  if (max !== min) {
    const delta = max - min;
    saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === red) hue = (green - blue) / delta + (green < blue ? 6 : 0);
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
    hue *= 60;
  }
  for (const effect of effects) {
    if (effect.name === "colorAdjust") {
      hue = (hue + (effect.values.hue ?? 0)) % 360;
      saturation = clamp(saturation * ((effect.values.saturation ?? 100) / 100));
      lightness = clamp(lightness * ((effect.values.lightness ?? 100) / 100));
    }
    if (effect.name === "flip") {
      if (effect.values.invertHue) hue = (hue + 180) % 360;
      if (effect.values.invertLuminance) lightness = 1 - lightness;
    }
  }
  if (saturation === 0) return rgbToHex(lightness, lightness, lightness);
  const hueToRgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;
  red = hueToRgb(p, q, hue / 360 + 1 / 3);
  green = hueToRgb(p, q, hue / 360);
  blue = hueToRgb(p, q, hue / 360 - 1 / 3);
  return rgbToHex(red, green, blue);
};
